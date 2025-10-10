import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { WantlistItem } from '../types';

interface WantlistFormModalProps {
  itemToEdit?: WantlistItem | null;
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

const WantlistFormModal: React.FC<WantlistFormModalProps> = ({ itemToEdit, onClose, onSuccess }) => {
    const [name, setName] = useState('');
    const [details, setDetails] = useState('');
    const [description, setDescription] = useState('');
    
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
        }
        return () => {
            isMounted.current = false;
        };
    }, [itemToEdit, isEditMode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Пользователь не авторизован");

            const itemData = { name, details, description, user_id: user.id };

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
                    <InputField label="Название" id="name" type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="напр., Денарий Траяна" />
                    <InputField label="Детали" id="details" type="text" value={details} onChange={e => setDetails(e.target.value)} placeholder="напр., Римская империя, 98-117 гг." />
                    <div>
                        <label htmlFor="description" className="text-sm font-medium text-base-content/80">Описание</label>
                        <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={4} className="mt-1 block w-full px-3 py-2 bg-base-100 border border-base-300 rounded-md text-sm shadow-sm placeholder-base-content/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="Опишите, что именно вы ищете..."></textarea>
                    </div>
                    
                    {error && <p className="text-sm text-center text-red-500">{error}</p>}
                    
                    <div className="flex justify-end space-x-4 pt-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 rounded-full text-sm font-medium bg-base-300 hover:bg-base-content/20 transition-colors">
                            Отмена
                        </button>
                        <button type="submit" disabled={loading} className="px-6 py-2 rounded-full text-sm font-bold text-black bg-primary hover:scale-105 transition-transform disabled:opacity-50">
                            {loading ? 'Сохранение...' : 'Сохранить'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default WantlistFormModal;