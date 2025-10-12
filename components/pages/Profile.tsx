import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Collectible, Profile as ProfileData, Album, WantlistItem, WantlistList } from '../../types';
import ItemCard from '../ItemCard';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../../supabaseClient';
import EditProfileModal from '../EditProfileModal';
import EditIcon from '../icons/EditIcon';
import QrCodeIcon from '../icons/QrCodeIcon';
import QRCodeModal from '../QRCodeModal';
import AlbumCard from '../AlbumCard';
import RectangleGroupIcon from '../icons/RectangleGroupIcon';
import HeartIcon from '../icons/HeartIcon';
import MapPinIcon from './../icons/MapPinIcon';
import UserPlusIcon from './../icons/UserPlusIcon';
import UserMinusIcon from './../icons/UserMinusIcon';
import MessagesIcon from './../icons/MessagesIcon';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';
import WantlistItemCard from '../WantlistItemCard';
import WantlistFormModal from '../WantlistFormModal';
import PlusIcon from '../icons/PlusIcon';
import WantlistListCard from '../WantlistListCard';
import BookmarkIcon from '../icons/BookmarkIcon';


interface ProfileProps {
  session: Session | null;
  profileId?: string; // If not provided, defaults to session user
  onItemClick: (item: Collectible) => void;
  // Navigation handlers
  onViewAlbum: (albumId: string) => void;
  onViewCollection: () => void;
  onViewWantlist: (listId?: string) => void;
  onParameterSearch: (field: string, value: any, displayValue?: string) => void;
  // Only for public profiles
  onStartConversation?: (userId: string) => void;
  onBack?: () => void;
}

const Stat: React.FC<{ value: number; label: string }> = ({ value, label }) => (
    <div className="bg-black/20 backdrop-blur rounded-xl p-4 text-center text-white border border-white/20 shadow-2xl shadow-black/30">
        <p className="text-3xl font-bold">{value}</p>
        <p className="text-sm opacity-80">{label}</p>
    </div>
);

const ActionButton: React.FC<{ onClick: () => void; children: React.ReactNode; icon: React.ReactNode; className?: string }> = ({ onClick, children, icon, className }) => (
    <button
        onClick={onClick}
        className={`w-full sm:w-auto flex items-center justify-center gap-2 bg-black/20 backdrop-blur rounded-full py-2 px-5 text-sm font-semibold text-white border border-white/20 shadow-2xl shadow-black/30 hover:bg-black/40 transition-colors ${className}`}
    >
        {icon}
        <span>{children}</span>
    </button>
);


type ClientWantlistItem = WantlistItem & { is_transitioning?: boolean };

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


