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

const GlobeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.73 9h16.54M3.73 15h16.54M9 3.73a15.8 15.8 0 0 1 6 0M9 20.27a15.8 15.8 0 0 0 6 0" />
  </svg>
);

const CalendarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
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
}

const FilterButton: React.FC<{
    onClick: () => void;
    isActive: boolean;
    children: React.ReactNode;
}> = ({ onClick, isActive, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
            isActive ? 'bg-primary text-black' : 'bg-base-100 hover:bg-base-300'
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

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        <div className="bg-base-200 p-4 rounded-2xl mb-8">
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
                </div>
            )}
            <div className="flex justify-between items-center border-t border-base-300 pt-3 mt-4">
                <button onClick={() => setShowAdvanced(!showAdvanced)} className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
                    <span>{showAdvanced ? 'Скрыть доп. фильтры' : 'Показать доп. фильтры'}</span>
                    <ChevronDownIcon className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                </button>
                <button onClick={resetFilters} className="px-4 py-2 text-sm font-semibold rounded-full bg-base-300 hover:bg-secondary transition-colors flex items-center gap-2">
                    <XCircleIcon className="w-5 h-5" />
                    <span>Сбросить</span>
                </button>
            </div>
        </div>
    );
};

const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
  const handlePrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };
  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  const getPageNumbers = () => {
    const pageNumbers: (number | string)[] = [];
    const maxPagesToShow = 7;
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    } else {
      pageNumbers.push(1);
      if (currentPage > 4) pageNumbers.push('...');
      
      let start = Math.max(2, currentPage - 2);
      let end = Math.min(totalPages - 1, currentPage + 2);

      if (currentPage <= 4) end = 5;
      if (currentPage >= totalPages - 3) start = totalPages - 4;

      for (let i = start; i <= end; i++) pageNumbers.push(i);

      if (currentPage < totalPages - 3) pageNumbers.push('...');
      pageNumbers.push(totalPages);
    }
    return [...new Set(pageNumbers)];
  };

  const pages = getPageNumbers();

  return (
    <nav className="flex items-center justify-center space-x-1 sm:space-x-2">
      <button onClick={handlePrev} disabled={currentPage === 1} className="px-3 py-2 bg-base-200 rounded-md disabled:opacity-50 hover:bg-base-300 text-sm font-semibold">Назад</button>
      {pages.map((page, index) =>
        typeof page === 'number' ? (
          <button
            key={`${page}-${index}`}
            onClick={() => onPageChange(page)}
            className={`w-10 h-10 rounded-md text-sm font-semibold ${currentPage === page ? 'bg-primary text-black' : 'bg-base-200 hover:bg-base-300'}`}
          >{page}</button>
        ) : (
          <span key={`ellipsis-${index}`} className="px-2 py-2 text-sm">...</span>
        )
      )}
      <button onClick={handleNext} disabled={currentPage === totalPages} className="px-3 py-2 bg-base-200 rounded-md disabled:opacity-50 hover:bg-base-300 text-sm font-semibold">Вперед</button>
    </nav>
  );
};

