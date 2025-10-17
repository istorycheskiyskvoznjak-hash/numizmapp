
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { GoogleGenAI, Type } from "@google/genai";
import { Collectible, Album } from '../types';
import CameraIcon from './icons/CameraIcon';
import UploadIcon from './icons/UploadIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import CountrySelect from './CountrySelect';
import TrashIcon from './icons/TrashIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';

interface BulkScanModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

type AIResult = Partial<Omit<Collectible, 'id' | 'owner_id' | 'created_at'>> & { included: boolean; mintage?: number; private_value?: number; };

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });

const BulkScanModal: React.FC<BulkScanModalProps> = ({ onClose, onSuccess }) => {
    const [step, setStep] = useState<'capture' | 'analyzing' | 'review'>('capture');
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [aiResults, setAiResults] = useState<AIResult[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const setupCamera = async () => {
        try {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError("Не удалось получить доступ к камере. Попробуйте загрузить файл.");
        }
    };

    useEffect(() => {
        if (step === 'capture') {
            setupCamera();
        }
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, [step]);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            const dataUrl = canvas.toDataURL('image/jpeg');
            setImageSrc(dataUrl);
            canvas.toBlob(blob => {
                if (blob) setImageFile(new File([blob], "capture.jpg", { type: "image/jpeg" }));
            }, 'image/jpeg');
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImageSrc(URL.createObjectURL(file));
        }
    };

    const handleAnalyze = async () => {
        if (!imageFile) return;
        setStep('analyzing');
        setError(null);

        if (!process.env.API_KEY) {
            setError("API-ключ Gemini не настроен. Проверьте конфигурацию сервера.");
            setStep('capture');
            setImageFile(null);
            setImageSrc(null);
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const base64Data = await fileToBase64(imageFile);

            const prompt = `You are an expert numismatist and philatelist. Analyze this image containing multiple collectible items. Identify each distinct item. For each item, provide its details according to the specified JSON schema. All text fields in the response must be in Russian. For the 'category' field, use one of 'coin', 'stamp', or 'banknote'. For the 'material' field, use one of: 'gold', 'silver', 'copper', 'bronze', 'iron', 'other', 'paper'. If a field cannot be determined, provide a reasonable guess or default value. Return an array of all identified items.`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [{ text: prompt }, { inlineData: { mimeType: imageFile.type, data: base64Data } }] },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                country: { type: Type.STRING },
                                year: { type: Type.NUMBER },
                                description: { type: Type.STRING },
                                category: { type: Type.STRING },
                                material: { type: Type.STRING },
                                mint: { type: Type.STRING },
                                mintage: { type: Type.NUMBER },
                            }
                        }
                    }
                }
            });
            
            const results = JSON.parse(response.text) as Partial<Collectible>[];
            setAiResults(results.map(r => ({ ...r, included: true })));
            setStep('review');

        } catch (err) {
            console.error("AI Analysis Error:", err);
            setError("Не удалось проанализировать изображение. Попробуйте еще раз с более четким фото.");
            setStep('capture'); // Go back to capture
            setImageFile(null);
            setImageSrc(null);
        }
    };

    const handleResultChange = (index: number, field: keyof AIResult, value: any) => {
        setAiResults(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
    };
    
    const handleRemoveResult = (index: number) => {
        setAiResults(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Пользователь не авторизован");

            const itemsToAdd = aiResults
                .filter(r => r.included)
                .map(r => ({
                    owner_id: user.id,
                    name: r.name || 'Без названия',
                    category: r.category || 'coin',
                    country: r.country || 'Неизвестно',
                    year: r.year || new Date().getFullYear(),
                    description: r.description || '',
                    grade: r.grade || null,
                    rarity: r.rarity || null,
                    material: r.material || null,
                    mint: r.mint || null,
                    mintage: r.mintage ? Number(r.mintage) : null,
                    private_value: r.private_value ? Number(r.private_value) : null,
                }));

            if (itemsToAdd.length === 0) {
                onSuccess();
                return;
            }

            const { error: insertError } = await supabase.from('collectibles').insert(itemsToAdd);
            if (insertError) throw insertError;
            
            onSuccess();

        } catch (err: any) {
            setError(err.message || 'Не удалось сохранить предметы.');
            setIsSubmitting(false);
        }
    };

    const includedCount = aiResults.filter(r => r.included).length;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-base-200 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold p-6 flex-shrink-0 border-b border-base-300">Сканировать несколько предметов</h2>
                
                <div className="flex-grow p-6 overflow-y-auto">
                    {step === 'capture' && (
                        <div className="flex flex-col items-center gap-4">
                            {error && <p className="text-red-500 bg-red-500/10 p-3 rounded-lg w-full text-center">{error}</p>}
                            <div className="w-full max-w-lg aspect-video bg-base-100 rounded-lg overflow-hidden flex items-center justify-center">
                                {imageSrc ? (
                                    <img src={imageSrc} alt="Capture preview" className="h-full w-full object-contain" />
                                ) : (
                                    <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover"></video>
                                )}
                            </div>
                            <canvas ref={canvasRef} className="hidden"></canvas>
                            {imageSrc ? (
                                <div className="flex gap-4">
                                    <button onClick={() => { setImageFile(null); setImageSrc(null); }} className="px-6 py-2 rounded-full text-sm font-medium bg-base-300 hover:bg-base-content/20 transition-colors">Переснять</button>
                                    <button onClick={handleAnalyze} className="px-6 py-2 rounded-full text-sm font-bold text-black bg-primary motion-safe:hover:scale-105 transition-transform">Сканировать предметы</button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-4">
                                    <button onClick={handleCapture} className="flex items-center gap-2 bg-primary text-primary-content font-semibold py-2 px-5 rounded-full text-sm transition-transform hover:scale-105">
                                        <CameraIcon className="w-5 h-5" /> Сфотографировать
                                    </button>
                                    <label className="flex items-center gap-2 bg-base-300 font-semibold py-2 px-5 rounded-full text-sm cursor-pointer hover:bg-base-content/20">
                                        <UploadIcon className="w-5 h-5" /> Загрузить файл
                                        <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                                    </label>
                                </div>
                            )}
                        </div>
                    )}
                    {step === 'analyzing' && (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                             <img src={imageSrc!} alt="Analyzing" className="max-h-64 w-auto rounded-lg" />
                            <SpinnerIcon className="w-12 h-12 text-primary animate-spin" />
                            <p className="text-lg text-base-content/80">Анализ... Это может занять несколько секунд.</p>
                        </div>
                    )}
                    {step === 'review' && (
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                            <div className="md:col-span-4">
                                <h3 className="font-bold mb-2">Исходное изображение</h3>
                                <img src={imageSrc!} alt="Review" className="w-full rounded-lg" />
                                <button onClick={() => setStep('capture')} className="text-sm text-primary hover:underline mt-2">Использовать другое фото</button>
                            </div>
                            <div className="md:col-span-8 space-y-3">
                                <h3 className="font-bold">Обнаруженные предметы ({aiResults.length})</h3>
                                {aiResults.map((result, index) => (
                                    <div key={index} className="bg-base-100 p-3 rounded-lg border border-base-300 flex gap-3">
                                        <input type="checkbox" checked={result.included} onChange={e => handleResultChange(index, 'included', e.target.checked)} className="mt-1 flex-shrink-0" />
                                        <div className={`flex-grow space-y-2 transition-opacity ${!result.included ? 'opacity-50' : ''}`}>
                                            <input type="text" value={result.name || ''} onChange={e => handleResultChange(index, 'name', e.target.value)} className="w-full font-semibold bg-transparent focus:outline-none focus:ring-1 focus:ring-primary rounded px-1" />
                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <input type="text" value={result.country || ''} onChange={e => handleResultChange(index, 'country', e.target.value)} placeholder="Страна" className="bg-base-200 p-1 rounded" />
                                                <input type="number" value={result.year || ''} onChange={e => handleResultChange(index, 'year', e.target.value)} placeholder="Год" className="bg-base-200 p-1 rounded" />
                                                <select value={result.category || ''} onChange={e => handleResultChange(index, 'category', e.target.value)} className="bg-base-200 p-1 rounded">
                                                    <option value="coin">Монета</option><option value="stamp">Марка</option><option value="banknote">Банкнота</option>
                                                </select>
                                                <input type="number" value={result.mintage || ''} onChange={e => handleResultChange(index, 'mintage', e.target.value)} placeholder="Тираж" className="bg-base-200 p-1 rounded" />
                                                <input type="number" value={result.private_value || ''} onChange={e => handleResultChange(index, 'private_value', e.target.value)} placeholder="Личная оценка (€)" className="bg-base-200 p-1 rounded" />
                                            </div>
                                        </div>
                                        <button onClick={() => handleRemoveResult(index)} className="p-1 text-red-500/70 hover:text-red-500 flex-shrink-0 self-start"><TrashIcon className="w-5 h-5"/></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-base-300/50 flex justify-between items-center flex-shrink-0 rounded-b-2xl">
                    <button type="button" onClick={onClose} className="px-6 py-2 rounded-full text-sm font-medium bg-base-300 hover:bg-base-content/20 transition-colors">
                        Отмена
                    </button>
                    {step === 'review' && (
                        <button onClick={handleSubmit} disabled={isSubmitting || includedCount === 0} className="px-6 py-2 rounded-full text-sm font-bold text-black bg-primary motion-safe:hover:scale-105 transition-transform disabled:opacity-50 flex items-center gap-2">
                            {isSubmitting ? <><SpinnerIcon className="w-4 h-4 animate-spin"/> Добавление...</> : <> <CheckCircleIcon className="w-5 h-5" /> Добавить {includedCount} {includedCount === 1 ? 'предмет' : (includedCount > 1 && includedCount < 5) ? 'предмета' : 'предметов'} </>}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BulkScanModal;
