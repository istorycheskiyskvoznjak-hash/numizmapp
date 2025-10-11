import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { WantlistItem, WantlistList } from '../../types';
import PlusIcon from '../icons/PlusIcon';
import WantlistFormModal from '../WantlistFormModal';
import { supabase } from '../../supabaseClient';
import WantlistItemCard from '../WantlistItemCard';
import Skeleton from '../skeletons/Skeleton';
import WantlistListFormModal from '../WantlistListFormModal';
import WantlistListCard from '../WantlistListCard';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';
import FolderPlusIcon from '../icons/FolderPlusIcon';

type ClientWantlistItem = WantlistItem & { is_transitioning?: boolean };

interface WantlistProps {
  initialListId: string | null;
  clearInitialListId: () => void;
}

const Wantlist: React.FC<WantlistProps> = ({ initialListId, clearInitialListId }) => {
  const [lists, setLists] = useState<WantlistList[]>([]);
  const [items, setItems] = useState<ClientWantlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedList, setSelectedList] = useState<WantlistList | null>(null);
  
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WantlistItem | null>(null);
  
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [editingList, setEditingList] = useState<WantlistList | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        setLoading(false);
        return;
    }

    const [listsRes, itemsRes] = await Promise.all([
      supabase.from('wantlist_lists').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('wantlist').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    ]);
    
    if (listsRes.error) console.error('Error fetching wantlist lists:', listsRes.error);
    else setLists(listsRes.data as WantlistList[]);
    
    if (itemsRes.error) console.error('Error fetching wantlist items:', itemsRes.error);
    else setItems(itemsRes.data as ClientWantlistItem[]);
    
    if (initialListId && listsRes.data) {
      const list = listsRes.data.find(l => l.id === initialListId);
      if (list) setSelectedList(list);
      clearInitialListId();
    }

    setLoading(false);
  }, [initialListId, clearInitialListId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Item Modal Handlers
  const handleOpenAddItemModal = () => {
    setEditingItem(null);
    setIsItemModalOpen(true);
  };

  const handleOpenEditItemModal = (item: WantlistItem) => {
    setEditingItem(item);
    setIsItemModalOpen(true);
  };
  
  const handleItemModalSuccess = () => {
    setIsItemModalOpen(false);
    fetchData();
  };

  // List Modal Handlers
  const handleOpenAddListModal = () => {
    setEditingList(null);
    setIsListModalOpen(true);
  };

  const handleOpenEditListModal = (list: WantlistList) => {
    setEditingList(list);
    setIsListModalOpen(true);
  };
  
  const handleListModalSuccess = () => {
    setIsListModalOpen(false);
    fetchData();
  };

  // CRUD Operations
  const handleDeleteItem = async (itemId: string) => {
    const confirmed = window.confirm("Вы уверены, что хотите удалить этот элемент?");
    if (confirmed) {
        const { error } = await supabase.from('wantlist').delete().eq('id', itemId);
        if (error) {
            console.error('Error deleting wantlist item:', error);
            alert("Не удалось удалить элемент.");
        } else {
            fetchData();
        }
    }
  };

  const handleDeleteList = async (list: WantlistList) => {
    const itemsInList = items.filter(i => i.list_id === list.id);
    const confirmationMessage = itemsInList.length > 0
        ? `Вы уверены, что хотите удалить список "${list.name}"? Все ${itemsInList.length} предметов в нем также будут удалены.`
        : `Вы уверены, что хотите удалить пустой список "${list.name}"?`;
    
    const confirmed = window.confirm(confirmationMessage);
    if (!confirmed) return;

    // Delete items first, then the list
    if (itemsInList.length > 0) {
      const { error: itemsError } = await supabase.from('wantlist').delete().in('id', itemsInList.map(i => i.id));
      if (itemsError) {
        alert("Не удалось удалить предметы из списка.");
        return;
      }
    }
    const { error: listError } = await supabase.from('wantlist_lists').delete().eq('id', list.id);
    if (listError) {
      alert("Не удалось удалить список.");
    } else {
      fetchData();
    }
  };

  const handleToggleFound = (itemId: string, currentStatus: boolean) => {
    setItems(prevItems => prevItems.map(item =>
        item.id === itemId ? { ...item, is_found: !currentStatus, is_transitioning: true } : item
    ));

    setTimeout(() => {
      setItems(prevItems => prevItems.map(item =>
          item.id === itemId ? { ...item, is_transitioning: false } : item
      ));
    }, 800);

    const updateDatabase = async () => {
      const { error } = await supabase.from('wantlist').update({ is_found: !currentStatus }).eq('id', itemId);
      if (error) {
        console.error('Error toggling found status:', error);
        alert('Не удалось обновить статус.');
        fetchData(); // Re-fetch to revert state
      }
    };
    updateDatabase();
  };
  
  const itemsInSelectedList = useMemo(() => {
      if (!selectedList) return [];
      return items.filter(item => item.list_id === selectedList.id);
  }, [items, selectedList]);

  if (loading) {
    return <div>Загрузка вишлистов...</div>;
  }
  
  if (selectedList) {
    // List Detail View
    return (
       <>
        <div>
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => setSelectedList(null)} className="p-2 rounded-full bg-base-200 hover:bg-base-300 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100" aria-label="Назад к спискам">
                        <ArrowLeftIcon className="w-6 h-6" />
                    </button>
                    <h1 className="text-3xl font-bold">{selectedList.name}</h1>
                </div>
                <button 
                    onClick={handleOpenAddItemModal}
                    className="bg-primary hover:scale-105 text-primary-content font-semibold py-2 px-4 rounded-full text-sm flex items-center gap-2 transition-transform duration-200 motion-safe:hover:scale-105 outline-none focus-visible:ring-2 focus-visible:ring-primary-focus"
                >
                    <PlusIcon className="w-4 h-4" />
                    <span>Добавить предмет</span>
                </button>
            </div>
            {itemsInSelectedList.length === 0 ? (
                <div className="text-center py-16 bg-base-200 rounded-2xl">
                    <h2 className="text-xl font-bold">Этот список пуст</h2>
                    <p className="text-base-content/70 mt-2">Добавьте свой первый предмет, чтобы он появился здесь.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {itemsInSelectedList.map(item => (
                        <WantlistItemCard 
                            key={item.id} 
                            item={item}
                            isTransitioning={item.is_transitioning}
                            onEdit={() => handleOpenEditItemModal(item)}
                            onDelete={() => handleDeleteItem(item.id)}
                            onToggleFound={() => handleToggleFound(item.id, !!item.is_found)}
                        />
                    ))}
                </div>
            )}
        </div>
        {isItemModalOpen && (
            <WantlistFormModal
                itemToEdit={editingItem}
                onClose={() => setIsItemModalOpen(false)}
                onSuccess={handleItemModalSuccess}
                initialListId={selectedList.id}
            />
        )}
      </>
    );
  }

  // Main View (List of lists)
  return (
    <>
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Мои вишлисты</h1>
                <button 
                    onClick={handleOpenAddListModal}
                    className="bg-primary hover:scale-105 text-primary-content font-semibold py-2 px-4 rounded-full text-sm flex items-center gap-2 transition-transform duration-200 motion-safe:hover:scale-105 outline-none focus-visible:ring-2 focus-visible:ring-primary-focus"
                >
                    <FolderPlusIcon className="w-4 h-4" />
                    <span>Создать список</span>
                </button>
            </div>
            {lists.length === 0 ? (
                 <div className="text-center py-16 bg-base-200 rounded-2xl">
                    <h2 className="text-xl font-bold">Создайте свой первый вишлист</h2>
                    <p className="text-base-content/70 mt-2">Организуйте свои цели по разным спискам.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {lists.map(list => {
                        const listItems = items.filter(i => i.list_id === list.id);
                        return (
                           <WantlistListCard
                                key={list.id}
                                list={list}
                                items={listItems}
                                onClick={() => setSelectedList(list)}
                                onEdit={() => handleOpenEditListModal(list)}
                                onDelete={() => handleDeleteList(list)}
                           />
                        )
                    })}
                </div>
            )}
        </div>
        {isListModalOpen && (
            <WantlistListFormModal
                listToEdit={editingList}
                onClose={() => setIsListModalOpen(false)}
                onSuccess={handleListModalSuccess}
            />
        )}
    </>
  );
};

export default Wantlist;