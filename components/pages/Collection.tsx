import React, { useState, useEffect, useRef } from 'react';
import { Collectible } from '../../types';
import ItemCard from '../ItemCard';
import { supabase } from '../../supabaseClient';
import UploadIcon from '../icons/UploadIcon';
import ChevronDownIcon from '../icons/ChevronDownIcon';
import XCircleIcon from '../icons/XCircleIcon';
import FilterIcon from '../icons/FilterIcon';


interface CollectionProps {
  onItemClick: (item: Collectible) => void;
  dataVersion: number;
  refreshData: () => void;
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


const Collection: React.FC<CollectionProps> = ({ onItemClick, dataVersion, refreshData }) => {
  const [userItems, setUserItems] = useState<Collectible[]>([]);
  const [filteredItems, setFilteredItems] = useState<Collectible[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialFilters = {
    category: 'all',
    query: '',
    country: '',
    yearFrom: '',
    yearTo: ''
  };

  const [filters, setFilters] = useState(initialFilters);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const fetchUserCollection = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('handle')
          .eq('id', user.id)
          .single();

        if (profileError && isMounted.current) {
          console.error('Error fetching user profile for collection:', profileError.message);
        }
        const userHandle = profileData?.handle || '...';
        
        const { data, error } = await supabase
          .from('collectibles')
          .select('*')
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false });