const Collection: React.FC<CollectionProps> = ({ onItemClick, dataVersion, refreshData, openAddItemModal, onStartConversation, initialAlbumId, clearInitialAlbumId }) => {
  const [userItems, setUserItems] = useState<Collectible[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isCreateAlbumModalOpen, setIsCreateAlbumModalOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [checkingItem, setCheckingItem] = useState<Collectible | null>(null);

  const initialFilters = {
    category: 'all' as 'all' | 'coin' | 'stamp' | 'banknote',
    query: '',
    country: '',
    yearFrom: '',
    yearTo: ''
  };

  const [albumFilters, setAlbumFilters] = useState(initialFilters);
  const [unassignedFilters, setUnassignedFilters] = useState(initialFilters);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

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
        const [collectiblesRes, albumsRes] = await Promise.all([
          supabase.from('collectibles').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }),
          supabase.from('albums').select('*').eq('owner_id', user.id).order('name', { ascending: true })
        ]);

        if (!isMounted.current) return;
        
        const { data: collectiblesData, error: collectiblesError } = collectiblesRes;
        if (collectiblesError) {
          console.error('Error fetching user collection:', collectiblesError.message);
        } else {
          setUserItems((collectiblesData || []) as Collectible[]);
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
    return filteredItems;
  };

  const itemsInSelectedAlbum = useMemo(() => {
    if (!selectedAlbum) return [];
    const items = userItems.filter(item => item.album_id === selectedAlbum.id);
    return applyFilters(items, albumFilters);
  }, [selectedAlbum, userItems, albumFilters]);

  const unassignedItems = useMemo(() => userItems.filter(item => !item.album_id), [userItems]);
  const filteredUnassignedItems = useMemo(() => applyFilters(unassignedItems, unassignedFilters), [unassignedItems, unassignedFilters]);

  const totalPages = Math.ceil(filteredUnassignedItems.length / ITEMS_PER_PAGE);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUnassignedItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUnassignedItems, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);
  
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


  if (loading) {
    return <div>Загрузка коллекции...</div>;
  }

  return (
    <>
      <div>
        <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              {selectedAlbum && (
                  <button onClick={handleBackToAlbums} className="p-2 rounded-full bg-base-200 hover:bg-base-300 transition-colors" aria-label="Назад к альбомам">
                      <ArrowLeftIcon className="w-6 h-6" />
                  </button>
              )}
              <h1 className="text-3xl font-bold">{selectedAlbum ? selectedAlbum.name : 'Моя коллекция'}</h1>
            </div>
            <div className="flex items-center space-x-2">
                {!selectedAlbum && (
                    <button onClick={handleOpenCreateAlbumModal} className="bg-base-200 hover:bg-base-300 font-semibold py-2 px-4 rounded-full text-sm flex items-center gap-2">
                        <FolderPlusIcon className="w-4 h-4" />
                        <span>Создать альбом</span>
                    </button>
                )}
                <button
                    onClick={() => openAddItemModal(selectedAlbum?.id)}
                    className="bg-primary hover:scale-105 text-black font-semibold py-2 px-4 rounded-full text-sm flex items-center gap-2 transition-transform duration-200"
                    aria-label="Добавить новый предмет"
                >
                    <PlusIcon className="w-4 h-4" />
                    <span>Добавить</span>
                </button>
            </div>
        </div>

        {selectedAlbum ? (
            // VIEW: ITEMS IN ALBUM
            <div>
              <FilterPanel filters={albumFilters} setFilters={setAlbumFilters} initialFilters={initialFilters} />
              <div className="mb-8 text-sm text-base-content/70">Найдено: {itemsInSelectedAlbum.length}</div>
              {itemsInSelectedAlbum.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {itemsInSelectedAlbum.map(item => <ItemCard key={item.id} item={item} onItemClick={onItemClick} onCheckWantlist={setCheckingItem} />)}
                </div>
              ) : (
                <div className="text-center py-16 bg-base-200 rounded-2xl">
                    <h2 className="text-xl font-bold">В этом альбоме пока пусто</h2>
                    <p className="text-base-content/70 mt-2">Нажмите "Добавить", чтобы пополнить его.</p>
                </div>
              )}
            </div>
        ) : (
          // VIEW: MAIN PAGE (FILTERS -> ALBUMS -> UNASSIGNED ITEMS)
          <div>
            <FilterPanel filters={unassignedFilters} setFilters={setUnassignedFilters} initialFilters={initialFilters} />
            
            {albums.length > 0 && (
                 <div className="mt-12">
                    <h2 className="text-2xl font-bold mb-6">Альбомы</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {albums.map(album => {
                            const itemsInAlbum = userItems.filter(item => item.album_id === album.id);
                            const latestItemWithImage = itemsInAlbum.find(item => item.image_url);
                            return (
                                <AlbumCard 
                                    key={album.id}
                                    album={album}
                                    itemCount={itemsInAlbum.length}
                                    coverImageUrl={latestItemWithImage?.image_url || null}
                                    onClick={() => handleAlbumClick(album)}
                                    onEdit={() => handleOpenEditAlbumModal(album)}
                                    onDelete={() => handleDeleteAlbum(album)}
                                />
                            )
                        })}
                    </div>
                 </div>
            )}
           
            {unassignedItems.length > 0 && (
                <div className="mt-12">
                    <h2 className="text-2xl font-bold mb-6">Без альбома</h2>
                    <div className="mb-8 text-sm text-base-content/70">Найдено: {filteredUnassignedItems.length}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {paginatedItems.map(item => <ItemCard key={item.id} item={item} onItemClick={onItemClick} onCheckWantlist={setCheckingItem} />)}
                    </div>
                    {totalPages > 1 && (
                      <div className="mt-8 flex justify-center">
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                      </div>
                    )}
                </div>
            )}

            {albums.length === 0 && unassignedItems.length === 0 && (
                 <div className="text-center py-16 bg-base-200 rounded-2xl">
                    <h2 className="text-xl font-bold">Ваша коллекция пуста</h2>
                    <p className="text-base-content/70 mt-2">Нажмите "Добавить", чтобы начать.</p>
                </div>
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
    </>
  );
};

export default Collection;