import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Collectible, Profile } from '../types';
import SearchIcon from './icons/SearchIcon';
import ImageIcon from './icons/ImageIcon';
import UserCircleIcon from './icons/UserCircleIcon';
import SpinnerIcon from './icons/SpinnerIcon';

interface GlobalSearchModalProps {
  onClose: () => void;
  onViewProfile: (profile: Profile) => void;
  onViewItem: (itemId: string) => void;
}

type SearchResult = 
    | { type: 'profile'; data: Profile }
    | { type: 'collectible'; data: Collectible };

const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ onClose, onViewProfile, onViewItem }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const searchTimeoutRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();

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

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (searchTerm.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    searchTimeoutRef.current = window.setTimeout(async () => {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,handle.ilike.%${searchTerm}%`)
        .limit(5);

      if (profileError) console.error("Search profile error:", profileError);

      const { data: collectibleData, error: collectibleError } = await supabase
        .from('collectibles')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .limit(5);
        
      if (collectibleError) console.error("Search collectible error:", collectibleError);

      const combinedResults: SearchResult[] = [];
      if (profileData) {
        profileData.forEach(p => combinedResults.push({ type: 'profile', data: p as Profile }));
      }
      if (collectibleData) {
        collectibleData.forEach(c => combinedResults.push({ type: 'collectible', data: c as Collectible }));
      }
      setResults(combinedResults);
      setLoading(false);
    }, 300); // Debounce search

    return () => {
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
    }
  }, [searchTerm]);
  
  const handleSelect = (result: SearchResult) => {
    if (result.type === 'profile') {
        onViewProfile(result.data);
    } else {
        onViewItem(result.data.id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-[15vh]" onClick={onClose}>
      <div 
        className="bg-base-200 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl" 
        onClick={e => e.stopPropagation()}
      >
        <div className="relative p-4 border-b border-base-300">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-8">
                <SearchIcon className="w-5 h-5 text-base-content/40" />
            </div>
             {loading && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-8">
                    <SpinnerIcon className="w-5 h-5 text-primary animate-spin" />
                </div>
            )}
            <input
                ref={inputRef}
                type="text"
                placeholder="Поиск пользователей и предметов..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-12 py-3 bg-transparent text-lg focus:outline-none"
            />
        </div>
        <div className="max-h-[50vh] overflow-y-auto">
            {searchTerm.length > 1 && !loading && results.length === 0 && (
                <div className="p-16 text-center text-base-content/70">
                    <h3 className="text-lg font-semibold">Ничего не найдено</h3>
                    <p>Попробуйте другой поисковый запрос.</p>
                </div>
            )}
            {results.length > 0 && (
                <ul>
                    {results.map((result, index) => (
                        <li key={`${result.type}-${result.data.id}-${index}`}>
                            <button 
                                onClick={() => handleSelect(result)}
                                className="w-full text-left p-4 flex items-center gap-4 hover:bg-base-300 transition-colors outline-none focus-visible:bg-base-300"
                            >
                                <div className="w-12 h-12 bg-base-300 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                                {result.type === 'profile' ? (
                                    result.data.avatar_url ? (
                                        <img src={result.data.avatar_url} alt={result.data.name || ''} className="w-full h-full object-cover" />
                                    ) : (
                                        <UserCircleIcon className="w-8 h-8 text-base-content/30" />
                                    )
                                ) : (
                                     result.data.image_url ? (
                                        <img src={result.data.image_url} alt={result.data.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <ImageIcon className="w-8 h-8 text-base-content/30" />
                                    )
                                )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold truncate">{result.data.name}</p>
                                    <p className="text-sm text-base-content/70">
                                        {result.type === 'profile' ? `@${result.data.handle}` : result.data.country}
                                    </p>
                                </div>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchModal;
