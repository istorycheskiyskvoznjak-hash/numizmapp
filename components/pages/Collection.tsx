import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { Collectible, Album, Profile as ProfileData } from '../../types';
import ItemCard from '../ItemCard';
import AlbumCard from '../AlbumCard';
import PlusIcon from '../icons/PlusIcon';
import FolderPlusIcon from '../icons/FolderPlusIcon';
import CreateAlbumModal from '../CreateAlbumModal';
import ItemCardSkeleton from '../skeletons/ItemCardSkeleton';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';
import EditIcon from '../icons/EditIcon';
import QrCodeIcon from '../icons/QrCodeIcon';
import { Session } from '@supabase/supabase-js';
import QRCodeModal from '../QRCodeModal';

interface CollectionProps {
  onItemClick: (item: Collectible) => void;
  dataVersion: number;
  refreshData: () => void;
  openAddItemModal: (initialAlbumId?: string | null) => void;
  onStartConversation: (userId: string) => void;
  initialAlbumId: string | null;
  clearInitialAlbumId: () => void;
  onParameterSearch: (field: string, value: any, displayValue?: string) => void;
  onCheckWantlist: (item: Collectible) => void;
}

const FilterButton: React.FC<{
    onClick: () => void;
    isActive: boolean;
    children: React.ReactNode;
}> = ({ onClick, isActive, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100 ${
            isActive ? 'bg-primary text-primary-content' : 'bg-base-200 hover:bg-base-300'
        }`}
    >
        {children}
    </button>
);

const Collection: React.FC<CollectionProps> = ({
  onItemClick,
  dataVersion,
  refreshData,
  openAddItemModal,
  onStartConversation,
  initialAlbumId,
  clearInitialAlbumId,
  onParameterSearch,
  onCheckWantlist,
}) => {
  const [collectibles, setCollectibles] = useState<Collectible[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [unassignedFilter, setUnassignedFilter] = useState<'all' | 'coin' | 'stamp' | 'banknote'>('all');
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const isMounted = useRef(true);
  
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    if (!currentSession) {
      setLoading(false);
      return;
    }
    if(isMounted.current) setSession(currentSession);

    const [collectiblesRes, albumsRes, profileRes] = await Promise.all([
      supabase.from('collectibles').select('*').eq('owner_id', currentSession.user.id).order('created_at', { ascending: false }),
      supabase.from('albums').select('*').eq('owner_id', currentSession.user.id).order('name', { ascending: true }),
      supabase.from('profiles').select('*').eq('id', currentSession.user.id).single(),
    ]);
    
    if (!isMounted.current) return;

    if (collectiblesRes.error) console.error("Error fetching collectibles:", collectiblesRes.error);
    else setCollectibles(collectiblesRes.data as Collectible[]);

    if (albumsRes.error) console.error("Error fetching albums:", albumsRes.error);
    else {
        const albumsData = albumsRes.data as Album[];
        setAlbums(albumsData);
        if (initialAlbumId) {
            const album = albumsData.find(a => a.id === initialAlbumId);
            if (album) setSelectedAlbum(album);
            else clearInitialAlbumId(); // Album not found, clear the ID
        }
    }

    if (profileRes.error) {
        console.error("Error fetching profile for collection page:", profileRes.error);
    } else {
        setProfile(profileRes.data as ProfileData);
    }

    setLoading(false);
  }, [initialAlbumId, clearInitialAlbumId]);

  useEffect(() => {
    fetchData();
  }, [dataVersion, fetchData]);

  useEffect(() => {
    if (!initialAlbumId) {
        setSelectedAlbum(null);
    } else {
        const album = albums.find(a => a.id === initialAlbumId);
        if (album) {
            setSelectedAlbum(album);
        }
    }
  }, [initialAlbumId, albums]);
  
  const handleOpenCreateAlbumModal = () => {
    setEditingAlbum(null);
    setIsAlbumModalOpen(true);
  };
  
  const handleOpenEditAlbumModal = (album: Album) => {
    setEditingAlbum(album);
    setIsAlbumModalOpen(true);
  };

  const handleAlbumModalSuccess = () => {
    setIsAlbumModalOpen(false);
    refreshData();
  };

  const handleDeleteAlbum = async (album: Album) => {
    const itemsInAlbum = collectibles.filter(c => c.album_id === album.id);
    const confirmationMessage = itemsInAlbum.length > 0
        ? `Вы уверены, что хотите удалить альбом "${album.name}"? ${itemsInAlbum.length} предметов в нем не будут удалены, а останутся без альбома.`
        : `Вы уверены, что хотите удалить пустой альбом "${album.name}"?`;
    
    const confirmed = window.confirm(confirmationMessage);
    if (!confirmed) return;

    // First, unassign items from the album
    if (itemsInAlbum.length > 0) {
        const { error: updateError } = await supabase
            .from('collectibles')
            .update({ album_id: null })
            .in('id', itemsInAlbum.map(i => i.id));
        if (updateError) {
            alert("Не удалось отвязать предметы от альбома.");
            return;
        }
    }

    // Then, delete the album
    const { error: deleteError } = await supabase.from('albums').delete().eq('id', album.id);
    if (deleteError) {
        alert("Не удалось удалить альбом.");
    } else {
        if (selectedAlbum?.id === album.id) {
            handleBackToCollection();
        }
        refreshData();
    }
  };

  const handleBackToCollection = () => {
      setSelectedAlbum(null);
      clearInitialAlbumId();
  };

  if (loading) {
    return (
        <div className="space-y-12">
            <div>
                <div className="flex justify-between items-center mb-8">
                    <div className="w-64 h-9 bg-base-300/80 rounded-md animate-pulse"></div>
                    <div className="w-48 h-10 bg-base-300/80 rounded-full animate-pulse"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, i) => <ItemCardSkeleton key={i} />)}
                </div>
            </div>
        </div>
    );
  }

  if (selectedAlbum) {
    const itemsInAlbum = collectibles.filter(item => item.album_id === selectedAlbum.id);
    return (
        <>
            <div>
                <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
                    <div className="flex items-center gap-4">
                        <button onClick={handleBackToCollection} className="p-2 rounded-full bg-base-200 hover:bg-base-300 transition-colors" aria-label="Назад к коллекции">
                            <ArrowLeftIcon className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold">{selectedAlbum.name}</h1>
                            {selectedAlbum.description && <p className="text-base-content/70 mt-1">{selectedAlbum.description}</p>}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                         <button onClick={() => handleOpenEditAlbumModal(selectedAlbum)} className="flex items-center gap-2 bg-base-200 hover:bg-base-300 font-semibold py-2 px-4 rounded-full text-sm transition-colors">
                            <EditIcon className="w-4 h-4" />
                            <span>Редактировать</span>
                        </button>
                        <button onClick={() => setIsQrModalOpen(true)} className="flex items-center justify-center w-10 h-10 bg-base-200 hover:bg-base-300 rounded-full text-sm transition-colors" title="Поделиться альбомом (QR-код)">
                            <QrCodeIcon className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => openAddItemModal(selectedAlbum.id)}
                            className="bg-primary text-primary-content font-semibold py-2 px-4 rounded-full text-sm flex items-center gap-2 transition-transform duration-200 motion-safe:hover:scale-105"
                        >
                            <PlusIcon className="w-4 h-4" />
                            <span>Добавить предмет</span>
                        </button>
                    </div>
                </div>
                {itemsInAlbum.length === 0 ? (
                    <div className="text-center py-16 bg-base-200 rounded-2xl">
                        <h2 className="text-xl font-bold">Этот альбом пуст</h2>
                        <p className="text-base-content/70 mt-2">Добавьте свой первый предмет, чтобы он появился здесь.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {itemsInAlbum.map(item => <ItemCard key={item.id} item={item} onItemClick={onItemClick} isOwner={true} onParameterSearch={onParameterSearch} onCheckWantlist={onCheckWantlist} />)}
                    </div>
                )}
            </div>
            {isAlbumModalOpen && (
                <CreateAlbumModal
                    albumToEdit={editingAlbum}
                    onClose={() => setIsAlbumModalOpen(false)}
                    onSuccess={handleAlbumModalSuccess}
                />
            )}
             {isQrModalOpen && selectedAlbum && profile && (
                <QRCodeModal 
                    title={selectedAlbum.name}
                    subtitle={`Альбом пользователя @${profile.handle || '...'}`}
                    imageUrl={selectedAlbum.cover_image_url}
                    url={`${window.location.origin}?albumId=${selectedAlbum.id}`}
                    onClose={() => setIsQrModalOpen(false)}
                    typeLabel="альбомом"
                />
            )}
        </>
    );
  }

  const unassignedItems = collectibles.filter(c => !c.album_id);
  const filteredUnassignedItems = unassignedItems.filter(item => {
    if (unassignedFilter === 'all') return true;
    return item.category === unassignedFilter;
  });

  return (
    <>
      <div>
        <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
            <h1 className="text-3xl font-bold">Моя коллекция</h1>
            <div className="flex items-center gap-2">
                <button 
                    onClick={handleOpenCreateAlbumModal}
                    className="bg-base-200 hover:bg-base-300 font-semibold py-2 px-4 rounded-full text-sm flex items-center gap-2 transition-colors"
                >
                    <FolderPlusIcon className="w-4 h-4" />
                    <span>Создать альбом</span>
                </button>
                <button 
                    onClick={() => openAddItemModal()}
                    className="bg-primary text-primary-content font-semibold py-2 px-4 rounded-full text-sm flex items-center gap-2 transition-transform duration-200 motion-safe:hover:scale-105"
                >
                    <PlusIcon className="w-4 h-4" />
                    <span>Добавить предмет</span>
                </button>
            </div>
        </div>

        {albums.length > 0 && (
            <div className="mb-12">
                <h2 className="text-2xl font-bold mb-4">Альбомы</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {albums.map(album => {
                        const itemsInAlbum = collectibles.filter(c => c.album_id === album.id);
                        return (
                            <AlbumCard
                                key={album.id}
                                album={album}
                                items={itemsInAlbum}
                                itemCount={itemsInAlbum.length}
                                onClick={() => setSelectedAlbum(album)}
                                onEdit={() => handleOpenEditAlbumModal(album)}
                                onDelete={() => handleDeleteAlbum(album)}
                                isOwnProfile={true}
                            />
                        );
    
                    })}
                </div>
            </div>
        )}

        {unassignedItems.length > 0 && (
            <div>
                <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                    <h2 className="text-2xl font-bold">Не имеют альбомов</h2>
                     <div className="flex items-center space-x-2 bg-base-200 p-1 rounded-full flex-shrink-0">
                        <FilterButton onClick={() => setUnassignedFilter('all')} isActive={unassignedFilter === 'all'}>Все</FilterButton>
                        <FilterButton onClick={() => setUnassignedFilter('coin')} isActive={unassignedFilter === 'coin'}>Монеты</FilterButton>
                        <FilterButton onClick={() => setUnassignedFilter('banknote')} isActive={unassignedFilter === 'banknote'}>Банкноты</FilterButton>
                        <FilterButton onClick={() => setUnassignedFilter('stamp')} isActive={unassignedFilter === 'stamp'}>Марки</FilterButton>
                    </div>
                </div>
                {filteredUnassignedItems.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredUnassignedItems.map(item => <ItemCard key={item.id} item={item} onItemClick={onItemClick} isOwner={true} onParameterSearch={onParameterSearch} onCheckWantlist={onCheckWantlist} />)}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-base-200 rounded-2xl">
                        <h2 className="text-xl font-bold">Ничего не найдено</h2>
                        <p className="text-base-content/70 mt-2">Нет предметов, соответствующих выбранному фильтру.</p>
                    </div>
                )}
            </div>
        )}
        
        {collectibles.length === 0 && albums.length === 0 && (
            <div className="text-center py-16 bg-base-200 rounded-2xl">
                <h2 className="text-xl font-bold">Ваша коллекция пуста</h2>
                <p className="text-base-content/70 mt-2">Добавьте свой первый предмет, чтобы он появился здесь.</p>
            </div>
        )}
      </div>

      {isAlbumModalOpen && (
        <CreateAlbumModal
            albumToEdit={editingAlbum}
            onClose={() => setIsAlbumModalOpen(false)}
            onSuccess={handleAlbumModalSuccess}
        />
      )}
    </>
  );
};

export default Collection;