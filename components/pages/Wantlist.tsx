
import React, { useState, useEffect, useCallback } from 'react';
import { WantlistItem } from '../../types';
import PlusIcon from '../icons/PlusIcon';
import WantlistFormModal from '../WantlistFormModal';
import { supabase } from '../../supabaseClient';
import WantlistItemCard from '../WantlistItemCard';

const Wantlist: React.FC = () => {
  const [items, setItems] = useState<WantlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WantlistItem | null>(null);

  const fetchWantlist = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        setLoading(false);
        return;
    }

    const { data, error } = await supabase
        .from('wantlist')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching wantlist:', error);
    } else {
        setItems(data as WantlistItem[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchWantlist();
  }, [fetchWantlist]);
  
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: WantlistItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };
  
  const handleModalSuccess = () => {
    setIsModalOpen(false);
    fetchWantlist();
  };

  const handleDelete = async (itemId: string) => {
    const confirmed = window.confirm("Вы уверены, что хотите удалить этот элемент из вишлиста?");
    if (confirmed) {
        const { error } = await supabase
            .from('wantlist')
            .delete()
            .eq('id', itemId);
        
        if (error) {
            console.error('Error deleting wantlist item:', error);
            alert("Не удалось удалить элемент.");
        } else {
            fetchWantlist();
        }
    }
  };

  return (
    <>
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Вишлист</h1>
                <button 
                    onClick={handleOpenAddModal}
                    className="bg-base-200 hover:bg-base-300 font-semibold py-2 px-4 rounded-full text-sm flex items-center gap-2"
                >
                    <PlusIcon className="w-4 h-4" />
                    <span>Добавить в вишлист</span>
                </button>
            </div>
            {loading ? (
                <p>Загрузка вишлиста...</p>
            ) : items.length === 0 ? (
                 <div className="text-center py-16 bg-base-200 rounded-2xl">
                    <h2 className="text-xl font-bold">Ваш вишлист пуст</h2>
                    <p className="text-base-content/70 mt-2">Нажмите "Добавить в вишлист", чтобы начать собирать коллекцию мечты.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {items.map(item => (
                        <WantlistItemCard 
                            key={item.id} 
                            item={item}
                            onEdit={() => handleOpenEditModal(item)}
                            onDelete={() => handleDelete(item.id)}
                        />
                    ))}
                </div>
            )}
        </div>
        {isModalOpen && (
            <WantlistFormModal
                itemToEdit={editingItem}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleModalSuccess}
            />
        )}
    </>
  );
};

export default Wantlist;