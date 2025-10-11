

import React, { useState, useEffect, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../../supabaseClient';
import { Collectible, Album, WantlistItem, Profile as ProfileData } from '../../types';
import ItemCard from '../ItemCard';
import AlbumCard from '../AlbumCard';
import WantlistItemCard from '../WantlistItemCard';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';
// Import icons for visual distinction
import CircleStackIcon from '../icons/CircleStackIcon';
import FolderIcon from '../icons/FolderIcon';
import HeartIcon from '../icons/HeartIcon';


type FeedItemType = 'collectible' | 'album' | 'wantlist';

interface FeedItem {
    id: string;
    type: FeedItemType;
    created_at: string;
    owner_id: string;
    owner_profile?: Pick<ProfileData, 'id' | 'name' | 'handle' | 'avatar_url'> | null;
    data: Collectible | Album | WantlistItem;
}

interface SubscriptionFeedProps {
    session: Session;
    onItemClick: (item: Collectible) => void;
    onViewProfile: (profile: ProfileData) => void;
    onNavigateToFeed: () => void;
    onParameterSearch: (field: string, value: any, displayValue?: string) => void;
}

// Map types to styles and text for cleaner rendering
const typeInfo: Record<FeedItemType, { text: string; icon: React.FC<React.SVGProps<SVGSVGElement>>; borderColor: string; }> = {
    collectible: { text: 'добавил(а) новый предмет', icon: CircleStackIcon, borderColor: 'border-primary/50' },
    album: { text: 'создал(а) новый альбом', icon: FolderIcon, borderColor: 'border-sky-500/50' },
    wantlist: { text: 'ищет новый предмет', icon: HeartIcon, borderColor: 'border-emerald-500/50' }
};


const SubscriptionFeed: React.FC<SubscriptionFeedProps> = ({ session, onItemClick, onViewProfile, onNavigateToFeed, onParameterSearch }) => {
    const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
    const [loading, setLoading] = useState(true);
    // FIX: Changed the state type to Collectible[] to match the expected prop type in AlbumCard.
    const [albumCollectibles, setAlbumCollectibles] = useState<Collectible[]>([]);
    const [albumDetails, setAlbumDetails] = useState<Map<string, { itemCount: number }>>(new Map());
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    useEffect(() => {
        const fetchFeed = async () => {
            setLoading(true);

            const { data: subs, error: subsError } = await supabase
                .from('subscriptions')
                .select('following_id')
                .eq('follower_id', session.user.id);

            if (subsError || !subs || subs.length === 0) {
                if (isMounted.current) setLoading(false);
                return;
            }

            const followingIds = subs.map(s => s.following_id);

            const [collectiblesRes, albumsRes, wantlistRes] = await Promise.all([
                supabase.from('collectibles').select('*').in('owner_id', followingIds).order('created_at', { ascending: false }).limit(50),
                supabase.from('albums').select('*').in('owner_id', followingIds).order('created_at', { ascending: false }).limit(50),
                supabase.from('wantlist').select('*').in('user_id', followingIds).order('created_at', { ascending: false }).limit(50)
            ]);
            
            if (!isMounted.current) return;

            const albumIds = (albumsRes.data || []).map(a => a.id);
            if (albumIds.length > 0) {
                const { data: fetchedAlbumCollectibles } = await supabase
                    .from('collectibles')
                    .select('id, album_id, image_url, name, category, country, year, description, owner_id, created_at')
                    .in('album_id', albumIds);
                
                if (isMounted.current && fetchedAlbumCollectibles) {
                    setAlbumCollectibles(fetchedAlbumCollectibles as Collectible[]);
                }
                
                const detailsMap = (albumsRes.data || []).reduce((acc, album) => {
                    const itemsInAlbum = (fetchedAlbumCollectibles || []).filter(c => c.album_id === album.id);
                    acc.set(album.id, {
                        itemCount: itemsInAlbum.length,
                    });
                    return acc;
                }, new Map<string, { itemCount: number }>());
                setAlbumDetails(detailsMap);
            }

            const allItemsRaw = [
                ...(collectiblesRes.data || []).map(i => ({ ...i, type: 'collectible' as FeedItemType, owner_id: i.owner_id })),
                ...(albumsRes.data || []).map(i => ({ ...i, type: 'album' as FeedItemType, owner_id: i.owner_id })),
                ...(wantlistRes.data || []).map(i => ({ ...i, type: 'wantlist' as FeedItemType, owner_id: i.user_id }))
            ];
            
            allItemsRaw.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            const ownerIds = [...new Set(allItemsRaw.map(i => i.owner_id))];
            const { data: profilesData } = await supabase.from('profiles').select('id, name, handle, avatar_url').in('id', ownerIds);
            const profilesMap = new Map(profilesData?.map(p => [p.id, p]));

            const finalFeedItems = allItemsRaw.map(item => ({
                id: item.id,
                type: item.type,
                created_at: item.created_at,
                owner_id: item.owner_id,
                owner_profile: profilesMap.get(item.owner_id),
                data: item
            }));

            if (isMounted.current) {
                setFeedItems(finalFeedItems);
                setLoading(false);
            }
        };

        fetchFeed();
    }, [session.user.id]);

    const handleAlbumCardClick = (album: Album) => {
      // Find the profile and view it. The card itself isn't a collection view.
      const profile = feedItems.find(item => item.id === album.id)?.owner_profile;
      if (profile) {
        onViewProfile(profile as ProfileData);
      }
    };

    return (
        <div>
            <div className="flex items-center gap-4 mb-8">
                <button onClick={onNavigateToFeed} className="p-2 rounded-full bg-base-200 hover:bg-base-300 transition-colors" aria-label="Назад к ленте">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="text-3xl font-bold">Лента подписок</h1>
            </div>

            {loading ? (
                <p>Загрузка ленты...</p>
            ) : feedItems.length === 0 ? (
                <div className="text-center py-16 bg-base-200 rounded-2xl">
                    <h2 className="text-xl font-bold">В ленте пока тихо</h2>
                    <p className="text-base-content/70 mt-2">Когда пользователи, на которых вы подписаны, добавят что-то новое, это появится здесь.</p>
                </div>
            ) : (
                <div className="max-w-3xl mx-auto space-y-8">
                    {feedItems.map(item => {
                        const info = typeInfo[item.type];
                        const Icon = info.icon;

                        return (
                            <div key={`${item.type}-${item.id}`} className={`bg-base-200 p-4 rounded-2xl border-l-4 ${info.borderColor} shadow-sm`}>
                                <div className="flex items-center gap-3 mb-4">
                                    <button onClick={() => item.owner_profile && onViewProfile(item.owner_profile as ProfileData)}>
                                        <img 
                                            src={item.owner_profile?.avatar_url || `https://i.pravatar.cc/150?u=${item.owner_id}`} 
                                            alt={item.owner_profile?.name || 'avatar'}
                                            className="w-10 h-10 rounded-full object-cover" 
                                        />
                                    </button>
                                    <div>
                                        <p className="text-sm flex items-center gap-2 flex-wrap">
                                            <button onClick={() => item.owner_profile && onViewProfile(item.owner_profile as ProfileData)} className="font-bold hover:underline">
                                                {item.owner_profile?.name || item.owner_profile?.handle}
                                            </button>
                                            <span className="text-base-content/80 flex items-center gap-1.5">
                                                <Icon className="w-4 h-4 text-base-content/60 flex-shrink-0" />
                                                <span>{info.text}</span>
                                            </span>
                                        </p>
                                        <p className="text-xs text-base-content/60">{new Date(item.created_at).toLocaleString('ru-RU')}</p>
                                    </div>
                                </div>
                                
                                {item.type === 'collectible' && <ItemCard 
                                    item={{
                                        ...(item.data as Collectible),
                                        profiles: item.owner_profile ? { handle: item.owner_profile.handle, avatar_url: item.owner_profile.avatar_url } : null
                                    }} 
                                    onItemClick={onItemClick}
                                    onViewProfile={item.owner_profile ? () => onViewProfile(item.owner_profile as ProfileData) : undefined}
                                    onParameterSearch={onParameterSearch}
                                />}
                                {item.type === 'album' && (
                                    <AlbumCard 
                                        album={item.data as Album}
                                        items={albumCollectibles.filter(c => c.album_id === (item.data as Album).id)}
                                        itemCount={albumDetails.get(item.id)?.itemCount || 0}
                                        onClick={() => handleAlbumCardClick(item.data as Album)}
                                    />
                                )}
                                {item.type === 'wantlist' && <WantlistItemCard item={item.data as WantlistItem} />}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
};

export default SubscriptionFeed;