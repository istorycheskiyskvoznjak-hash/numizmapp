import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Profile } from '../types';

interface EditProfileModalProps {
  profile: Profile;
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

const EditProfileModal: React.FC<EditProfileModalProps> = ({ profile, onClose, onSuccess }) => {
    const [name, setName] = useState(profile.name);
    const [handle, setHandle] = useState(profile.handle);
    const [location, setLocation] = useState(profile.location);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url);
    const [headerFile, setHeaderFile] = useState<File | null>(null);
    const [headerPreview, setHeaderPreview] = useState<string | null>(profile.header_image_url);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

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

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setHeaderFile(file);
            setHeaderPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            let updatedAvatarUrl = profile.avatar_url;
            let updatedHeaderUrl = profile.header_image_url;

            if (avatarFile) {
                const fileExt = avatarFile.name.split('.').pop();
                const filePath = `${profile.id}/avatar.${fileExt}`;
                
                const { error: uploadError } = await supabase.storage
                    .from('avatars') 
                    .upload(filePath, avatarFile, {
                        cacheControl: '3600',
                        upsert: true,
                    });

                if (uploadError) throw uploadError;

                const { data } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(filePath);
                
                updatedAvatarUrl = `${data.publicUrl}?t=${new Date().getTime()}`;
            }

            if (headerFile) {
                const fileExt = headerFile.name.split('.').pop();
                const filePath = `${profile.id}/header.${fileExt}`;
                
                const { error: uploadError } = await supabase.storage
                    .from('headers')
                    .upload(filePath, headerFile, {
                        cacheControl: '3600',
                        upsert: true,
                    });

                if (uploadError) throw uploadError;

                const { data } = supabase.storage
                    .from('headers')
                    .getPublicUrl(filePath);
                
                updatedHeaderUrl = `${data.publicUrl}?t=${new Date().getTime()}`;
            }
            
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    name,
                    handle,
                    location,
                    avatar_url: updatedAvatarUrl,
                    header_image_url: updatedHeaderUrl
                })
                .eq('id', profile.id);

            if (updateError) throw updateError;
            
            onSuccess();
        } catch (error: any) {
            if (isMounted.current) {
                setError(error.message || 'Произошла непредвиденная ошибка при обновлении вашего профиля.');
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
                <h1 className="text-2xl font-bold mb-6">Редактировать профиль</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex flex-col items-center space-y-4">
                        <label htmlFor="avatar-upload" className="cursor-pointer group relative">
                            <img 
                                src={avatarPreview || `https://i.pravatar.cc/150?u=${profile.id}`} 
                                alt="Avatar preview" 
                                className="w-24 h-24 rounded-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white text-xs font-semibold">Изменить</span>
                            </div>
                        </label>
                        <input 
                            id="avatar-upload" 
                            type="file" 
                            accept="image/png, image/jpeg, image/webp" 
                            onChange={handleAvatarChange} 
                            className="hidden" 
                        />
                    </div>
                     <div>
                        <label className="text-sm font-medium text-base-content/80">
                            Обложка профиля
                        </label>
                        <label htmlFor="header-upload" className="mt-1 group relative w-full h-32 bg-base-100 border-2 border-dashed border-base-300 rounded-lg flex items-center justify-center cursor-pointer">
                            {headerPreview ? (
                                <img src={headerPreview} alt="Header preview" className="w-full h-full object-cover rounded-lg" />
                            ) : (
                                <span className="text-sm text-base-content/60">Нажмите для загрузки</span>
                            )}
                            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-white text-sm font-semibold">Сменить обложку</span>
                            </div>
                        </label>
                         <input 
                            id="header-upload" 
                            type="file" 
                            accept="image/png, image/jpeg, image/webp" 
                            onChange={handleHeaderChange} 
                            className="hidden" 
                        />
                    </div>
                    <InputField label="Имя" id="name" type="text" value={name || ''} onChange={e => setName(e.target.value)} required />
                    <InputField label="Никнейм (@)" id="handle" type="text" value={handle || ''} onChange={e => setHandle(e.target.value)} required />
                    <InputField label="Местоположение" id="location" type="text" value={location || ''} onChange={e => setLocation(e.target.value)} />
                    
                    {error && <p className="text-sm text-center text-red-500">{error}</p>}
                    
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-full text-sm font-medium bg-base-300 hover:bg-base-content/20 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary">
                            Отмена
                        </button>
                        <button type="submit" disabled={loading} className="px-6 py-2 rounded-full text-sm font-bold text-black bg-primary motion-safe:hover:scale-105 transition-transform disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-primary-focus">
                            {loading ? 'Сохранение...' : 'Сохранить изменения'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProfileModal;