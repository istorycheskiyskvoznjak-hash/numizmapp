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
    const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    name,
                    handle,
                    location,
                    avatar_url: avatarUrl
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
                    <InputField label="Имя" id="name" type="text" value={name} onChange={e => setName(e.target.value)} required />
                    <InputField label="Никнейм (@)" id="handle" type="text" value={handle} onChange={e => setHandle(e.target.value)} required />
                    <InputField label="Местоположение" id="location" type="text" value={location} onChange={e => setLocation(e.target.value)} />
                    <InputField label="URL аватара" id="avatar_url" type="text" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} />

                    {error && <p className="text-sm text-center text-red-500">{error}</p>}
                    
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-full text-sm font-medium bg-base-300 hover:bg-base-content/20 transition-colors">
                            Отмена
                        </button>
                        <button type="submit" disabled={loading} className="px-6 py-2 rounded-full text-sm font-bold text-black bg-primary hover:scale-105 transition-transform disabled:opacity-50">
                            {loading ? 'Сохранение...' : 'Сохранить изменения'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProfileModal;