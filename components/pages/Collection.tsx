

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Collectible, Album } from '../../types';
import ItemCard from '../ItemCard';
import { supabase } from '../../supabaseClient';
import ChevronDownIcon from '../icons/ChevronDownIcon';
import XCircleIcon from '../icons/XCircleIcon';
import FilterIcon from '../icons/FilterIcon';
import CreateAlbumModal from '../CreateAlbumModal';
import FolderPlusIcon from '../icons/FolderPlusIcon';
import PlusIcon from '../icons/PlusIcon';
import AlbumCard from '../AlbumCard';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';
import WantlistMatchesModal from '../WantlistMatchesModal';
import SearchIcon from '../icons/SearchIcon';
import ItemCardSkeleton from '../skeletons/ItemCardSkeleton';
import LoadMoreButton from '../LoadMoreButton';
import QrCodeIcon from '../icons/QrCodeIcon';
import FolderIcon from '../icons/FolderIcon';

interface AlbumQRCodeModalProps {
  album: Album;
  onClose: () => void;
}

const AlbumQRCodeModal: React.FC<AlbumQRCodeModalProps> = ({ album, onClose }) => {
  const albumUrl = `${window.location.origin}?albumId=${album.id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
    albumUrl
  )}&size=256x256&bgcolor=1A1F29&color=DCE0E8&qzone=1`;

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

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-base-200 rounded-2xl w-full max-w-sm p-8 relative shadow-2xl flex flex-col items-center text-center" 
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-base-content/50 hover:text-base-content outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full">
            <XCircleIcon className="w-7 h-7" />
        </button>
        <div className="w-20 h-20 rounded-full bg-base-300 flex items-center justify-center border-4 border-base-100 overflow-hidden">
             {album.cover_image_url ? 
                <img src={album.cover_image_url} alt={album.name} className="w-full h-full object-cover" /> : 
                <FolderIcon className="w-10 h-10 text-base-content/50"/>
             }
        </div>
        <h2 className="text-2xl font-bold mt-4">{album.name}</h2>
        {album.description && <p className="text-base-content/70 line-clamp-1">{album.description}</p>}

        <div className="bg-base-100 p-4 rounded-lg mt-6">
            <img src={qrCodeUrl} alt={`QR Code for album ${album.name}`} width="256" height="256" />
        </div>
        <p className="text-xs text-base-content/60 mt-4">
            Отсканируйте код, чтобы поделиться этим альбомом
        </p>
        <input
            type="text"
            readOnly
            value={albumUrl}
            className="mt-2 w-full bg-base-300 text-center text-xs p-2 rounded-md border border-base-100 focus:outline-none"
            onFocus={(e) => e.target.select()}
            aria-label="Ссылка на альбом"
        />
      </div>
    </div>
  );
};


const GlobeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.73 9h16.54M3.73 15h16.54M9 3.73a15.8 15.8 0 0 1 6 0M9 20.27a15.8 15.8 0 0 0 6 0" />
  </svg>
);

const CalendarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0h18M12 11.25h.008v.008H12v-.008Zm0 3.75h.008v.008H12v-.008Zm-3.75-3.75h.008v.008H8.25v-.008Zm0 3.75h.008v.008H8.25v-.008Zm7.5-3.75h.008v.008h-.008v-.008Zm0 3.75h.008v.008h-.008v-.008Z" />
  </svg>
);

interface CollectionProps {
  onItemClick: (item: Collectible) => void;
  dataVersion: number;
  refreshData: () => void;
  openAddItemModal: (initialAlbumId?: string | null) => void;
  onStartConversation: (userId: string) => void;
  initialAlbumId: string | null;
  clearInitialAlbumId: () => void;
  onParameterSearch: (field: string, value: any, displayValue?: string) => void;
}

const FilterButton: React.FC<{
    onClick: () => void;
    isActive: boolean;
    children: React.ReactNode;
}> = ({ onClick, isActive, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-300 ${
            isActive ? 'bg-primary text-primary-content' : 'bg-base-100 hover:bg-base-300'
        }`}
    >
        {children}
    </button>
);

const InputWithIcon: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { icon: React.ReactNode }> = ({ icon, ...props }) => (
    <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            {icon}
        </div>
        <input
            {...props}
            className="w-full pl-10 pr-3 py-2 bg-base-100 border border-base-300 rounded-full text-sm shadow-sm placeholder-base-content/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
    </div>
);

// A reusable filter panel component
const FilterPanel = ({ filters, setFilters, initialFilters }: {
    filters: typeof initialFilters;
    setFilters: React.Dispatch<React.SetStateAction<typeof initialFilters>>;
    initialFilters: any;
}) => {
    const [showAdvanced, setShowAdvanced] = useState(false);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleCategoryChange = (category: 'all' | 'coin' | 'stamp' | 'banknote') => {
        setFilters(prev => ({ ...prev, category }));
    };

    const resetFilters = () => {
        setFilters(initialFilters);
        setShowAdvanced(false);
    };

    return (
        <div className="bg-base-200 p-4 rounded-2xl">
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <FilterIcon className="w-6 h-6 text-primary"/>
                    <h2 className="text-xl font-bold">Фильтры</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:items-end">
                    <div>
                        <div className="flex space-x-2 bg-base-300 p-1 rounded-full">
                            <FilterButton onClick={() => handleCategoryChange('all')} isActive={filters.category === 'all'}>Все</FilterButton>
                            <FilterButton onClick={() => handleCategoryChange('coin')} isActive={filters.category === 'coin'}>Монеты</FilterButton>
                            <FilterButton onClick={() => handleCategoryChange('banknote')} isActive={filters.category === 'banknote'}>Банкноты</FilterButton>
                            <FilterButton onClick={() => handleCategoryChange('stamp')} isActive={filters.category === 'stamp'}>Марки</FilterButton>
                        </div>
                    </div>
                    <div>
                        <InputWithIcon
                            id="query"
                            name="query"
                            type="text"
                            value={filters.query}
                            onChange={handleFilterChange}
                            placeholder="Поиск по названию"
                            icon={<SearchIcon className="w-4 h-4 text-base-content/40" />}
                        />
                    </div>
                </div>
            </div>
            {showAdvanced && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-base-300 pt-4 mt-4">
                    <div>
                        <label htmlFor="country" className="text-sm font-medium text-base-content/80 mb-2 block">Страна</label>
                        <InputWithIcon id="country" name="country" type="text" value={filters.country} onChange={handleFilterChange} placeholder="Например, 'Римская империя'" icon={<GlobeIcon className="w-4 h-4 text-base-content/40" />} />
                    </div>
                    <div>
                        <label htmlFor="yearFrom" className="text-sm font-medium text-base-content/80 mb-2 block">Год от</label>
                        <InputWithIcon id="yearFrom" name="yearFrom" type="number" value={filters.yearFrom} onChange={handleFilterChange} placeholder="98" icon={<CalendarIcon className="w-4 h-4 text-base-content/40" />} />
                    </div>
                    <div>
                        <label htmlFor="yearTo" className="text-sm font-medium text-base-content/80 mb-2 block">Год до</label>
                        <InputWithIcon id="yearTo" name="yearTo" type="number" value={filters.yearTo} onChange={handleFilterChange} placeholder="117" icon={<CalendarIcon className="w-4 h-4 text-base-content/40" />} />
                    </div>
                    <div>
                        <label htmlFor="material" className="text-sm font-medium text-base-content/80 mb-2 block">Материал</label>
                         <select id="material" name="material" value={filters.material} onChange={handleFilterChange} className="w-full px-3 py-2 bg-base-100 border border-base-300 rounded-full text-sm shadow-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary">
                            <option value="">Любой</option>
                            <option value="gold">Золото</option>
                            <option value="silver">Серебро</option>
                            <option value="copper">Медь</option>
                            <option value="bronze">Бронза</option>
                            <option value="iron">Железо</option>
                            <option value="paper">Бумага</option>
                            <option value="other">Другое</option>
                        </select>
                    </div>
                     <div>
                        <label htmlFor="mint" className="text-sm font-medium text-base-content/80 mb-2 block">Монетный двор</label>
                        <InputWithIcon id="mint" name="mint" type="text" value={filters.mint} onChange={handleFilterChange} placeholder="напр., Санкт-Петербургский" icon={<SearchIcon className="w-4 h-4 text-base-content/40" />} />
                    </div>
                </div>
            )}
            <div className="flex justify-between items-center border-t border-base-300 pt-3 mt-4">
                <button onClick={() => setShowAdvanced(!showAdvanced)} className="text-sm font-semibold text-primary hover:underline flex items-center gap-1 outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">
                    <span>{showAdvanced ? 'Скрыть доп. фильтры' : 'Показать доп. фильтры'}</span>
                    <ChevronDownIcon className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                </button>
                <button onClick={resetFilters} className="px-4 py-2 text-sm font-semibold rounded-full bg-base-300 hover:bg-secondary transition-colors flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-primary">
                    <XCircleIcon className="w-5 h-5" />
                    <span>Сбросить</span>
                </button>
            </div>
        </div>
    );
};

const Collection: React.FC<CollectionProps> = ({ onItemClick, dataVersion, refreshData, openAddItemModal, onStartConversation, initialAlbumId, clearInitialAlbumId, onParameterSearch }) => {
  const [userItems, setUserItems] = useState<Collectible[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isCreateAlbumModalOpen, setIsCreateAlbumModalOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [checkingItem, setCheckingItem] = useState<Collectible | null>(null);
  const [qrAlbum, setQrAlbum] = useState<Album | null>(null);

  const initialFilters = {
    category: 'all' as 'all' | 'coin' | 'stamp' | 'banknote',
    query: '',
    country: '',
    yearFrom: '',
    yearTo: '',
    material: '',
    mint: ''
  };

  const [albumFilters, setAlbumFilters] = useState(initialFilters);
  const [unassignedFilters, setUnassignedFilters] = useState(initialFilters);

  const INITIAL_ALBUMS_VISIBLE = 4;
  const ALBUMS_TO_LOAD = 2;
  const INITIAL_UNASSIGNED_VISIBLE = 8;
  const UNASSIGNED_TO_LOAD = 4;

  const [visibleAlbumCount, setVisibleAlbumCount] = useState(INITIAL_ALBUMS_VISIBLE);
  const [visibleUnassignedCount, setVisibleUnassignedCount] = useState(INITIAL_UNASSIGNED_VISIBLE);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    const fetchCollectionData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const [collectiblesRes, albumsRes, profileRes] = await Promise.all([
          supabase.from('collectibles').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }),
          supabase.from('albums').select('*').eq('owner_id', user.id).order('name', { ascending: true }),
          supabase.from('profiles').select('handle, avatar_url').eq('id', user.id).single()
        ]);

        if (!isMounted.current) return;
        
        const { data: collectiblesData, error: collectiblesError } = collectiblesRes;
        if (collectiblesError) {
          console.error('Error fetching user collection:', collectiblesError.message);
        } else {
            const itemsWithProfile = (collectiblesData || []).map(item => ({
                ...item,
                profiles: profileRes.data ? { handle: profileRes.data.handle, avatar_url: profileRes.data.avatar_url } : null
            }));
            setUserItems(itemsWithProfile as Collectible[]);
        }

        const { data: albumsData, error: albumsError } = albumsRes;
        if (albumsError) {
            console.error('Error fetching albums:', albumsError.message);
        } else {
            setAlbums(albumsData as Album[]);
        }
      }
      setLoading(false);
    };

    fetchCollectionData();
  }, [dataVersion]);

  useEffect(() => {
    if (initialAlbumId && albums.length > 0) {
        const albumToSelect = albums.find(a => a.id === initialAlbumId);
        if (albumToSelect) {
            setSelectedAlbum(albumToSelect);
        }
        clearInitialAlbumId();
    }
  }, [initialAlbumId, albums, clearInitialAlbumId]);
  
  const applyFilters = (items: Collectible[], filters: typeof initialFilters) => {
    let filteredItems = items;
    if (filters.category !== 'all') {
        filteredItems = filteredItems.filter(item => item.category === filters.category);
    }
    if (filters.query) {
        const lowerQuery = filters.query.toLowerCase();
        filteredItems = filteredItems.filter(item => 
            item.name.toLowerCase().includes(lowerQuery) || 
            (item.description && item.description.toLowerCase().includes(lowerQuery))
        );
    }
    if (filters.country) {
        const lowerCountry = filters.country.toLowerCase();
        filteredItems = filteredItems.filter(item => item.country.toLowerCase().includes(lowerCountry));
    }
    const yearFrom = parseInt(filters.yearFrom);
    if (!isNaN(yearFrom)) {
        filteredItems = filteredItems.filter(item => item.year >= yearFrom);
    }
    const yearTo = parseInt(filters.yearTo);
    if (!isNaN(yearTo)) {
        filteredItems = filteredItems.filter(item => item.year <= yearTo);
    }
    if (filters.material) {
        filteredItems = filteredItems.filter(item => item.material === filters.material);
    }
    if (filters.mint) {
        const lowerMint = filters.mint.toLowerCase();
        filteredItems = filteredItems.filter(item => item.mint && item.mint.toLowerCase().includes(lowerMint));
    }
    return filteredItems;
  };

  const itemsInSelectedAlbum = useMemo(() => {
    if (!selectedAlbum) return [];
    const items = userItems.filter(item => item.album_id === selectedAlbum.id);
    return applyFilters(items, albumFilters);
  }, [selectedAlbum, userItems, albumFilters]);

  const unassignedItems = useMemo(() => userItems.filter(item => !item.album_id), [userItems]);
  const filteredUnassignedItems = useMemo(() => applyFilters(unassignedItems, unassignedFilters), [unassignedItems, unassignedFilters]);

  const visibleAlbums = useMemo(() => albums.slice(0, visibleAlbumCount), [albums, visibleAlbumCount]);
  const visibleUnassignedItems = useMemo(() => filteredUnassignedItems.slice(0, visibleUnassignedCount), [filteredUnassignedItems, visibleUnassignedCount]);
  
  const handleSetUnassignedFilters = (action: React.SetStateAction<typeof initialFilters>) => {
    setUnassignedFilters(action);
    setVisibleUnassignedCount(INITIAL_UNASSIGNED_VISIBLE);
  };

  const handleAlbumClick = (album: Album) => {
    setSelectedAlbum(album);
    setAlbumFilters(initialFilters);
  };

  const handleBackToAlbums = () => {
    setSelectedAlbum(null);
  };
  
  const handleOpenCreateAlbumModal = () => {
    setEditingAlbum(null);
    setIsCreateAlbumModalOpen(true);
  };
  
  const handleOpenEditAlbumModal = (album: Album) => {
    setEditingAlbum(album);
    setIsCreateAlbumModalOpen(true);
  };

  const handleDeleteAlbum = async (album: Album) => {
    const confirmed = window.confirm(`Вы уверены, что хотите удалить альбом "${album.name}"? Все предметы из него будут перемещены в раздел "Без альбома".`);
    if (!confirmed) return;

    const { error: updateError } = await supabase
      .from('collectibles')
      .update({ album_id: null })
      .eq('album_id', album.id);

    if (updateError) {
      console.error("Error moving items from album:", updateError);
      alert("Ошибка при перемещении предметов из альбома.");
      return;
    }

    const { error: deleteError } = await supabase
      .from('albums')
      .delete()
      .eq('id', album.id);

    if (deleteError) {
      console.error("Error deleting album:", deleteError);
      alert("Ошибка при удалении альбома. Предметы были перемещены.");
    }
    
    refreshData();
  };

  const handleLoadMoreAlbums = () => {
    setVisibleAlbumCount(prev => Math.min(prev + ALBUMS_TO_LOAD, albums.length));
  };

  const handleLoadMoreUnassigned = () => {
    setVisibleUnassignedCount(prev => Math.min(prev + UNASSIGNED_TO_LOAD, filteredUnassignedItems.length));
  };


  const LoadingState = () => (
     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => <ItemCardSkeleton key={i} />)}
    </div>
  );

  return (
    <>
      <div>
        <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              {selectedAlbum && (
                  <button onClick={handleBackToAlbums} className="p-2 rounded-full bg-base-200 hover:bg-base-300 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100" aria-label="Назад к альбомам">
                      <ArrowLeftIcon className="w-6 h-6" />
                  </button>
              )}
              <h1 className="text-3xl font-bold">{selectedAlbum ? selectedAlbum.name : 'Моя коллекция'}</h1>
            </div>
            {selectedAlbum && (
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setQrAlbum(selectedAlbum)}
                        className="bg-base-200 hover:bg-base-300 font-semibold py-2 px-4 rounded-full text-sm flex items-center gap-2 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        aria-label="Поделиться альбомом"
                    >
                        <QrCodeIcon className="w-4 h-4" />
                        <span>QR-код</span>
                    </button>
                    <button
                        onClick={() => openAddItemModal(selectedAlbum?.id)}
                        className="bg-primary hover:scale-105 text-primary-content font-semibold py-2 px-4 rounded-full text-sm flex items-center gap-2 transition-transform duration-200 motion-safe:hover:scale-105 outline-none focus-visible:ring-2 focus-visible:ring-primary-focus"
                        aria-label="Добавить новый предмет"
                    >
                        <PlusIcon className="w-4 h-4" />
                        <span>Добавить предмет</span>
                    </button>
                </div>
            )}
        </div>

        {selectedAlbum ? (
            // VIEW: ITEMS IN ALBUM
            <div>
              <FilterPanel filters={albumFilters} setFilters={setAlbumFilters} initialFilters={initialFilters} />
              {loading ? <LoadingState /> : (
                <>
                  {itemsInSelectedAlbum.length > 0 ? (
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {itemsInSelectedAlbum.map(item => <ItemCard key={item.id} item={item} onItemClick={onItemClick} onCheckWantlist={setCheckingItem} isOwner={true} onParameterSearch={onParameterSearch}/>)}
                    </div>
                  ) : (
                    <div className="mt-8 text-center py-16 bg-base-200 rounded-2xl">
                        <h2 className="text-xl font-bold">В этом альбоме пока пусто</h2>
                        <p className="text-base-content/70 mt-2">Нажмите "Добавить предмет", чтобы пополнить его.</p>
                    </div>
                  )}
                </>
              )}
            </div>
        ) : (
          // VIEW: MAIN PAGE
          <div>
            {loading ? <LoadingState /> : (
              <>
                {albums.length > 0 && (
                     <div className="mb-12">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Альбомы</h2>
                             <button 
                                onClick={handleOpenCreateAlbumModal} 
                                className="bg-primary hover:scale-105 text-primary-content font-semibold py-2 px-4 rounded-full text-sm flex items-center gap-2 transition-transform duration-200 motion-safe:hover:scale-105 outline-none focus-visible:ring-2 focus-visible:ring-primary-focus"
                            >
                                <FolderPlusIcon className="w-4 h-4" />
                                <span>Создать альбом</span>
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {visibleAlbums.map(album => {
                                const itemsInAlbum = userItems.filter(item => item.album_id === album.id);
                                return (
                                    <AlbumCard 
                                        key={album.id}
                                        album={album}
                                        items={itemsInAlbum}
                                        itemCount={itemsInAlbum.length}
                                        onClick={() => handleAlbumClick(album)}
                                        onEdit={() => handleOpenEditAlbumModal(album)}
                                        onDelete={() => handleDeleteAlbum(album)}
                                        isOwnProfile={true}
                                    />
                                )
                            })}
                        </div>
                        {visibleAlbumCount < albums.length && (
                            <div className="mt-12 text-center">
                                <LoadMoreButton onClick={handleLoadMoreAlbums} loading={false}>
                                    Загрузить еще {Math.min(ALBUMS_TO_LOAD, albums.length - visibleAlbumCount)}
                                </LoadMoreButton>
                            </div>
                        )}
                     </div>
                )}
               
                <div className="mt-12">
                    <FilterPanel filters={unassignedFilters} setFilters={handleSetUnassignedFilters} initialFilters={initialFilters} />

                    {unassignedItems.length > 0 ? (
                        <div className="mt-8">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold">Без альбомов</h2>
                                <button
                                    onClick={() => openAddItemModal(null)}
                                    className="bg-primary hover:scale-105 text-primary-content font-semibold py-2 px-4 rounded-full text-sm flex items-center gap-2 transition-transform duration-200 motion-safe:hover:scale-105 outline-none focus-visible:ring-2 focus-visible:ring-primary-focus"
                                    aria-label="Добавить новый предмет"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                    <span>Добавить предмет</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {visibleUnassignedItems.map(item => <ItemCard key={item.id} item={item} onItemClick={onItemClick} onCheckWantlist={setCheckingItem} isOwner={true} onParameterSearch={onParameterSearch}/>)}
                            </div>
                            {visibleUnassignedCount < filteredUnassignedItems.length && (
                              <div className="mt-12 flex justify-center">
                                <LoadMoreButton onClick={handleLoadMoreUnassigned} loading={false}>
                                    Загрузить еще {Math.min(UNASSIGNED_TO_LOAD, filteredUnassignedItems.length - visibleUnassignedCount)}
                                </LoadMoreButton>
                              </div>
                            )}
                        </div>
                    ) : ( albums.length === 0 && (
                         <div className="text-center py-16 bg-base-200 rounded-2xl mt-8">
                            <h2 className="text-xl font-bold">Ваша коллекция пуста</h2>
                            <p className="text-base-content/70 mt-2">Нажмите "Добавить предмет", чтобы начать.</p>
                            <div className="mt-6">
                                <button
                                    onClick={() => alert('Функция импорта из CSV скоро появится!')}
                                    className="bg-base-300 hover:bg-secondary hover:text-secondary-content font-semibold py-2 px-5 rounded-full text-sm flex items-center gap-2 mx-auto outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                >
                                    Импорт из CSV
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {isCreateAlbumModalOpen && (
          <CreateAlbumModal
              albumToEdit={editingAlbum}
              onClose={() => setIsCreateAlbumModalOpen(false)}
              onSuccess={() => {
                  setIsCreateAlbumModalOpen(false);
                  refreshData();
              }}
          />
      )}
      {checkingItem && (
        <WantlistMatchesModal
            item={checkingItem}
            onClose={() => setCheckingItem(null)}
            onStartConversation={onStartConversation}
        />
      )}
      {qrAlbum && (
          <AlbumQRCodeModal
              album={qrAlbum}
              onClose={() => setQrAlbum(null)}
          />
      )}
    </>
  );
};

export default Collection;