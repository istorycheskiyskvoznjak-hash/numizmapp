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
import LayoutGridIcon from '../icons/LayoutGridIcon';
import RectangleGroupIcon from '../icons/RectangleGroupIcon';
import CircleStackIcon from '../icons/CircleStackIcon';
import HeartIcon from '../icons/HeartIcon';
import UserGroupIcon from '../icons/UserGroupIcon';
import MapPinIcon from '../icons/MapPinIcon';
import WantlistItemCard from '../WantlistItemCard';

interface ProfileProps {
  onItemClick: (item: Collectible) => void;
  session: Session;
  onViewAlbum: (albumId: string) => void;
  onViewCollection: () => void;
  onViewWantlist: () => void;
}

interface StatCardProps {
    value: number;
    label: string;
    icon: React.ReactNode;
    href?: string;
}

const StatCard: React.FC<StatCardProps> = ({ value, label, icon, href }) => {
    const content = (
        <>
            <div className="flex items-center justify-center gap-3">
                {icon}
                <p className="text-4xl font-bold">{value}</p>
            </div>
            <p className="text-sm opacity-80 mt-2">{label}</p>
        </>
    );

    const commonClasses = "bg-black/25 backdrop-blur-md rounded-xl p-4 text-center border border-white/10 shadow-lg transition-all duration-300 hover:bg-black/40 hover:border-white/20 flex flex-col justify-center";

    if (href) {
        return (
            <a href={href} className={`${commonClasses} cursor-pointer`}>
                {content}
            </a>
        );
    }

    return (
        <div className={commonClasses}>
            {content}
        </div>
    );
};

