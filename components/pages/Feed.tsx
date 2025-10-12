

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Collectible, Page, Profile as ProfileData, WantlistItem } from '../../types';
import ItemCard from '../ItemCard';
import { supabase } from '../../supabaseClient';
import { Session } from '@supabase/supabase-js';
import ItemCardSkeleton from '../skeletons/ItemCardSkeleton';
import LoadMoreButton from '../LoadMoreButton';

interface FeedProps {
  onItemClick: (item: Collectible) => void;
  onCheckWantlist: (item: Collectible) => void;
  dataVersion: number;
  session: Session;
  setCurrentPage: (page: Page) => void;
  onViewProfile: (profile: ProfileData) => void;
  onParameterSearch: (field: string, value: any, displayValue?: string) => void;
}

const FilterButton: React.FC<{
    onClick: () => void;
    isActive: boolean;
    children: React.ReactNode;
}> = ({ onClick, isActive, children }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-200 ${
            isActive ? 'bg-primary text-primary-content' : 'bg-base-200 hover:bg-base-300'
        }`}
    >
        {children}
    </button>
);

const ITEMS_PER_PAGE = 12;

type FeedCollectible = Collectible & { owner_profile?: ProfileData };

const Feed: React.FC<FeedProps> = ({ onItemClick, onCheckWantlist, dataVersion, session, setCurrentPage, onViewProfile, onParameterSearch }) => {
  const [collectibles, setCollectibles] = useState<FeedCollectible[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filterCategory, setFilterCategory] = useState<'all' | 'coin' | 'stamp' | 'banknote'>('all');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // State for new action rail
  const [savedItemIds, setSavedItemIds] = useState<Set<string>>(new Set());
  const [watchedItemIds, setWatchedItemIds] = useState<Set<string>>(new Set());
  const [wantlistItems, setWantlistItems] = useState<WantlistItem[]>([]);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchUserInteractionData = useCallback(async () => {
    if (!session) return;
    const [savedRes, watchedRes, wantlistRes] = await Promise.all([
        supabase.from('saved_collectibles').select('collectible_id').eq('user_id', session.user.id),
        supabase.from('watched_collectibles').select('collectible_id').eq('user_id', session.user.id),
        // FIX: Changed select('name') to select('*') to match the WantlistItem[] type.
        supabase.from('wantlist').select('*').eq('user_id', session.user.id).eq('is_found', false)
    ]);
    if (isMounted.current) {
        if (savedRes.data) setSavedItemIds(new Set(savedRes.data.map(i => i.collectible_id)));
        if (watchedRes.data) setWatchedItemIds(new Set(watchedRes.data.map(i => i.collectible_id)));
        if (wantlistRes.data) setWantlistItems(wantlistRes.data as WantlistItem[]);
    }
  }, [session]);

  useEffect(() => {
    fetchUserInteractionData();
  }, [fetchUserInteractionData, dataVersion]);

  const fetchCollectibles = useCallback(async (isNewFilter: boolean) => {
    if (isNewFilter) setLoading(true);
    else setLoadingMore(true);
    
    const currentPage = isNewFilter ? 0 : page;
    const from = currentPage * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    let query = supabase.from('collectibles').select('*').order('created_at', { ascending: false }).range(from, to);
    if (filterCategory !== 'all') query = query.eq('category', filterCategory);

    const { data: collectiblesData, error } = await query;
    if (!isMounted.current) return;

    if (error) {
        console.error('Error fetching collectibles:', error.message);
        if (isNewFilter) setCollectibles([]);
    } else if (collectiblesData) {
        const ownerIds = [...new Set(collectiblesData.map(c => c.owner_id))];
        let combinedData: FeedCollectible[] = collectiblesData as FeedCollectible[];

        if (ownerIds.length > 0) {
            const { data: profilesData, error: profilesError } = await supabase.from('profiles').select('*').in('id', ownerIds);
            if (!profilesError && profilesData) {
                // FIX: Cast `profilesData` to ensure correct type inference for `profilesMap`, resolving an error where `profile.handle` was on an `unknown` type.
                const profilesMap = new Map((profilesData as ProfileData[]).map(p => [p.id, p]));
                // FIX: Correctly map collectibles with their owner profiles to resolve type errors.
                combinedData = collectiblesData.map(c => {
                    const profile = profilesMap.get(c.owner_id);
                    return {
                        ...c,
                        profiles: profile ? { handle: profile.handle, avatar_url: profile.avatar_url } : null,
                        owner_profile: profile
                    };
                });
            }
        }
        setCollectibles(prev => isNewFilter ? combinedData : [...prev, ...combinedData]);
        setPage(prev => isNewFilter ? 1 : prev + 1);
        setHasMore(collectiblesData.length === ITEMS_PER_PAGE);
    } else {
        setHasMore(false);
    }

    if (isNewFilter) setLoading(false);
    else setLoadingMore(false);
  }, [page, filterCategory]);

  useEffect(() => {
    setCollectibles([]);
    setPage(0);
    setHasMore(true);
    fetchCollectibles(true);
  }, [filterCategory, dataVersion]);

  // Action Handlers
  const handleSave = async (itemId: string, isCurrentlySaved: boolean) => {
    const originalState = new Set(savedItemIds);
    setSavedItemIds(prev => {
        const newSet = new Set(prev);
        if (isCurrentlySaved) newSet.delete(itemId);
        else newSet.add(itemId);
        return newSet;
    });

    if (isCurrentlySaved) {
        const { error } = await supabase.from('saved_collectibles').delete().match({ user_id: session.user.id, collectible_id: itemId });
        if (error) { setSavedItemIds(originalState); console.error(error); }
    } else {
        const { error } = await supabase.from('saved_collectibles').insert({ user_id: session.user.id, collectible_id: itemId });
        if (error) { setSavedItemIds(originalState); console.error(error); }
    }
  };

  const handleWatch = async (itemId: string, isCurrentlyWatched: boolean) => {
      const originalState = new Set(watchedItemIds);
      setWatchedItemIds(prev => {
          const newSet = new Set(prev);
          if (isCurrentlyWatched) newSet.delete(itemId);
          else newSet.add(itemId);
          return newSet;
      });

      if (isCurrentlyWatched) {
          const { error } = await supabase.from('watched_collectibles').delete().match({ user_id: session.user.id, collectible_id: itemId });
          if (error) { setWatchedItemIds(originalState); console.error(error); }
      } else {
          const { error } = await supabase.from('watched_collectibles').insert({ user_id: session.user.id, collectible_id: itemId });
          if (error) { setWatchedItemIds(originalState); console.error(error); }
      }
  };
  
  const handleOffer = (item: Collectible) => {
      // Future: Open offer modal. For now, navigate to messages.
      setCurrentPage('Messages');
  };
  
  const handleRequestInfo = (item: Collectible) => {
      // Future: Open message with pre-filled text.
       setCurrentPage('Messages');
  };

  const checkWantlistMatch = useMemo(() => {
    const wantlistNames = new Set(wantlistItems.map(item => item.name.toLowerCase()));
    return (itemName: string) => {
      const lowerItemName = itemName.toLowerCase();
      for (const wantName of wantlistNames) {
        // FIX: Add a type guard to ensure wantName is a string, resolving the 'unknown' type error.
        if (typeof wantName === 'string' && (lowerItemName.includes(wantName) || wantName.includes(lowerItemName))) {
          return true;
        }
      }
      return false;
    };
  }, [wantlistItems]);
  
  return (
    <div className="space-y-12">
      <div>
        <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold">Недавно добавленные</h1>
          <div className="flex items-center space-x-2 bg-base-200 p-1 rounded-full flex-shrink-0">
              <FilterButton onClick={() => setFilterCategory('all')} isActive={filterCategory === 'all'}>Все</FilterButton>
              <FilterButton onClick={() => setFilterCategory('coin')} isActive={filterCategory === 'coin'}>Монеты</FilterButton>
              <FilterButton onClick={() => setFilterCategory('banknote')} isActive={filterCategory === 'banknote'}>Банкноты</FilterButton>
              <FilterButton onClick={() => setFilterCategory('stamp')} isActive={filterCategory === 'stamp'}>Марки</FilterButton>
          </div>
        </div>
        {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => <ItemCardSkeleton key={i} />)}
            </div>
        ) : (
          <>
            {collectibles.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {collectibles.map((item) => {
                       const createdAt = new Date(item.created_at);
                       const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                       const isNew = createdAt > oneDayAgo;
                       const isOwner = item.owner_id === session.user.id;
                       return <ItemCard 
                                key={item.id} 
                                item={item} 
                                onItemClick={onItemClick} 
                                onCheckWantlist={onCheckWantlist} 
                                isNew={isNew}
                                onViewProfile={item.owner_profile ? () => onViewProfile(item.owner_profile!) : undefined}
                                isOwner={isOwner}
                                onParameterSearch={onParameterSearch}
                                isSaved={!isOwner && savedItemIds.has(item.id)}
                                isWatched={!isOwner && watchedItemIds.has(item.id)}
                                isWantlistMatch={!isOwner && checkWantlistMatch(item.name)}
                                onSave={handleSave}
                                onWatch={handleWatch}
                                onOffer={handleOffer}
                                onRequestInfo={handleRequestInfo}
                              />
                    })}
                </div>
            ) : (
                <div className="text-center py-16 bg-base-200 rounded-2xl">
                    <h2 className="text-xl font-bold">Ничего не найдено</h2>
                    <p className="text-base-content/70 mt-2">Попробуйте изменить фильтры.</p>
                </div>
            )}
            {hasMore && (
              <div className="mt-8 text-center">
                <LoadMoreButton
                  onClick={() => fetchCollectibles(false)}
                  loading={loadingMore}
                >
                  Загрузить еще
                </LoadMoreButton>
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