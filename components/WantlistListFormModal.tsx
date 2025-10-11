import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { WantlistList } from '../types';

interface WantlistListFormModalProps {
  listToEdit?: WantlistList | null;
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


const WantlistListFormModal: React.FC<WantlistListFormModalProps> = ({ listToEdit, onClose, onSuccess }) => {
    const isEditMode = !!listToEdit;
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isPublic, setIsPublic] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        if (isEditMode) {
            setName(listToEdit.name);
            setDescription(listToEdit.description || '');
            setIsPublic(listToEdit.is_public);
        }
        return () => {
            isMounted.current = false;
        };
    }, [listToEdit, isEditMode]);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Пользователь не авторизован");

            const listData = { 
                name, 
                description: description || null,
                user_id: user.id,
                is_public: isPublic,
            };
            
            if (isEditMode) {
                const { error: updateError } = await supabase.from('wantlist_lists')
                    .update(listData)
                    .eq('id', listToEdit.id);
                if (updateError) throw updateError;
            } else {
                const { error: insertError } = await supabase.from('wantlist_lists')
                    .insert(listData);
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
                <h1 className="text-2xl font-bold mb-6">{isEditMode ? 'Редактировать вишлист' : 'Создать вишлист'}</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <InputField label="Название" id="name" type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="напр., Монеты Римской Империи" />
                    <div>
                        <label htmlFor="description" className="text-sm font-medium text-base-content/80">Описание (необязательно)</label>
                        <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 bg-base-100 border border-base-300 rounded-md text-sm shadow-sm placeholder-base-content/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="Краткое описание того, что вы ищете"></textarea>
                    </div>

                    <div className="flex items-center justify-between bg-base-100 p-3 rounded-lg border border-base-300">
                        <div>
                            <label htmlFor="isPublic" className="font-medium text-base-content">
                                Публичный список
                            </label>
                            <p className="text-xs text-base-content/70">Любой сможет видеть этот список в вашем профиле.</p>
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
                            {loading ? (isEditMode ? 'Сохранение...' : 'Создание...') : (isEditMode ? 'Сохранить' : 'Создать')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default WantlistListFormModal;