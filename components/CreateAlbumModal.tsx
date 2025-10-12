import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Album } from '../types';
import UploadIcon from './icons/UploadIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';

interface CreateAlbumModalProps {
  albumToEdit?: Album | null;
  onClose: () => void;
  onSuccess: () => void;
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

const ImageUploadField: React.FC<{
    label: string;
    id: string;
    previewUrl: string | null;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemove: () => void;
    aspectRatio?: 'aspect-square' | 'aspect-video';
}> = ({ label, id, previewUrl, onChange, onRemove, aspectRatio = 'aspect-square' }) => (
    <div>
        <div className="flex justify-between items-baseline mb-1">
            <label className="text-sm font-medium text-base-content/80">{label}</label>
            {previewUrl && (
                <button type="button" onClick={onRemove} className="text-xs font-semibold text-red-500 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded">
                    Удалить
                </button>
            )}
        </div>
        <label htmlFor={id} className={`group relative w-full ${aspectRatio} bg-base-100 border-2 border-dashed border-base-300 rounded-lg flex items-center justify-center cursor-pointer`}>
            {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-lg" />
            ) : (
                <div className="text-center text-base-content/60">
                    <UploadIcon className="w-8 h-8 mx-auto" />
                    <span className="text-sm">Нажмите для загрузки</span>
                </div>
            )}
            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-sm font-semibold">Сменить</span>
            </div>
        </label>
        <input id={id} type="file" accept="image/png, image/jpeg, image/webp" onChange={onChange} className="hidden" />
    </div>
);

type ThemeColor = 'default' | 'primary' | 'secondary' | 'glass';

const ColorSwatch: React.FC<{
    value: ThemeColor;
    selected: ThemeColor;
    onClick: (value: ThemeColor) => void;
    label: string;
    bgColor: string;
}> = ({ value, selected, onClick, label, bgColor }) => {
    const isSelected = value === selected;
    return (
        <button
            type="button"
            onClick={() => onClick(value)}
            className={`w-full p-3 rounded-lg border-2 transition-all duration-200 ${isSelected ? 'border-primary' : 'border-transparent'}`}
        >
            <div className={`w-full h-12 rounded-md flex items-center justify-center ${bgColor}`}>
                 {isSelected && <CheckCircleIcon className="w-6 h-6 text-primary-content" />}
            </div>
            <p className={`mt-2 text-sm font-medium ${isSelected ? 'text-primary' : 'text-base-content'}`}>{label}</p>
        </button>
    );
};