const Profile: React.FC<ProfileProps> = ({ 
    session, 
    profileId, 
    onItemClick,
    onViewAlbum,
    onViewCollection,
    onViewWantlist,
    onParameterSearch,
    onStartConversation,
    onBack,
}) => {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [collectibles, setCollectibles] = useState<Collectible[]>([]);
    const [albums, setAlbums] = useState<Album[]>([]);
    const [wantlistItems, setWantlistItems] = useState<WantlistItem[]>([]);
    const [wantlistLists, setWantlistLists] = useState<WantlistList[]>([]);
    const [savedItems, setSavedItems] = useState<Collectible[]>([]);
    const [followers, setFollowers] = useState(0);
    const [following, setFollowing] = useState(0);
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [view, setView] = useState<'collection' | 'wantlist' | 'saved'>('collection');
    const [unassignedFilter, setUnassignedFilter] = useState<'all' | 'coin' | 'stamp' | 'banknote'>('all');

    const isMounted = useRef(true);

    const isOwnProfile = !!session && (!profileId || profileId === session.user.id);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    const fetchProfileData = useCallback(async () => {
        setLoading(true);
        const userId = profileId || session?.user.id;

        if (!userId) {
            setLoading(false);
            return;
        }
        
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (profileError) {
            console.error('Error fetching profile:', profileError);
            setLoading(false);
            return;
        }

        if (isMounted.current) {
            setProfile(profileData as ProfileData);
        }
        
        const { count: followerCount } = await supabase
            .from('subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('following_id', userId);

        const { count: followingCount } = await supabase
            .from('subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('follower_id', userId);
        
        if (!isOwnProfile && session) {
            const { data: followingCheck, error: followingError } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('follower_id', session.user.id)
                .eq('following_id', userId)
                .maybeSingle();
            if (isMounted.current) setIsFollowing(!!followingCheck);
        }

        if (isMounted.current) {
            setFollowers(followerCount || 0);
            setFollowing(followingCount || 0);
        }

        const [collectiblesRes, albumsRes, wantlistItemsRes, wantlistListsRes] = await Promise.all([
            supabase.from('collectibles').select('*').eq('owner_id', userId).order('created_at', { ascending: false }),
            isOwnProfile || !session // Logged out users can see all public albums
                ? supabase.from('albums').select('*').eq('owner_id', userId).order('name', { ascending: true })
                : supabase.from('albums').select('*').eq('owner_id', userId).eq('is_public', true).order('name', { ascending: true }),
            supabase.from('wantlist').select('*').eq('user_id', userId),
            isOwnProfile || !session // Logged out users can see all public wantlists
                ? supabase.from('wantlist_lists').select('*').eq('user_id', userId).order('name', { ascending: true })
                : supabase.from('wantlist_lists').select('*').eq('user_id', userId).eq('is_public', true).order('name', { ascending: true })
        ]);

        if (isOwnProfile && session) {
            const { data: savedRelations, error: savedError } = await supabase
              .from('saved_collectibles')
              .select('collectible_id')
              .eq('user_id', session.user.id);
        
            if (savedError) {
              console.error("Error fetching saved relations:", savedError);
              if (isMounted.current) setSavedItems([]);
            } else if (savedRelations && savedRelations.length > 0) {
              const savedIds = savedRelations.map(r => r.collectible_id);
        
              const { data: savedItemsData, error: itemsError } = await supabase
                .from('collectibles')
                .select('*')
                .in('id', savedIds);
        
              if (itemsError) {
                console.error("Error fetching saved collectibles:", itemsError);
                if (isMounted.current) setSavedItems([]);
              } else if (savedItemsData) {
                const ownerIds = [...new Set(savedItemsData.map(c => c.owner_id))];
                let combinedData: Collectible[] = savedItemsData as Collectible[];
        
                if (ownerIds.length > 0) {
                  const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, handle, avatar_url')
                    .in('id', ownerIds);
        
                  if (!profilesError && profilesData) {
                    // FIX: Cast `profilesData` to a typed array to ensure correct type inference for profilesMap.
                    const profilesMap = new Map((profilesData as { id: string, handle: string | null, avatar_url: string }[]).map(p => [p.id, p]));
                    combinedData = savedItemsData.map(item => {
                      const ownerProfile = profilesMap.get(item.owner_id);
                      return {
                        ...item,
                        profiles: ownerProfile
                          ? { handle: ownerProfile.handle, avatar_url: ownerProfile.avatar_url }
                          : null
                      };
                    });
                  }
                }
                if (isMounted.current) {
                  setSavedItems(combinedData);
                }
              }
            } else {
              if (isMounted.current) setSavedItems([]);
            }
          }

        if (!isMounted.current) return;
        
        setAlbums(albumsRes.data as Album[] || []);
        
        if (collectiblesRes.error) console.error("Error fetching collectibles", collectiblesRes.error);
        else {
            if (isOwnProfile || !session) { // Show all items if own profile, or if user is logged out
                setCollectibles(collectiblesRes.data as Collectible[]);
            } else {
                const publicAlbumIds = (albumsRes.data || []).map(a => a.id);
                const publicCollectibles = (collectiblesRes.data || []).filter(c => c.album_id && publicAlbumIds.includes(c.album_id));
                setCollectibles(publicCollectibles as Collectible[]);
            }
        }
        
        setWantlistItems(wantlistItemsRes.data as WantlistItem[] || []);
        setWantlistLists(wantlistListsRes.data as WantlistList[] || []);
        
        setLoading(false);
    }, [profileId, session, isOwnProfile]);

    useEffect(() => {
        fetchProfileData();
    }, [fetchProfileData]);

    const handleFollow = async () => {
        if (isOwnProfile || !profile || !session) return;
        setIsFollowing(true);
        setFollowers(f => f + 1);
        const { error } = await supabase
            .from('subscriptions')
            .insert({ follower_id: session.user.id, following_id: profile.id });
        if (error) {
            console.error("Error following:", error);
            setIsFollowing(false);
            setFollowers(f => f - 1);
        }
    };

    const handleUnfollow = async () => {
        if (isOwnProfile || !profile || !session) return;
        setIsFollowing(false);
        setFollowers(f => f - 1);
        const { error } = await supabase
            .from('subscriptions')
            .delete()
            .eq('follower_id', session.user.id)
            .eq('following_id', profile.id);
        if (error) {
            console.error("Error unfollowing:", error);
            setIsFollowing(true);
            setFollowers(f => f + 1);
        }
    };

    if (loading) {
        return <div>Загрузка профиля...</div>;
    }

    if (!profile) {
        return <div>Профиль не найден.</div>;
    }

    const unassignedItems = collectibles.filter(c => !c.album_id);
    const filteredUnassignedItems = unassignedItems.filter(item => {
        if (unassignedFilter === 'all') return true;
        return item.category === unassignedFilter;
    });

    return (
        <>
            {/* Header Section */}
            <div className="relative rounded-2xl overflow-hidden shadow-lg mb-8">
                {/* Background */}
                {profile.header_image_url ? (
                    <img src={profile.header_image_url} alt="Header" className="absolute inset-0 w-full h-full object-cover scale-105" />
                ) : (
                    <div className="absolute inset-0 w-full h-full bg-base-300"></div>
                )}
                <div className="absolute inset-0 bg-black/50"></div>

                {/* Back Button */}
                {onBack && (
                    <button onClick={onBack} className="absolute top-4 left-4 z-10 p-2 rounded-full bg-black/20 backdrop-blur-sm hover:bg-black/40 transition-colors" aria-label="Назад">
                        <ArrowLeftIcon className="w-6 h-6 text-white" />
                    </button>
                )}

                {/* Content */}
                <div className="relative p-6 md:p-8 space-y-6 text-white">
                    {/* Top section: User Info & Actions */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pt-10 md:pt-0">
                        {/* User Info */}
                        <div className="flex items-center gap-4">
                            <img src={profile.avatar_url} alt={profile.name || ''} className="w-24 h-24 rounded-[14px] object-cover border-4 border-white/20 shadow-lg flex-shrink-0" />
                            <div>
                                <div className="flex items-baseline gap-3">
                                    <h1 className="text-3xl font-bold" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{profile.name}</h1>
                                    <p className="text-lg text-white/80">@{profile.handle}</p>
                                </div>
                                {profile.location && (
                                    <p className="text-sm text-white/70 flex items-center gap-2 pt-1">
                                        <MapPinIcon className="w-4 h-4" />
                                        {profile.location}
                                    </p>
                                )}
                            </div>
                        </div>
                        {/* Action Buttons */}
                        {session && (
                            <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-3 flex-shrink-0">
                                {isOwnProfile ? (
                                    <>
                                        <ActionButton onClick={() => setIsEditModalOpen(true)} icon={<EditIcon className="w-4 h-4" />}>Редактировать</ActionButton>
                                        <ActionButton 
                                            onClick={() => setIsQrModalOpen(true)} 
                                            icon={<QrCodeIcon className="w-4 h-4" />}
                                            className="!bg-white/40 !text-black hover:!bg-white/60"
                                        >
                                            QR-код
                                        </ActionButton>
                                    </>
                                ) : (
                                    <>
                                        {isFollowing ? (
                                            <ActionButton onClick={handleUnfollow} icon={<UserMinusIcon className="w-4 h-4" />}>Отписаться</ActionButton>
                                        ) : (
                                            <ActionButton onClick={handleFollow} icon={<UserPlusIcon className="w-4 h-4" />}>Подписаться</ActionButton>
                                        )}
                                        <ActionButton onClick={() => onStartConversation?.(profile.id)} icon={<MessagesIcon className="w-4 h-4" />}>Написать</ActionButton>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Stats Section */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
                        <Stat value={wantlistItems.length} label="В вишлисте" />
                        <Stat value={collectibles.length} label="Предметы" />
                        <Stat value={following} label="Подписки" />
                        <Stat value={followers} label="Подписчики" />
                    </div>
                </div>
            </div>
            
            {/* Content Tabs */}
            <div className="mt-8 flex justify-center border-b border-base-300">
                <button onClick={() => setView('collection')} className={`px-6 py-3 font-semibold text-sm transition-colors ${view === 'collection' ? 'border-b-2 border-primary text-primary' : 'text-base-content/70 hover:text-base-content'}`}><RectangleGroupIcon className="w-5 h-5 inline-block mr-2" />Коллекция</button>
                {isOwnProfile && <button onClick={() => setView('saved')} className={`px-6 py-3 font-semibold text-sm transition-colors ${view === 'saved' ? 'border-b-2 border-primary text-primary' : 'text-base-content/70 hover:text-base-content'}`}><BookmarkIcon className="w-5 h-5 inline-block mr-2"/>Сохраненные</button>}
                <button onClick={() => setView('wantlist')} className={`px-6 py-3 font-semibold text-sm transition-colors ${view === 'wantlist' ? 'border-b-2 border-primary text-primary' : 'text-base-content/70 hover:text-base-content'}`}><HeartIcon className="w-5 h-5 inline-block mr-2"/>Вишлисты</button>
            </div>
            
            {view === 'collection' && (
                <div className="mt-8">
                    {albums.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold mb-4">{isOwnProfile ? 'Мои альбомы' : 'Альбомы'}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {albums.map(album => {
                                    const itemsInAlbum = collectibles.filter(c => c.album_id === album.id);
                                    return (
                                        <AlbumCard
                                            key={album.id}
                                            album={album}
                                            items={itemsInAlbum}
                                            itemCount={itemsInAlbum.length}
                                            onClick={() => onViewAlbum(album.id)}
                                            isOwnProfile={isOwnProfile}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    
                    {isOwnProfile && unassignedItems.length > 0 && (
                        <div className="mt-12">
                             <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
                                <h2 className="text-2xl font-bold">Без альбомов</h2>
                                <div className="flex items-center space-x-2 bg-base-200 p-1 rounded-full flex-shrink-0">
                                    <FilterButton onClick={() => setUnassignedFilter('all')} isActive={unassignedFilter === 'all'}>Все</FilterButton>
                                    <FilterButton onClick={() => setUnassignedFilter('coin')} isActive={unassignedFilter === 'coin'}>Монеты</FilterButton>
                                    <FilterButton onClick={() => setUnassignedFilter('banknote')} isActive={unassignedFilter === 'banknote'}>Банкноты</FilterButton>
                                    <FilterButton onClick={() => setUnassignedFilter('stamp')} isActive={unassignedFilter === 'stamp'}>Марки</FilterButton>
                                </div>
                            </div>
                            {filteredUnassignedItems.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {filteredUnassignedItems.map(item => <ItemCard key={item.id} item={item} onItemClick={onItemClick} onParameterSearch={onParameterSearch} />)}
                                </div>
                            ) : (
                                <div className="text-center py-16 bg-base-200 rounded-2xl">
                                    <h2 className="text-xl font-bold">Ничего не найдено</h2>
                                    <p className="text-base-content/70 mt-2">Нет предметов, соответствующих выбранному фильтру.</p>
                                </div>
                            )}
                        </div>
                    )}
                    
                     {collectibles.length === 0 && (
                        <div className="text-center py-16 bg-base-200 rounded-2xl">
                            <h2 className="text-xl font-bold">{isOwnProfile ? 'Ваша коллекция пуста' : 'Коллекция пользователя пуста'}</h2>
                            {isOwnProfile && <p className="text-base-content/70 mt-2">Добавьте свой первый предмет, чтобы он появился здесь.</p>}
                        </div>
                    )}
                </div>
            )}
            
            {view === 'saved' && isOwnProfile && (
                 <div className="mt-8">
                    {savedItems.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                           {savedItems.map(item => (
                                <ItemCard 
                                    key={item.id} 
                                    item={item} 
                                    onItemClick={onItemClick} 
                                    onParameterSearch={onParameterSearch} 
                                    isSaved={true}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-base-200 rounded-2xl">
                            <h2 className="text-xl font-bold">У вас нет сохраненных предметов</h2>
                             <p className="text-base-content/70 mt-2">Нажмите на иконку закладки в ленте, чтобы сохранить что-то на потом.</p>
                        </div>
                    )}
                </div>
            )}

            {view === 'wantlist' && (
                 <div className="mt-8">
                    {wantlistLists.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           {wantlistLists.map(list => (
                                <WantlistListCard
                                    key={list.id}
                                    list={list}
                                    items={wantlistItems.filter(i => i.list_id === list.id)}
                                    onClick={() => onViewWantlist(list.id)}
                                    isOwnProfile={isOwnProfile}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-base-200 rounded-2xl">
                            <h2 className="text-xl font-bold">{isOwnProfile ? 'Ваш вишлист пуст' : 'Вишлист пользователя пуст'}</h2>
                             {isOwnProfile && <p className="text-base-content/70 mt-2">Создайте свой первый список желаний на странице "Вишлист".</p>}
                        </div>
                    )}
                </div>
            )}

            {isEditModalOpen && session && (
                <EditProfileModal profile={profile} onClose={() => setIsEditModalOpen(false)} onSuccess={() => { setIsEditModalOpen(false); fetchProfileData(); }} />
            )}
            {isQrModalOpen && (
                <QRCodeModal 
                    title={profile.name || ''}
                    subtitle={`@${profile.handle}`}
                    imageUrl={profile.avatar_url}
                    url={`${window.location.origin}?profileId=${profile.handle}`}
                    onClose={() => setIsQrModalOpen(false)} 
                    typeLabel="профилем"
                />
            )}
        </>
    );
};

export default Profile;