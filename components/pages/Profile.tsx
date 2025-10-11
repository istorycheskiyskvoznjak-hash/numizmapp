import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Collectible, Profile as ProfileData, Album, WantlistItem } from '../../types';
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
import MapPinIcon from '../icons/MapPinIcon';
import UserPlusIcon from './../icons/UserPlusIcon';
import UserMinusIcon from './../icons/UserMinusIcon';
import MessagesIcon from './../icons/MessagesIcon';
import ArrowLeftIcon from '../icons/ArrowLeftIcon';

interface ProfileProps {
  session: Session;
  profileId?: string; // If not provided, defaults to session user
  onItemClick: (item: Collectible) => void;
  // Navigation handlers
  onViewAlbum: (albumId: string) => void;
  onViewCollection: () => void;
  onViewWantlist: () => void;
  // Only for public profiles
  onStartConversation?: (userId: string) => void;
  onBack?: () => void;
}

interface ProfileStatProps {
    value: number;
    label: string;
    hasHeaderImage: boolean;
}
const ProfileStat: React.FC<ProfileStatProps> = ({ value, label, hasHeaderImage }) => (
    <div className={`p-4 rounded-xl text-center transition-all duration-300 ${hasHeaderImage ? 'bg-black/25 border border-white/10 backdrop-blur-md' : 'bg-base-300'}`}>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm opacity-80">{label}</p>
    </div>
);