const CreateAlbumModal: React.FC<CreateAlbumModalProps> = ({ albumToEdit, onClose, onSuccess }) => {
    const isEditMode = !!albumToEdit;
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [coverText, setCoverText] = useState('');
    const [headerFile, setHeaderFile] = useState<File | null>(null);
    const [headerPreview, setHeaderPreview] = useState<string | null>(null);
    const [isHeaderImageRemoved, setIsHeaderImageRemoved] = useState(false);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [isCoverImageRemoved, setIsCoverImageRemoved] = useState(false);
    const [themeColor, setThemeColor] = useState<ThemeColor>('default');
    const [isPublic, setIsPublic] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        if (isEditMode) {
            setName(albumToEdit.name);
            setDescription(albumToEdit.description || '');
            setCoverText(albumToEdit.cover_text || '');
            setHeaderPreview(albumToEdit.header_image_url);
            setCoverPreview(albumToEdit.cover_image_url);
            setThemeColor(albumToEdit.theme_color as ThemeColor || 'default');
            setIsPublic(albumToEdit.is_public);
        }
        return () => {
            isMounted.current = false;
        };
    }, [albumToEdit, isEditMode]);

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

    const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            setHeaderFile(file);
            setHeaderPreview(URL.createObjectURL(file));
            setIsHeaderImageRemoved(false);
        }
    };
    
    const handleRemoveHeaderImage = () => {
        setHeaderFile(null);
        setHeaderPreview(null);
        if (albumToEdit?.header_image_url) {
            setIsHeaderImageRemoved(true);
        }
    };

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            const file = e.target.files[0];
            setCoverFile(file);
            setCoverPreview(URL.createObjectURL(file));
            setIsCoverImageRemoved(false);
        }
    };

    const handleRemoveCoverImage = () => {
        setCoverFile(null);
        setCoverPreview(null);
        if (albumToEdit?.cover_image_url) {
            setIsCoverImageRemoved(true);
        }
    };

    const uploadImage = async (file: File, userId: string, albumId: string, type: 'header' | 'cover'): Promise<string> => {
        const fileExt = file.name.split('.').pop();
        const filePath = `album-art/${userId}/${albumId}/${type}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
            .from('collectibles')
            .upload(filePath, file, { upsert: true, cacheControl: '3600' });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('collectibles').getPublicUrl(filePath);
        return `${data.publicUrl}?t=${new Date().getTime()}`;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Пользователь не авторизован");

            const albumData = { 
                name, 
                description: description || null,
                cover_text: coverText || null,
                theme_color: themeColor,
                owner_id: user.id,
                is_public: isPublic,
            };
            
            let albumId = albumToEdit?.id;

            if (isEditMode && albumId) {
                const { error: updateError } = await supabase.from('albums')
                    .update({ name, description: description || null, cover_text: coverText || null, theme_color: themeColor, is_public: isPublic })
                    .eq('id', albumId);
                if (updateError) throw updateError;
            } else {
                const { data: newAlbum, error: insertError } = await supabase.from('albums')
                    .insert(albumData)
                    .select()
                    .single();
                if (insertError) throw insertError;
                albumId = newAlbum.id;
            }

            if (!albumId) throw new Error("Не удалось получить ID альбома.");

            const imageUpdates: { header_image_url?: string | null; cover_image_url?: string | null } = {};

            if (headerFile) {
                imageUpdates.header_image_url = await uploadImage(headerFile, user.id, albumId, 'header');
            } else if (isHeaderImageRemoved && albumToEdit?.header_image_url) {
                imageUpdates.header_image_url = null;
                try {
                    const path = new URL(albumToEdit.header_image_url).pathname.split('/collectibles/')[1];
                    if (path) await supabase.storage.from('collectibles').remove([path]);
                } catch (err) { console.error("Could not delete old header from storage:", err); }
            }

            if (coverFile) {
                imageUpdates.cover_image_url = await uploadImage(coverFile, user.id, albumId, 'cover');
            } else if (isCoverImageRemoved && albumToEdit?.cover_image_url) {
                imageUpdates.cover_image_url = null;
                try {
                    const path = new URL(albumToEdit.cover_image_url).pathname.split('/collectibles/')[1];
                    if (path) await supabase.storage.from('collectibles').remove([path]);
                } catch (err) { console.error("Could not delete old cover from storage:", err); }
            }

            if (Object.keys(imageUpdates).length > 0) {
                 const { error: imageUpdateError } = await supabase.from('albums')
                    .update(imageUpdates)
                    .eq('id', albumId);
                if (imageUpdateError) throw imageUpdateError;
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
            <div className="bg-base-200 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 relative shadow-2xl" onClick={e => e.stopPropagation()}>
                <h1 className="text-2xl font-bold mb-6">{isEditMode ? 'Редактировать альбом' : 'Создать новый альбом'}</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <InputField label="Название альбома" id="name" type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="напр., Марки СССР 1961-1991" />
                    <div>
                        <label htmlFor="description" className="text-sm font-medium text-base-content/80">Описание (необязательно)</label>
                        <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 bg-base-100 border border-base-300 rounded-md text-sm shadow-sm placeholder-base-content/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="Краткое описание содержимого альбома"></textarea>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                        <ImageUploadField label="Обложка альбома" id="cover-upload" previewUrl={coverPreview} onChange={handleCoverChange} onRemove={handleRemoveCoverImage} aspectRatio="aspect-square" />
                        <ImageUploadField label="Фон альбома" id="header-upload" previewUrl={headerPreview} onChange={handleHeaderChange} onRemove={handleRemoveHeaderImage} aspectRatio="aspect-video" />
                    </div>
                    
                    <InputField label="Текст на обложке (если нет изображения)" id="coverText" type="text" value={coverText} onChange={e => setCoverText(e.target.value)} placeholder="напр., СССР 1961" />


                     <div>
                        <label className="text-sm font-medium text-base-content/80">Цвет альбома</label>
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                            <ColorSwatch value="default" selected={themeColor} onClick={setThemeColor} label="Стандарт" bgColor="bg-base-300" />
                            <ColorSwatch value="primary" selected={themeColor} onClick={setThemeColor} label="Акцент" bgColor="bg-primary" />
                            <ColorSwatch value="secondary" selected={themeColor} onClick={setThemeColor} label="Вторичный" bgColor="bg-secondary" />
                            <ColorSwatch value="glass" selected={themeColor} onClick={setThemeColor} label="Стекло" bgColor="bg-gray-500/10 backdrop-blur-sm border border-white/20" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between bg-base-100 p-3 rounded-lg border border-base-300">
                        <div>
                            <label htmlFor="isPublic" className="font-medium text-base-content">
                                Публичный альбом
                            </label>
                            <p className="text-xs text-base-content/70">Любой сможет видеть этот альбом в вашем профиле.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsPublic(!isPublic)}
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-base-200 ${
                                isPublic ? 'bg-primary' : 'bg-base-300'
                            }`}
                            role="switch"
                            aria-checked={isPublic}
                        >
                            <span
                                aria-hidden="true"
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    isPublic ? 'translate-x-5' : 'translate-x-0'
                                }`}
                            />
                        </button>
                        <input type="checkbox" id="isPublic" checked={isPublic} onChange={() => {}} className="hidden" />
                    </div>
                    
                    {error && <p className="text-sm text-center text-red-500">{error}</p>}
                    
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-full text-sm font-medium bg-base-300 hover:bg-base-content/20 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary">
                            Отмена
                        </button>
                        <button type="submit" disabled={loading} className="px-6 py-2 rounded-full text-sm font-bold text-black bg-primary motion-safe:hover:scale-105 transition-transform disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-primary-focus">
                            {loading ? (isEditMode ? 'Сохранение...' : 'Создание...') : (isEditMode ? 'Сохранить изменения' : 'Создать альбом')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateAlbumModal;