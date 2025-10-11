import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Album } from '../types';

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

const CreateAlbumModal: React.FC<CreateAlbumModalProps> = ({ albumToEdit, onClose, onSuccess }) => {
    const isEditMode = !!albumToEdit;
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        if (isEditMode) {
            setName(albumToEdit.name);
            setDescription(albumToEdit.description || '');
        }
        return () => {
            isMounted.current = false;
        };
    }, [albumToEdit, isEditMode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Пользователь не авторизован");

            if (isEditMode) {
                const { error: updateError } = await supabase
                    .from('albums')
                    .update({ name, description: description || null })
                    .eq('id', albumToEdit.id);
                if (updateError) throw updateError;
            } else {
                 const albumData = { 
                    name, 
                    description: description || null, 
                    owner_id: user.id 
                };
                
                const { error: insertError } = await supabase
                    .from('albums')
                    .insert(albumData);

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
                <h1 className="text-2xl font-bold mb-6">{isEditMode ? 'Редактировать альбом' : 'Создать новый альбом'}</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <InputField label="Название альбома" id="name" type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="напр., Марки СССР 1961-1991" />
                    <div>
                        <label htmlFor="description" className="text-sm font-medium text-base-content/80">Описание (необязательно)</label>
                        <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 bg-base-100 border border-base-300 rounded-md text-sm shadow-sm placeholder-base-content/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="Краткое описание содержимого альбома"></textarea>
                    </div>
                    
                    {error && <p className="text-sm text-center text-red-500">{error}</p>}
                    
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-full text-sm font-medium bg-base-300 hover:bg-base-content/20 transition-colors">
                            Отмена
                        </button>
                        <button type="submit" disabled={loading} className="px-6 py-2 rounded-full text-sm font-bold text-black bg-primary hover:scale-105 transition-transform disabled:opacity-50">
                            {loading ? (isEditMode ? 'Сохранение...' : 'Создание...') : (isEditMode ? 'Сохранить изменения' : 'Создать альбом')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateAlbumModal;