import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { WantlistItem, WantlistList } from '../types';
import XCircleIcon from './icons/XCircleIcon';

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

const BUCKET_NAME = 'collectibles';

interface WantlistFormModalProps {
    itemToEdit?: WantlistItem | null;
    onClose: () => void;
    onSuccess: () => void;
    initialListId?: string;
}

const WantlistFormModal: React.FC<WantlistFormModalProps> = ({ itemToEdit, onClose, onSuccess, initialListId }) => {
    const [name, setName] = useState('');
    const [details, setDetails] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isDeletingImage, setIsDeletingImage] = useState(false);
    const [lists, setLists] = useState<WantlistList[]>([]);
    const [selectedListId, setSelectedListId] = useState<string>('');
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isMounted = useRef(true);

    const isEditMode = !!itemToEdit;

    useEffect(() => {
        isMounted.current = true;
        if (isEditMode) {
            setName(itemToEdit.name);
            setDetails(itemToEdit.details);
            setDescription(itemToEdit.description);
            setImagePreview(itemToEdit.image_url || null);
            setSelectedListId(itemToEdit.list_id || '');
        } else {
            setSelectedListId(initialListId || '');
        }
        return () => {
            isMounted.current = false;
        };
    }, [itemToEdit, isEditMode, initialListId]);

    useEffect(() => {
        const fetchLists = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data, error } = await supabase
                .from('wantlist_lists')
                .select('*')
                .eq('user_id', user.id);
            if (error) {
                console.error("Error fetching wantlist lists", error);
            } else if (isMounted.current) {
                setLists(data);
                // If there's no initial list ID and not in edit mode, select the first list by default
                if (!initialListId && !isEditMode && data.length > 0) {
                    setSelectedListId(data[0].id);
                }
            }
        };
        fetchLists();
    }, [initialListId, isEditMode]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
          if (event.key === 'Escape') {
            onClose();
          }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
          window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setImagePreview(URL.createObjectURL(selectedFile));
            setIsDeletingImage(false);
        }
    };
    
    const handleRemoveImage = () => {
        setFile(null);
        setImagePreview(null);
        if (itemToEdit?.image_url) {
            setIsDeletingImage(true);
        }
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedListId) {
            setError("Пожалуйста, выберите вишлист.");
            return;
        }
        setLoading(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Пользователь не авторизован");

            let imageUrl = itemToEdit?.image_url || null;

            // Handle image deletion
            if (isDeletingImage && itemToEdit?.image_url) {
                const oldImageUrl = new URL(itemToEdit.image_url);
                const oldFilePath = oldImageUrl.pathname.split('/').slice(2).join('/');
                await supabase.storage.from(BUCKET_NAME).remove([oldFilePath]);
                imageUrl = null;
            }
            
            // Handle new image upload
            if (file) {
                 // If there was an old image, remove it first
                if (itemToEdit?.image_url && !isDeletingImage) {
                    try {
                        const oldImageUrl = new URL(itemToEdit.image_url);
                        const oldFilePath = oldImageUrl.pathname.split('/').slice(2).join('/');
                        await supabase.storage.from(BUCKET_NAME).remove([oldFilePath]);
                    } catch (e) { console.error("Could not parse or delete old image:", e); }
                }

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

            const itemData = { 
                name, 
                details, 
                description, 
                user_id: user.id,
                image_url: imageUrl,
                list_id: selectedListId,
            };

            if (isEditMode) {
                const { error: updateError } = await supabase
                    .from('wantlist')
                    .update(itemData)
                    .eq('id', itemToEdit.id);
                if (updateError) throw updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('wantlist')
                    .insert(itemData);
                if (insertError) throw insertError;
            }
            
            onSuccess();
        } catch (error: any) {
            if (isMounted.current) {
                setError(error.message || 'Произошла непредвиденная ошибка.');
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
            <div className="bg-base-200 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-8 relative shadow-2xl" onClick={e => e.stopPropagation()}>
                <h1 className="text-2xl font-bold mb-6">{isEditMode ? 'Редактировать элемент' : 'Добавить в вишлист'}</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="list_id" className="text-sm font-medium text-base-content/80">Вишлист</label>
                        <select 
                            id="list_id" 
                            value={selectedListId} 
                            onChange={(e) => setSelectedListId(e.target.value)}
                            required
                            className="mt-1 block w-full px-3 py-2 bg-base-100 border border-base-300 rounded-md text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        >
                            <option value="" disabled>-- Выберите список --</option>
                            {lists.map(list => (
                                <option key={list.id} value={list.id}>{list.name}</option>
                            ))}
                        </select>
                    </div>
                    <InputField label="Название" id="name" type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="напр., Денарий Траяна" />
                    <InputField label="Детали" id="details" type="text" value={details} onChange={e => setDetails(e.target.value)} placeholder="напр., Римская империя, 98-117 гг." />
                     <div>
                        <label className="text-sm font-medium text-base-content/80">Изображение (необязательно)</label>
                        <div className="relative mt-1 flex justify-center items-center w-full h-40 bg-base-100 border-2 border-base-300 border-dashed rounded-md">
                            {imagePreview ? (
                                <>
                                    <img src={imagePreview} alt="Preview" className="h-full w-full object-contain p-2 rounded-md" />
                                    <button 
                                        type="button" 
                                        onClick={handleRemoveImage}
                                        className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/80 transition-colors"
                                        aria-label="Удалить изображение"
                                    >
                                        <XCircleIcon className="w-6 h-6" />
                                    </button>
                                </>
                            ) : (
                                <div className="text-center text-base-content/60">
                                    <p>Нажмите для загрузки</p>
                                    <p className="text-xs">PNG, JPG, WEBP</p>
                                </div>
                            )}
                            <input type="file" onChange={handleFileChange} accept="image/*" className="absolute h-full w-full opacity-0 cursor-pointer"/>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="description" className="text-sm font-medium text-base-content/80">Описание</label>
                        <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={4} className="mt-1 block w-full px-3 py-2 bg-base-100 border border-base-300 rounded-md text-sm shadow-sm placeholder-base-content/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="Опишите, что именно вы ищете..."></textarea>
                    </div>
                    
                    {error && <p className="text-sm text-center text-red-500">{error}</p>}
                    
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-full text-sm font-medium bg-base-300 hover:bg-base-content/20 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary">
                            Отмена
                        </button>
                        <button type="submit" disabled={loading} className="px-6 py-2 rounded-full text-sm font-bold text-black bg-primary motion-safe:hover:scale-105 transition-transform disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-primary-focus">
                            {loading ? 'Сохранение...' : 'Сохранить'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default WantlistFormModal;