        if (isMounted.current) {
          if (error) {
            console.error('Error fetching user collection:', error.message);
          } else {
            const items = (data || []).map(item => ({
              ...item,
              profiles: { handle: userHandle }
            })) as Collectible[];
            setUserItems(items);
          }
        }
      }
      if (isMounted.current) {
        setLoading(false);
      }
    };

    fetchUserCollection();
  }, [dataVersion]);
  
  useEffect(() => {
    let items = [...userItems];

    if (filters.category !== 'all') {
        items = items.filter(item => item.category === filters.category);
    }
    if (filters.query) {
        const lowerQuery = filters.query.toLowerCase();
        items = items.filter(item => 
            item.name.toLowerCase().includes(lowerQuery) || 
            (item.description && item.description.toLowerCase().includes(lowerQuery))
        );
    }
    if (filters.country) {
        const lowerCountry = filters.country.toLowerCase();
        items = items.filter(item => item.country.toLowerCase().includes(lowerCountry));
    }
    const yearFrom = parseInt(filters.yearFrom);
    if (!isNaN(yearFrom)) {
        items = items.filter(item => item.year >= yearFrom);
    }
    const yearTo = parseInt(filters.yearTo);
    if (!isNaN(yearTo)) {
        items = items.filter(item => item.year <= yearTo);
    }

    setFilteredItems(items);
  }, [filters, userItems]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (category: 'all' | 'coin' | 'stamp' | 'banknote') => {
    setFilters(prev => ({ ...prev, category }));
  };
  
  const parseCSV = (csvText: string) => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const requiredHeaders = ['name', 'category', 'country', 'year', 'description'];
    if (!requiredHeaders.every(h => headers.includes(h))) {
        throw new Error(`CSV должен содержать следующие заголовки: ${requiredHeaders.join(', ')}`);
    }

    const items = [];
    for (let i = 1; i < lines.length; i++) {
        // Regex to handle commas inside quoted fields
        const values = lines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
        if (values.length > 0) {
            const entry: { [key: string]: string } = {};
            headers.forEach((header, index) => {
                entry[header] = values[index]?.replace(/"/g, '').trim() || '';
            });
            items.push(entry);
        }
    }
    return items;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsImporting(true);
      setImportError(null);
      setImportSuccessMessage(null);

      try {
          const text = await file.text();
          const parsedItems = parseCSV(text);
          
          if (parsedItems.length === 0) {
              throw new Error("CSV файл пуст или имеет неверный формат.");
          }

          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("Пользователь не найден.");

          const itemsToInsert = parsedItems.map(item => ({
              name: item.name,
              category: item.category as 'coin' | 'stamp' | 'banknote',
              country: item.country,
              year: Number(item.year) || 0,
              description: item.description,
              owner_id: user.id
          }));

          const { error } = await supabase.from('collectibles').insert(itemsToInsert);
          if (error) throw error;
          
          setImportSuccessMessage(`Успешно импортировано ${itemsToInsert.length} предметов!`);
          refreshData();
      } catch (err: any) {
          console.error("Import failed:", err);
          setImportError(err.message || "Не удалось импортировать файл.");
      } finally {
          setIsImporting(false);
          if (fileInputRef.current) {
              fileInputRef.current.value = '';
          }
      }
  };


  const resetFilters = () => {
    setFilters(initialFilters);
    setShowAdvanced(false);
  };

  if (loading) {
    return <div>Загрузка коллекции...</div>;
  }

  return (
    <div>
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Моя коллекция</h1>
            <div className="flex items-center space-x-4">
                <button onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="bg-base-200 hover:bg-base-300 font-semibold py-2 px-4 rounded-full text-sm disabled:opacity-50 flex items-center gap-2">
                    <UploadIcon className="w-4 h-4" />
                    <span>{isImporting ? 'Импорт...' : 'Импорт CSV'}</span>
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".csv" className="hidden" />
            </div>
        </div>
        
        {importSuccessMessage && <div className="mb-4 p-4 text-sm text-green-700 bg-green-100 rounded-lg" role="alert">{importSuccessMessage}</div>}
        {importError && <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">{importError}</div>}

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
                        <input
                            id="query"
                            name="query"
                            type="text"
                            value={filters.query}
                            onChange={handleFilterChange}
                            placeholder="Поиск по названию"
                            className="w-full px-3 py-2 bg-base-100 border border-base-300 rounded-full text-sm shadow-sm placeholder-base-content/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                    </div>
                </div>
            </div>

            {showAdvanced && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-base-300 pt-4 mt-4">
                    <div>
                        <label htmlFor="country" className="text-sm font-medium text-base-content/80 mb-2 block">Страна</label>
                         <input
                            id="country"
                            name="country"
                            type="text"
                            value={filters.country}
                            onChange={handleFilterChange}
                            placeholder="Например, 'Римская империя'"
                            className="w-full px-3 py-2 bg-base-100 border border-base-300 rounded-full text-sm shadow-sm placeholder-base-content/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                    </div>
                    <div>
                        <label htmlFor="yearFrom" className="text-sm font-medium text-base-content/80 mb-2 block">Год от</label>
                         <input
                            id="yearFrom"
                            name="yearFrom"
                            type="number"
                            value={filters.yearFrom}
                            onChange={handleFilterChange}
                            placeholder="98"
                            className="w-full px-3 py-2 bg-base-100 border border-base-300 rounded-full text-sm shadow-sm placeholder-base-content/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                    </div>
                    <div>
                        <label htmlFor="yearTo" className="text-sm font-medium text-base-content/80 mb-2 block">Год до</label>
                         <input
                            id="yearTo"
                            name="yearTo"
                            type="number"
                            value={filters.yearTo}
                            onChange={handleFilterChange}
                            placeholder="117"
                            className="w-full px-3 py-2 bg-base-100 border border-base-300 rounded-full text-sm shadow-sm placeholder-base-content/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                    </div>
                </div>
            )}
             <div className="flex justify-between items-center border-t border-base-300 pt-3 mt-4">
                 <button onClick={() => setShowAdvanced(!showAdvanced)} className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
                     <span>{showAdvanced ? 'Скрыть доп. фильтры' : 'Показать доп. фильтры'}</span>
                     <ChevronDownIcon className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                 </button>
                 <button onClick={resetFilters} className="px-4 py-2 text-sm font-semibold rounded-full bg-base-300 hover:bg-secondary transition-colors flex items-center gap-2">
                    <XCircleIcon className="w-4 h-4" />
                    <span>Сбросить</span>
                 </button>
            </div>
        </div>

        <div className="mb-8 text-sm text-base-content/70">
            Найдено: {filteredItems.length}
        </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredItems.map(item => (
          <ItemCard key={item.id} item={item} onItemClick={onItemClick}/>
        ))}
      </div>
    </div>
  );
};

export default Collection;