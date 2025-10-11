
import React, { useState, useEffect, useCallback } from 'react';
import { WantlistItem } from '../../types';
import PlusIcon from '../icons/PlusIcon';
import WantlistFormModal from '../WantlistFormModal';
import { supabase } from '../../supabaseClient';
import WantlistItemCard from '../WantlistItemCard';

// Define a client-side type to handle the animation state without affecting the database model
type ClientWantlistItem = WantlistItem & { is_transitioning?: boolean };

const Wantlist: React.FC = () => {
  const [items, setItems] = useState<ClientWantlistItem[]>([]);
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
        setItems(data as ClientWantlistItem[]);
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

  const handleToggleFound = (itemId: string, currentStatus: boolean) => {
    // Step 1: Immediately apply visual styles (strikethrough, opacity)
    // by setting is_found and marking it as transitioning to prevent movement.
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId
          ? { ...item, is_found: !currentStatus, is_transitioning: true }
          : item
      )
    );

    // Step 2: After a delay, allow the item to move by clearing the transition flag.
    setTimeout(() => {
      setItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId ? { ...item, is_transitioning: false } : item
        )
      );
    }, 800); // 0.8 second delay for the item to stay in place.

    // Step 3: Update the database in the background.
    const updateDatabase = async () => {
      const { error } = await supabase
        .from('wantlist')
        .update({ is_found: !currentStatus })
        .eq('id', itemId);

      if (error) {
        console.error('Error toggling found status:', error);
        alert('Не удалось обновить статус.');
        // On error, revert the item to its original state.
        setItems(prevItems =>
          prevItems.map(item =>
            item.id === itemId
              ? { ...item, is_found: currentStatus, is_transitioning: false }
              : item
          )
        );
      }
    };

    updateDatabase();
  };

  return (
    <>
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Вишлист</h1>
                <button 
                    onClick={handleOpenAddModal}
                    className="bg-primary hover:scale-105 text-black font-semibold py-2 px-4 rounded-full text-sm flex items-center gap-2 transition-transform duration-200"
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
                <div className="flex flex-col gap-4">
                    {items.map(item => (
                        <WantlistItemCard 
                            key={item.id} 
                            item={item}
                            isTransitioning={item.is_transitioning}
                            onEdit={() => handleOpenEditModal(item)}
                            onDelete={() => handleDelete(item.id)}
                            onToggleFound={() => handleToggleFound(item.id, !!item.is_found)}
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