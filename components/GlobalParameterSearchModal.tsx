import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Collectible, Profile } from '../types';
import ItemCard from './ItemCard';
import ItemCardSkeleton from './skeletons/ItemCardSkeleton';

interface GlobalParameterSearchModalProps {
  searchQuery: { field: string; value: any; displayValue?: string };
  onClose: () => void;
  onItemClick: (item: Collectible) => void;
  onViewProfile: (profile: Profile) => void;
  onParameterSearch: (field: string, value: any, displayValue?: string) => void;
}

const GlobalParameterSearchModal: React.FC<GlobalParameterSearchModalProps> = ({ searchQuery, onClose, onItemClick, onViewProfile, onParameterSearch }) => {
  const [results, setResults] = useState<(Collectible & { owner_profile?: Profile })[]>([]);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);
  
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

  useEffect(() => {
    const fetchResults = async () => {
      if (!searchQuery.field || !searchQuery.value) {
        setResults([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      const { data: publicAlbums, error: albumError } = await supabase
        .from('albums')
        .select('id')
        .eq('is_public', true);

      if (albumError || !publicAlbums) {
        console.error("Error fetching public albums for search:", albumError);
        setResults([]);
        setLoading(false);
        return;
      }
      
      const publicAlbumIds = publicAlbums.map(a => a.id);
      
      if (publicAlbumIds.length === 0) {
        setResults([]);
        setLoading(false);
        return;
      }
      
      const { data: collectiblesData, error } = await supabase
        .from('collectibles')
        .select('*')
        .eq(searchQuery.field, searchQuery.value)
        .in('album_id', publicAlbumIds)
        .limit(50);
      
      if (!isMounted.current) return;

      if (error) {
          console.error(`Error searching for ${searchQuery.field}=${searchQuery.value}:`, error);
          setResults([]);
          setLoading(false);
          return;
      }

      if (collectiblesData && collectiblesData.length > 0) {
        const ownerIds = [...new Set(collectiblesData.map(c => c.owner_id))];
        const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .in('id', ownerIds);
        
        let combinedData: (Collectible & { owner_profile?: Profile })[];

        if (profilesError || !profilesData) {
            console.warn('Could not fetch profiles for search results:', profilesError?.message);
            combinedData = collectiblesData as Collectible[];
        } else {
            // FIX: Cast `profilesData` to ensure correct type inference for profilesMap.
            const profilesMap = new Map((profilesData as Profile[]).map(p => [p.id, p]));
            combinedData = collectiblesData.map(c => {
                const profile = profilesMap.get(c.owner_id);
                return {
                    ...c,
                    profiles: profile 
                        ? { handle: profile.handle, avatar_url: profile.avatar_url } 
                        : null,
                    owner_profile: profile
                };
            });
        }
        setResults(combinedData);
      } else {
        setResults([]);
      }
      setLoading(false);
    };

    fetchResults();
  }, [searchQuery]);
  
  const handleItemCardClick = (item: Collectible) => {
    onClose();
    onItemClick(item);
  };
  
  const handleViewProfileClick = (profile: Profile) => {
    onClose();
    onViewProfile(profile);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-[10vh]" onClick={onClose}>
      <div 
        className="bg-base-200 rounded-2xl w-full max-w-4xl flex flex-col shadow-2xl max-h-[80vh]" 
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-base-300 flex-shrink-0">
            <h2 className="text-xl font-bold text-center">
                Результаты поиска по: <span className="text-primary">{searchQuery.displayValue || searchQuery.value}</span>
            </h2>
        </div>
        <div className="overflow-y-auto p-4">
            {loading ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => <ItemCardSkeleton key={i} />)}
                </div>
            ) : results.length === 0 ? (
                <div className="p-16 text-center text-base-content/70">
                    <h3 className="text-lg font-semibold">Ничего не найдено</h3>
                    <p>Нет общедоступных предметов, соответствующих этому параметру.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {results.map(item => (
                        <ItemCard 
                            key={item.id}
                            item={item}
                            onItemClick={handleItemCardClick}
                            onViewProfile={item.owner_profile ? () => handleViewProfileClick(item.owner_profile!) : undefined}
                            onParameterSearch={(field, value, displayValue) => {
                                onClose();
                                onParameterSearch(field, value, displayValue);
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default GlobalParameterSearchModal;