const Profile: React.FC<ProfileProps> = ({ onItemClick, session, onViewAlbum, onViewCollection, onViewWantlist }) => {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [collection, setCollection] = useState<Collectible[]>([]);
    const [albums, setAlbums] = useState<Album[]>([]);
    const [wantlistCount, setWantlistCount] = useState(0);
    const [wantlistItems, setWantlistItems] = useState<WantlistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const isMounted = useRef(true);

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
            .eq('id', session.user.id)
            .single();

        const { data: collectionData, error: collectionError } = await supabase
            .from('collectibles')
            .select('*')
            .eq('owner_id', session.user.id);
        
        const { count: fetchedWantlistCount, error: wantlistCountError } = await supabase
            .from('wantlist')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', session.user.id);
            
        const { data: albumsData, error: albumsError } = await supabase
            .from('albums')
            .select('*')
            .eq('owner_id', session.user.id)
            .order('name', { ascending: true });
        
        const { data: wantlistData, error: wantlistItemsError } = await supabase
            .from('wantlist')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
            .limit(4);

        if (isMounted.current) {
            if (profileError) console.error('Error fetching profile:', profileError.message);
            else setProfile(profileData);

            if (collectionError) console.error('Error fetching collection:', collectionError.message);
            else {
                const itemsWithProfile = (collectionData || []).map(item => ({
                    ...item,
                    profiles: profileData ? { handle: profileData.handle } : null
                }));
                setCollection(itemsWithProfile as Collectible[]);
            }

            if (albumsError) console.error('Error fetching albums:', albumsError.message);
            else setAlbums((albumsData || []) as Album[]);
            
            if (wantlistCountError) console.error('Error fetching wantlist count:', wantlistCountError.message);
            else setWantlistCount(fetchedWantlistCount || 0);

            if (wantlistItemsError) console.error('Error fetching wantlist items:', wantlistItemsError.message);
            else setWantlistItems(wantlistData || []);
            
            setLoading(false);
        }
    }, [session.user.id]);

    useEffect(() => {
        setLoading(true);
        fetchProfileData();
    }, [fetchProfileData]);
    
    const handleProfileUpdateSuccess = () => {
        setIsEditModalOpen(false);
        fetchProfileData();
    }

    if (loading) {
        return <div>Загрузка профиля...</div>;
    }

    if (!profile) {
        return <div>Не удалось загрузить профиль.</div>
    }
    
    const showcaseAlbums = albums.slice(0, 4);
    const unassignedItems = collection.filter(item => !item.album_id);
    const showcaseItems = unassignedItems.slice(0, 10);

    return (
        <>
            <div className="space-y-12">
                <div className="bg-base-200 p-6 rounded-2xl relative overflow-hidden">
                    {profile.header_image_url && (
                        <img 
                            src={profile.header_image_url} 
                            alt="Profile header" 
                            className="absolute inset-0 w-full h-full object-cover filter blur-[1px]" 
                        />
                    )}
                    <div className={`absolute inset-0 ${profile.header_image_url ? 'bg-black/60' : ''}`}></div>

                    <div className={`relative space-y-6 ${profile.header_image_url ? 'text-white' : ''}`}>
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
                                <button onClick={() => setIsEditModalOpen(true)} className={`${profile.header_image_url ? 'bg-black/25 text-white hover:bg-black/40 border border-white/10 hover:border-white/20 backdrop-blur-md' : 'bg-base-300 hover:bg-base-content/20 text-base-content'} font-semibold py-2 px-4 rounded-full text-sm transition-all duration-300 flex items-center gap-2 justify-center`}>
                                    <EditIcon className="w-4 h-4" />
                                    <span>Редактировать</span>
                                </button>
                                 <button onClick={() => setIsQrModalOpen(true)} className={`${profile.header_image_url ? 'bg-black/25 text-white hover:bg-black/40 border border-white/10 hover:border-white/20 backdrop-blur-md' : 'bg-base-300 hover:bg-base-content/20 text-base-content'} font-semibold py-2 px-4 rounded-full text-sm transition-all duration-300 flex items-center gap-2 justify-center`}>
                                    <QrCodeIcon className="w-4 h-4" />
                                    <span>QR-код</span>
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <StatCard value={collection.length} label="Предметы" icon={<CircleStackIcon className="w-9 h-9 opacity-80" />} href={collection.length > 0 ? "#profile-showcase-section" : undefined} />
                            <StatCard value={albums.length} label="Альбомы" icon={<RectangleGroupIcon className="w-9 h-9 opacity-80" />} href={albums.length > 0 ? "#profile-albums-section" : undefined} />
                            <StatCard value={wantlistCount} label="В вишлисте" icon={<HeartIcon className="w-9 h-9 opacity-80" />} href={wantlistCount > 0 ? "#profile-wantlist-section" : undefined} />
                            <StatCard value={profile.followers} label="Подписчики" icon={<UserGroupIcon className="w-9 h-9 opacity-80" />} />
                        </div>
                    </div>
                </div>
                
                <div>
                    <h2 id="profile-showcase-section" className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <LayoutGridIcon className="w-6 h-6" />
                        <span>Витрина</span>
                    </h2>
                    
                    <div className="space-y-12">
                        {showcaseAlbums.length > 0 && (
                            <div id="profile-albums-section">
                                <h3 className="text-xl font-semibold mb-4 text-base-content/80 flex items-center gap-2">
                                    <RectangleGroupIcon className="w-5 h-5" />
                                    <span>Альбомы</span>
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {showcaseAlbums.map(album => {
                                        const itemsInAlbum = collection.filter(item => item.album_id === album.id);
                                        const latestItemWithImage = itemsInAlbum.find(item => item.image_url);
                                        return (
                                            <AlbumCard 
                                                key={album.id}
                                                album={album}
                                                itemCount={itemsInAlbum.length}
                                                coverImageUrl={latestItemWithImage?.image_url || null}
                                                onClick={() => onViewAlbum(album.id)}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {wantlistItems.length > 0 && (
                             <div id="profile-wantlist-section">
                                <h3 className="text-xl font-semibold mb-4 text-base-content/80 flex items-center gap-2">
                                    <HeartIcon className="w-5 h-5" />
                                    <span>Недавнее в вишлисте</span>
                                </h3>
                                <div className="space-y-4">
                                    {wantlistItems.map(item => (
                                        <WantlistItemCard 
                                            key={item.id} 
                                            item={item}
                                        />
                                    ))}
                                </div>
                                {wantlistCount > 4 && (
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
                                <h3 className="text-xl font-semibold mb-4 text-base-content/80">{showcaseAlbums.length > 0 ? 'Предметы без альбома' : 'Недавние предметы'}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                    {showcaseItems.map(item => (
                                        <ItemCard key={item.id} item={item} onItemClick={onItemClick} />
                                    ))}
                                </div>
                                 {unassignedItems.length > 10 && (
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
                                <h2 className="text-xl font-bold">Ваша витрина пуста</h2>
                                <p className="text-base-content/70 mt-2">Предметы из вашей коллекции и альбомы будут отображаться здесь.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {isEditModalOpen && (
                <EditProfileModal 
                    profile={profile}
                    onClose={() => setIsEditModalOpen(false)}
                    onSuccess={handleProfileUpdateSuccess}
                />
            )}
            {isQrModalOpen && (
                <QRCodeModal
                    profile={profile}
                    onClose={() => setIsQrModalOpen(false)}
                />
            )}
        </>
    );
};

export default Profile;