const Profile: React.FC<ProfileProps> = ({ 
    session, 
    profileId, 
    onItemClick, 
    onViewAlbum, 
    onViewCollection, 
    onViewWantlist,
    onStartConversation,
    onBack
}) => {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [collection, setCollection] = useState<Collectible[]>([]);
    const [albums, setAlbums] = useState<Album[]>([]);
    const [wantlistCount, setWantlistCount] = useState(0);
    const [wantlistItems, setWantlistItems] = useState<WantlistItem[]>([]);
    const [followersCount, setFollowersCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [loadingFollow, setLoadingFollow] = useState(false);
    const isMounted = useRef(true);

    const userIdToFetch = profileId || session.user.id;
    const isOwnProfile = userIdToFetch === session.user.id;

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    const fetchProfileData = useCallback(async () => {
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userIdToFetch)
            .single();

        if (profileError) {
            console.error('Error fetching profile:', profileError.message);
            if (isMounted.current) setLoading(false);
            return;
        }

        const [collectionRes, albumsRes, wantlistCountRes, wantlistItemsRes, followersRes] = await Promise.all([
            supabase.from('collectibles').select('*').eq('owner_id', userIdToFetch),
            supabase.from('albums').select('*').eq('owner_id', userIdToFetch).order('name', { ascending: true }),
            supabase.from('wantlist').select('id', { count: 'exact', head: true }).eq('user_id', userIdToFetch),
            supabase.from('wantlist').select('*').eq('user_id', userIdToFetch).order('created_at', { ascending: false }).limit(4),
            supabase.from('subscriptions').select('follower_id', { count: 'exact', head: true }).eq('following_id', userIdToFetch)
        ]);

        if (isMounted.current) {
            setProfile(profileData);
            
            const itemsWithProfile = (collectionRes.data || []).map(item => ({
                ...item,
                profiles: profileData ? { handle: profileData.handle } : null
            }));
            setCollection(itemsWithProfile as Collectible[]);

            setAlbums((albumsRes.data || []) as Album[]);
            setWantlistCount(wantlistCountRes.count || 0);
            setWantlistItems(wantlistItemsRes.data || []);
            setFollowersCount(followersRes.count || 0);
            
            setLoading(false);
        }
    }, [userIdToFetch]);

     useEffect(() => {
        const checkFollowingStatus = async () => {
            if (isOwnProfile) return;
            setLoadingFollow(true);
            const { data, error } = await supabase
                .from('subscriptions')
                .select('follower_id')
                .eq('follower_id', session.user.id)
                .eq('following_id', userIdToFetch)
                .single();

            if (isMounted.current) {
                if (error && error.code !== 'PGRST116') console.error("Error checking follow status:", error);
                setIsFollowing(!!data);
                setLoadingFollow(false);
            }
        };
        checkFollowingStatus();
    }, [userIdToFetch, session.user.id, isOwnProfile]);

    useEffect(() => {
        setLoading(true);
        fetchProfileData();
    }, [fetchProfileData]);
    
    const handleProfileUpdateSuccess = () => {
        setIsEditModalOpen(false);
        fetchProfileData();
    };

    const handleFollow = async () => {
        if (isOwnProfile || !session) return;
        setLoadingFollow(true);
        const { error } = await supabase
            .from('subscriptions')
            .insert({ follower_id: session.user.id, following_id: userIdToFetch });
        
        if (isMounted.current) {
            if (error) alert("Не удалось подписаться.");
            else {
                setIsFollowing(true);
                setFollowersCount(c => c + 1);
            }
            setLoadingFollow(false);
        }
    };

    const handleUnfollow = async () => {
        if (isOwnProfile || !session) return;
        setLoadingFollow(true);
        const { error } = await supabase
            .from('subscriptions')
            .delete()
            .match({ follower_id: session.user.id, following_id: userIdToFetch });

        if (isMounted.current) {
            if (error) alert("Не удалось отписаться.");
            else {
                setIsFollowing(false);
                setFollowersCount(c => c - 1);
            }
            setLoadingFollow(false);
        }
    };


    if (loading) {
        return <div className="p-8 text-center">Загрузка профиля...</div>;
    }

    if (!profile) {
        return <div className="p-8 text-center">Не удалось загрузить профиль.</div>
    }
    
    const showcaseAlbums = albums.slice(0, 6);
    const unassignedItems = collection.filter(item => !item.album_id);
    const showcaseItems = unassignedItems.slice(0, 10);

    return (
        <>
            {!isOwnProfile && onBack && (
                <div className="mb-6">
                    <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-base-200 hover:bg-base-300 transition-colors">
                        <ArrowLeftIcon className="w-5 h-5" />
                        <span>Назад</span>
                    </button>
                </div>
            )}
            <div className="space-y-12">
                <div className="bg-base-200 p-6 rounded-2xl relative overflow-hidden">
                    {profile.header_image_url && (
                        <img 
                            src={profile.header_image_url} 
                            alt="Profile header" 
                            className="absolute inset-0 w-full h-full object-cover" 
                        />
                    )}
                    <div className={`absolute inset-0 ${profile.header_image_url ? 'bg-black/60 backdrop-blur-sm' : ''}`}></div>

                    <div className={`relative ${profile.header_image_url ? 'text-white' : ''}`}>
                        <div className="flex flex-col md:flex-row items-start gap-6">
                            <img src={profile.avatar_url} alt={profile.name || 'Avatar'} className={`w-24 h-24 rounded-lg object-cover flex-shrink-0 border-4 shadow-lg ${profile.header_image_url ? 'border-white/20' : 'border-base-content/10'}`} />
                            
                            <div className="flex-grow">
                                <div className="flex items-baseline flex-wrap">
                                    <h1 className="text-3xl font-bold">{profile.name || 'Безымянный'}</h1>
                                    <p className={`ml-2 ${profile.header_image_url ? 'text-white/70' : 'text-base-content/60'}`}>@{profile.handle || 'user'}</p>
                                </div>
                                 <p className={`mt-2 flex items-center gap-1.5 text-sm ${profile.header_image_url ? 'text-white/80' : 'text-base-content/70'}`}>
                                    <MapPinIcon className="w-4 h-4" />
                                    <span>{profile.location || 'Местоположение не указано'}</span>
                                </p>
                            </div>
                            
                            <div className="flex flex-row items-center gap-3 ml-auto flex-shrink-0 self-start mt-4 md:mt-0">
                                {isOwnProfile ? (
                                    <>
                                        <button onClick={() => setIsEditModalOpen(true)} className={`${profile.header_image_url ? 'bg-black/25 text-white hover:bg-black/40 border border-white/10 hover:border-white/20 backdrop-blur-md' : 'bg-base-300 hover:bg-base-content/20 text-base-content'} font-semibold py-2 px-4 rounded-full text-sm transition-all duration-300 flex items-center gap-2 justify-center`}>
                                            <EditIcon className="w-4 h-4" />
                                            <span>Редактировать</span>
                                        </button>
                                        <button onClick={() => setIsQrModalOpen(true)} className={`${profile.header_image_url ? 'bg-black/25 text-white hover:bg-black/40 border border-white/10 hover:border-white/20 backdrop-blur-md' : 'bg-base-300 hover:bg-base-content/20 text-base-content'} font-semibold py-2 px-4 rounded-full text-sm transition-all duration-300 flex items-center gap-2 justify-center`}>
                                            <QrCodeIcon className="w-4 h-4" />
                                            <span>QR-код</span>
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button 
                                            onClick={isFollowing ? handleUnfollow : handleFollow}
                                            disabled={loadingFollow}
                                            className={`font-semibold py-2 px-5 rounded-full text-sm transition-colors flex items-center gap-2 disabled:opacity-50 ${
                                                isFollowing 
                                                ? `${profile.header_image_url ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-base-300 text-base-content hover:bg-base-content/20'}`
                                                : 'bg-primary/80 text-black hover:bg-primary'
                                            }`}
                                        >
                                            {isFollowing ? <UserMinusIcon className="w-4 h-4" /> : <UserPlusIcon className="w-4 h-4" />}
                                            <span>{loadingFollow ? '...' : (isFollowing ? 'Отписаться' : 'Подписаться')}</span>
                                        </button>
                                        <button 
                                            onClick={() => onStartConversation?.(userIdToFetch)}
                                            className="bg-primary/80 text-black hover:bg-primary font-semibold py-2 px-5 rounded-full text-sm transition-colors flex items-center gap-2"
                                        >
                                            <MessagesIcon className="w-4 h-4" />
                                            <span>Написать</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                         <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <ProfileStat value={collection.length} label="Предметы" hasHeaderImage={!!profile.header_image_url} />
                            <ProfileStat value={albums.length} label="Альбомы" hasHeaderImage={!!profile.header_image_url} />
                            <ProfileStat value={wantlistCount} label="В вишлисте" hasHeaderImage={!!profile.header_image_url} />
                            <ProfileStat value={followersCount} label="Подписчики" hasHeaderImage={!!profile.header_image_url} />
                        </div>
                    </div>
                </div>
                
                <div className="space-y-12">
                    {showcaseAlbums.length > 0 && (
                        <div id="profile-albums-section">
                            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <RectangleGroupIcon className="w-6 h-6 text-base-content/70" />
                                <span>Альбомы</span>
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {showcaseAlbums.map(album => {
                                    const itemsInAlbum = collection.filter(item => item.album_id === album.id);
                                    const latestItemWithImage = itemsInAlbum.find(item => item.image_url);
                                    return (
                                        <AlbumCard 
                                            key={album.id}
                                            album={album}
                                            itemCount={itemsInAlbum.length}
                                            coverImageUrl={latestItemWithImage?.image_url || null}
                                            onClick={() => isOwnProfile && onViewAlbum(album.id)}
                                        />
                                    );
                                })}
                            </div>
                             {albums.length > 6 && isOwnProfile && (
                                <div className="mt-8 text-center">
                                    <button onClick={onViewCollection} className="bg-base-200 hover:bg-secondary font-bold py-3 px-8 rounded-full text-base transition-all duration-300 shadow-lg hover:shadow-xl w-full sm:w-auto">
                                        Посмотреть все альбомы
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {wantlistItems.length > 0 && (
                            <div id="profile-wantlist-section">
                            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                <HeartIcon className="w-6 h-6 text-base-content/70" />
                                <span>Недавнее в вишлисте</span>
                            </h3>
                            <div className="space-y-2">
                                {wantlistItems.map(item => (
                                    <div key={item.id} className="bg-base-200 p-4 rounded-lg font-semibold">
                                        {item.name}
                                    </div>
                                ))}
                            </div>
                            {wantlistCount > 4 && isOwnProfile && (
                                <div className="mt-8 text-center">
                                    <button onClick={onViewWantlist} className="bg-base-200 hover:bg-secondary font-bold py-3 px-8 rounded-full text-base transition-all duration-300 shadow-lg hover:shadow-xl w-full sm:w-auto">
                                        Перейти к вишлисту
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {showcaseItems.length > 0 && (
                        <div id="profile-items-section">
                            <h3 className="text-2xl font-bold mb-6">{showcaseAlbums.length > 0 ? 'Предметы без альбома' : 'Недавние предметы'}</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                {showcaseItems.map(item => (
                                    <ItemCard key={item.id} item={item} onItemClick={onItemClick} />
                                ))}
                            </div>
                                {unassignedItems.length > 10 && isOwnProfile && (
                                <div className="mt-8 text-center">
                                    <button onClick={onViewCollection} className="bg-base-200 hover:bg-secondary font-bold py-3 px-8 rounded-full text-base transition-all duration-300 shadow-lg hover:shadow-xl w-full sm:w-auto">
                                        Перейти ко всей коллекции
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {showcaseAlbums.length === 0 && showcaseItems.length === 0 && wantlistItems.length === 0 && (
                        <div className="text-center py-16 bg-base-200 rounded-2xl">
                            <h2 className="text-xl font-bold">Витрина пуста</h2>
                            <p className="text-base-content/70 mt-2">Предметы из коллекции и альбомы пользователя будут отображаться здесь.</p>
                        </div>
                    )}
                </div>
            </div>
            {isOwnProfile && isEditModalOpen && (
                <EditProfileModal 
                    profile={profile}
                    onClose={() => setIsEditModalOpen(false)}
                    onSuccess={handleProfileUpdateSuccess}
                />
            )}
            {isOwnProfile && isQrModalOpen && (
                <QRCodeModal
                    profile={profile}
                    onClose={() => setIsQrModalOpen(false)}
                />
            )}
        </>
    );
};

export default Profile;