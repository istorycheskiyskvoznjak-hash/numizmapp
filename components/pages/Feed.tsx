import React, { useState, useEffect, useRef } from 'react';
import { Collectible } from '../../types';
import ItemCard from '../ItemCard';
import { supabase } from '../../supabaseClient';
import { Session } from '@supabase/supabase-js';

interface FeedProps {
  onItemClick: (item: Collectible) => void;
  dataVersion: number;
  session: Session;
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

const Feed: React.FC<FeedProps> = ({ onItemClick, dataVersion, session }) => {
  const [collectibles, setCollectibles] = useState<Collectible[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<'all' | 'coin' | 'stamp' | 'banknote'>('all');
  const [subscribedCollectibles, setSubscribedCollectibles] = useState<Collectible[]>([]);
  const [loadingSubscribed, setLoadingSubscribed] = useState(true);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const fetchCollectibles = async () => {
      setLoading(true);
      
      let query = supabase
        .from('collectibles')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterCategory !== 'all') {
        query = query.eq('category', filterCategory);
      }

      const { data: collectiblesData, error } = await query;

      if (!isMounted.current) return;

      if (error) {
          console.error('Error fetching collectibles:', error.message);
          setCollectibles([]);
      } else if (collectiblesData && collectiblesData.length > 0) {
          const ownerIds = [...new Set(collectiblesData.map(c => c.owner_id))];
          const { data: profilesData, error: profilesError } = await supabase
              .from('profiles')
              .select('id, handle')
              .in('id', ownerIds);

          if (profilesError) {
              console.error('Error fetching profiles for feed:', profilesError.message);
              // Fallback: set collectibles without profile info
              setCollectibles(collectiblesData as Collectible[]);
          } else {
              const profilesMap = new Map(profilesData.map(p => [p.id, p]));
              const combinedData = collectiblesData.map(c => ({
                  ...c,
                  profiles: profilesMap.get(c.owner_id) ? { handle: profilesMap.get(c.owner_id)!.handle } : null,
              }));
              setCollectibles(combinedData as Collectible[]);
          }
      } else {
          setCollectibles([]);
      }
      setLoading(false);
    };

    fetchCollectibles();
  }, [dataVersion, filterCategory]);
  
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
        .limit(20);
        
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
            const profilesMap = new Map(profilesData.map(p => [p.id, p]));
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

  
  return (
    <div className="space-y-12">
      {/* Subscribed Feed Section */}
      {!loadingSubscribed && subscribedCollectibles.length > 0 && (
        <div>
          <h1 className="text-3xl font-bold mb-8">Из подписок</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {subscribedCollectibles.map(item => (
              <ItemCard key={item.id} item={item} onItemClick={onItemClick}/>
            ))}
          </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {collectibles.map(item => (
                <ItemCard key={item.id} item={item} onItemClick={onItemClick}/>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default Feed;