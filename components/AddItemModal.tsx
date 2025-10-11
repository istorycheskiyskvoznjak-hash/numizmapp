import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { GoogleGenAI, Type } from "@google/genai";
import { Album } from '../types';

interface AddItemModalProps {
  onClose: () => void;
  onSuccess: () => void;
  initialAlbumId?: string | null;
}

const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, id, ...props }) => (
    <div>
        <label htmlFor={id} className="text-sm font-medium text-base-content/80">
            {label}
        </label>
        <input
            id={id}
            {...props}
            className="mt-1 block w-full px-3 py-2 bg-base-100 border border-base-300 rounded-md text-sm shadow-sm placeholder-base-content/50
                       focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
    </div>
);

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

const BUCKET_NAME = 'collectibles';

const AddItemModal: React.FC<AddItemModalProps> = ({ onClose, onSuccess, initialAlbumId }) => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState<'coin' | 'stamp' | 'banknote'>('coin');
    const [country, setCountry] = useState('');
    const [year, setYear] = useState<string>(String(new Date().getFullYear()));
    const [description, setDescription] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [albums, setAlbums] = useState<Album[]>([]);
    const [selectedAlbumId, setSelectedAlbumId] = useState<string>(initialAlbumId || '');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);

    const isMounted = useRef(true);
    useEffect(() => {
      isMounted.current = true;
      return () => {
        isMounted.current = false;
      };
    }, []);

    useEffect(() => {
        const fetchAlbums = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data, error } = await supabase
                .from('albums')
                .select('*')
                .eq('owner_id', user.id)
                .order('name', { ascending: true });
            if (error) {
                console.error("Error fetching albums:", error);
            } else if (isMounted.current) {
                setAlbums(data);
            }
        };
        fetchAlbums();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setImagePreview(URL.createObjectURL(selectedFile));
            setAiError(null);
        }
    };

    const handleAnalyzeImage = async () => {
        if (!file) return;

        setIsAnalyzing(true);
        setAiError(null);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const base64Data = await fileToBase64(file);
            
            const prompt = `Ты — эксперт по нумизматике и филателии. Проанализируй это изображение коллекционного предмета. Предоставь информацию о нем в соответствии с указанной схемой JSON. Все поля в ответе должны быть на русском языке. Если ты не можешь определить какое-либо поле, сделай разумное предположение или оставь его пустым (для строковых полей) или null (для года).`;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: {
                    parts: [
                        { text: prompt },
                        { inlineData: { mimeType: file.type, data: base64Data } }
                    ]
                },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING, description: "Название коллекционного предмета на русском языке." },
                            country: { type: Type.STRING, description: "Страна происхождения на русском языке." },
                            year: { type: Type.NUMBER, description: "Год выпуска. Может быть null, если неизвестен." },
                            description: { type: Type.STRING, description: "Краткое описание предмета на русском языке." },
                            category: { type: Type.STRING, description: "Категория: 'coin', 'stamp' или 'banknote'." }
                        },
                        required: ['name', 'country', 'year', 'description', 'category']
                    }
                }
            });

            const result = JSON.parse(response.text);

            if (isMounted.current) {
                if (result.category && ['coin', 'stamp', 'banknote'].includes(result.category)) {
                    setCategory(result.category);
                }
                setName(result.name?.trim() || '');
                setCountry(result.country?.trim() || '');
                setYear(String(result.year || ''));
                setDescription(result.description?.trim() || '');
            }

        } catch (err: any) {
            console.error("AI Analysis Error:", err);
            if(isMounted.current) {
                setAiError("Не удалось проанализировать изображение. Пожалуйста, попробуйте еще раз или заполните данные вручную.");
            }
        } finally {
            if (isMounted.current) {
                setIsAnalyzing(false);
            }
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        setLoading(true);
        setError(null);
        
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not found");
            
            let imageUrl: string | null = null;
            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}.${fileExt}`;
                const filePath = `${user.id}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from(BUCKET_NAME)
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from(BUCKET_NAME)
                    .getPublicUrl(filePath);
                imageUrl = publicUrl;
            }

            const itemToInsert = {
                name: name.trim(),
                category,
                country: country.trim(),
                year: parseInt(year) || new Date().getFullYear(),
                description: description.trim(),
                image_url: imageUrl,
                owner_id: user.id,
                album_id: selectedAlbumId === '' ? null : selectedAlbumId
            };

            const { data: newCollectible, error: insertError } = await supabase
                .from('collectibles')
                .insert(itemToInsert)
                .select()
                .single();

            if (insertError) throw insertError;
            
            onSuccess();
        } catch (error: any) {
            if (isMounted.current) {
                setError(error.message || 'An unexpected error occurred.');
            }
            console.error(error);
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-base-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 relative shadow-2xl" onClick={e => e.stopPropagation()}>
                <h1 className="text-2xl font-bold mb-6">Добавить новый предмет</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                           <InputField label="Название" id="name" type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="напр., Серебряный динарий"/>
                           <div>
                                <label htmlFor="category" className="text-sm font-medium text-base-content/80">Категория</label>
                                <select id="category" value={category} onChange={e => setCategory(e.target.value as any)} className="mt-1 block w-full px-3 py-2 bg-base-100 border border-base-300 rounded-md text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary">
                                    <option value="coin">Монета</option>
                                    <option value="stamp">Марка</option>
                                    <option value="banknote">Банкнота</option>
                                </select>
                           </div>
                           <InputField label="Страна" id="country" type="text" value={country} onChange={e => setCountry(e.target.value)} required placeholder="напр., Римская империя"/>
                           <InputField label="Год" id="year" type="number" value={year} onChange={e => setYear(e.target.value)} required placeholder="напр., 112"/>
                        </div>
                        <div>
                             <label className="text-sm font-medium text-base-content/80">Изображение</label>
                             <div className="relative mt-1 flex justify-center items-center w-full h-48 bg-base-100 border-2 border-base-300 border-dashed rounded-md">
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Preview" className="h-full w-full object-contain p-2 rounded-md" />
                                ) : (
                                    <div className="text-center text-base-content/60">
                                        <p>Нажмите для загрузки</p>
                                        <p className="text-xs">PNG, JPG, WEBP</p>
                                    </div>
                                )}
                                <input type="file" onChange={handleFileChange} accept="image/*" className="absolute h-full w-full opacity-0 cursor-pointer"/>
                             </div>
                             {file && (
                                <button type="button" onClick={handleAnalyzeImage} disabled={isAnalyzing || loading} className="mt-2 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-base-content bg-base-300 hover:bg-secondary transition-all disabled:opacity-50">
                                    {isAnalyzing ? 'Анализ...' : 'Анализ с ИИ'}
                                </button>
                             )}
                             {aiError && <p className="text-xs text-center text-red-500 mt-1">{aiError}</p>}
                        </div>
                    </div>
                     <div>
                        <label htmlFor="album" className="text-sm font-medium text-base-content/80">Альбом (необязательно)</label>
                        <select id="album" value={selectedAlbumId} onChange={e => setSelectedAlbumId(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-base-100 border border-base-300 rounded-md text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary">
                            <option value="">Без альбома</option>
                            {albums.map(album => (
                                <option key={album.id} value={album.id}>{album.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="description" className="text-sm font-medium text-base-content/80">Описание</label>
                        <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={4} className="mt-1 block w-full px-3 py-2 bg-base-100 border border-base-300 rounded-md text-sm shadow-sm placeholder-base-content/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="Подробности о состоянии, истории и т.д."></textarea>
                    </div>

                    {error && <p className="text-sm text-center text-red-500">{error}</p>}
                    
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-full text-sm font-medium bg-base-300 hover:bg-base-content/20 transition-colors">
                            Отмена
                        </button>
                        <button type="submit" disabled={loading || isAnalyzing} className="px-6 py-2 rounded-full text-sm font-bold text-black bg-primary hover:scale-105 transition-transform disabled:opacity-50">
                            {loading ? 'Сохранение...' : 'Сохранить'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddItemModal;