import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Collectible, Page } from '../../types';
import ItemCard from '../ItemCard';
import { supabase } from '../../supabaseClient';
import { Session } from '@supabase/supabase-js';

interface FeedProps {
  onItemClick: (item: Collectible) => void;
  dataVersion: number;
  session: Session;
  setCurrentPage: (page: Page) => void;
}

const FilterButton: React.FC<{
    onClick: () => void;
    isActive: boolean;
    children: React.ReactNode;
}> = ({ onClick, isActive, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors ${
            isActive ? 'bg-primary text-black' : 'bg-base-200 hover:bg-base-300'
        }`}
    >
        {children}
    </button>
);

const ITEMS_PER_PAGE = 12;

const Feed: React.FC<FeedProps> = ({ onItemClick, dataVersion, session, setCurrentPage }) => {
  // --- States for Subscribed Feed ---
  const [subscribedCollectibles, setSubscribedCollectibles] = useState<Collectible[]>([]);
  const [loadingSubscribed, setLoadingSubscribed] = useState(true);
  const [subscribedFilterCategory, setSubscribedFilterCategory] = useState<'all' | 'coin' | 'stamp' | 'banknote'>('all');

  // --- States for Recently Added Feed ---
  const [collectibles, setCollectibles] = useState<Collectible[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filterCategory, setFilterCategory] = useState<'all' | 'coin' | 'stamp' | 'banknote'>('all');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // --- Logic for Recently Added Feed ---
  const fetchCollectibles = useCallback(async (isNewFilter: boolean) => {
    if (isNewFilter) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    
    const currentPage = isNewFilter ? 0 : page;
    const from = currentPage * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    let query = supabase
      .from('collectibles')
      .select('*')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (filterCategory !== 'all') {
      query = query.eq('category', filterCategory);
    }

    const { data: collectiblesData, error } = await query;

    if (!isMounted.current) return;

    if (error) {
        console.error('Error fetching collectibles:', error.message);
        if (isNewFilter) setCollectibles([]);
    } else if (collectiblesData) {
        const ownerIds = [...new Set(collectiblesData.map(c => c.owner_id))];
        let combinedData: Collectible[] = collectiblesData as Collectible[];

        if (ownerIds.length > 0) {
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('id, handle')
                .in('id', ownerIds);

            if (profilesError) {
                console.error('Error fetching profiles for feed:', profilesError.message);
            } else {
                // FIX: Property 'handle' does not exist on type 'unknown'. Provide explicit type for profile data.
                const profilesMap = new Map(profilesData.map((p: {id: string, handle: string | null}) => [p.id, p]));
                combinedData = collectiblesData.map(c => ({
                    ...c,
                    profiles: profilesMap.get(c.owner_id) ? { handle: profilesMap.get(c.owner_id)!.handle } : null,
                }));
            }
        }
        
        setCollectibles(prev => isNewFilter ? combinedData : [...prev, ...combinedData]);
        setPage(prev => isNewFilter ? 1 : prev + 1);
        setHasMore(collectiblesData.length === ITEMS_PER_PAGE);
    } else {
        setHasMore(false);
    }

    if (isNewFilter) {
      setLoading(false);
    } else {
      setLoadingMore(false);
    }
  }, [page, filterCategory]);

  // Effect to reset and fetch when filter changes
  useEffect(() => {
    setCollectibles([]);
    setPage(0);
    setHasMore(true);
    fetchCollectibles(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCategory, dataVersion]);

  // --- Logic for Subscribed Feed ---
  useEffect(() => {
    const fetchSubscribedFeed = async () => {
      if (!session) {
        setLoadingSubscribed(false);
        return;
      }
      setLoadingSubscribed(true);
      
      const { data: subscriptions, error: subError } = await supabase
        .from('subscriptions')
        .select('following_id')
        .eq('follower_id', session.user.id);
        
      if (subError || !subscriptions || subscriptions.length === 0) {
        if(isMounted.current) {
            setSubscribedCollectibles([]);
            setLoadingSubscribed(false);
        }
        return;
      }
      
      const followingIds = subscriptions.map(s => s.following_id);
      
      const { data: subscribedItemsData, error: itemsError } = await supabase
        .from('collectibles')
        .select('*')
        .in('owner_id', followingIds)
        .order('created_at', { ascending: false })
        .limit(50); // Fetch more than needed for client-side filtering
        
      if (itemsError) {
        console.error('Error fetching subscribed feed:', itemsError);
        if(isMounted.current) setLoadingSubscribed(false);
        return;
      }
      
      if (subscribedItemsData && subscribedItemsData.length > 0) {
          const ownerIds = [...new Set(subscribedItemsData.map(c => c.owner_id))];
          const { data: profilesData, error: profilesError } = await supabase
              .from('profiles')
              .select('id, handle')
              .in('id', ownerIds);

          let combinedData;
          if (profilesError) {
            console.error('Error fetching profiles for subscribed feed:', profilesError);
            combinedData = subscribedItemsData; // Fallback
          } else {
            // FIX: Property 'handle' does not exist on type 'unknown'. Provide explicit type for profile data.
            const profilesMap = new Map(profilesData.map((p: {id: string, handle: string | null}) => [p.id, p]));
            combinedData = subscribedItemsData.map(c => ({
                ...c,
                profiles: profilesMap.get(c.owner_id) ? { handle: profilesMap.get(c.owner_id)!.handle } : null,
            }));
          }
          if (isMounted.current) {
            setSubscribedCollectibles(combinedData as Collectible[]);
          }
      } else {
        if (isMounted.current) {
            setSubscribedCollectibles([]);
        }
      }
      if (isMounted.current) setLoadingSubscribed(false);
    };
    
    fetchSubscribedFeed();
  }, [session, dataVersion]);
  
  const filteredSubscribedCollectibles = useMemo(() => {
      if (subscribedFilterCategory === 'all') {
          return subscribedCollectibles;
      }
      return subscribedCollectibles.filter(item => item.category === subscribedFilterCategory);
  }, [subscribedCollectibles, subscribedFilterCategory]);


  const displayedSubscribedCollectibles = filteredSubscribedCollectibles.slice(0, 10);

  return (
    <div className="space-y-12">
      {/* Subscribed Feed Section */}
      {!loadingSubscribed && subscribedCollectibles.length > 0 && (
        <div>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
            <h1 className="text-3xl font-bold">Мои подписки</h1>
            <div className="flex items-center space-x-2 bg-base-200 p-1 rounded-full self-start sm:self-center">
                <FilterButton onClick={() => setSubscribedFilterCategory('all')} isActive={subscribedFilterCategory === 'all'}>Все</FilterButton>
                <FilterButton onClick={() => setSubscribedFilterCategory('coin')} isActive={subscribedFilterCategory === 'coin'}>Монеты</FilterButton>
                <FilterButton onClick={() => setSubscribedFilterCategory('banknote')} isActive={subscribedFilterCategory === 'banknote'}>Банкноты</FilterButton>
                <FilterButton onClick={() => setSubscribedFilterCategory('stamp')} isActive={subscribedFilterCategory === 'stamp'}>Марки</FilterButton>
            </div>
          </div>
          
          {displayedSubscribedCollectibles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {displayedSubscribedCollectibles.map(item => (
                <ItemCard key={item.id} item={item} onItemClick={onItemClick}/>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-base-content/70">
                Нет предметов в выбранной категории.
            </div>
          )}

          {filteredSubscribedCollectibles.length > 10 && (
            <div className="mt-8 text-center">
              <button onClick={() => setCurrentPage('SubscriptionFeed')} className="bg-base-200 hover:bg-secondary font-bold py-3 px-8 rounded-full text-base transition-all duration-300 shadow-lg hover:shadow-xl w-full sm:w-auto">
                Показать всю ленту подписок
              </button>
            </div>
          )}
        </div>
      )}

      {/* Recently Added Section */}
      <div>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold">Недавно добавленные</h1>
          <div className="flex items-center space-x-2 bg-base-200 p-1 rounded-full self-start sm:self-center">
              <FilterButton onClick={() => setFilterCategory('all')} isActive={filterCategory === 'all'}>Все</FilterButton>
              <FilterButton onClick={() => setFilterCategory('coin')} isActive={filterCategory === 'coin'}>Монеты</FilterButton>
              <FilterButton onClick={() => setFilterCategory('banknote')} isActive={filterCategory === 'banknote'}>Банкноты</FilterButton>
              <FilterButton onClick={() => setFilterCategory('stamp')} isActive={filterCategory === 'stamp'}>Марки</FilterButton>
          </div>
        </div>
        {loading ? (
            <div>Загрузка ленты...</div>
        ) : (
          <>
            {collectibles.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {collectibles.map((item) => (
                        <ItemCard key={item.id} item={item} onItemClick={onItemClick}/>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-base-200 rounded-2xl">
                    <h2 className="text-xl font-bold">Ничего не найдено</h2>
                    <p className="text-base-content/70 mt-2">Попробуйте изменить фильтры.</p>
                </div>
            )}
            {hasMore && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => fetchCollectibles(false)}
                  disabled={loadingMore}
                  className="bg-base-200 hover:bg-secondary font-bold py-3 px-8 rounded-full text-base transition-all duration-300 shadow-lg hover:shadow-xl w-full sm:w-auto disabled:opacity-50"
                >
                  {loadingMore ? 'Загрузка...' : 'Загрузить еще'}
                </button>
              </div>
            )}
            {!hasMore && collectibles.length > 0 && <div className="text-center p-4 text-base-content/60 mt-4">Вы всё посмотрели.</div>}
          </>
        )}
      </div>
    </div>
  );
};

export default Feed;