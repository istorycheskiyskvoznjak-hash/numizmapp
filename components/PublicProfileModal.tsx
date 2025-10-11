import React, { useState, useEffect, useRef } from 'react';
import { Profile as ProfileData, Collectible } from '../types';
import { supabase } from '../supabaseClient';
import ItemCard from './ItemCard';
import MessagesIcon from './icons/MessagesIcon';
import { Session } from '@supabase/supabase-js';
import UserPlusIcon from './icons/UserPlusIcon';
import UserMinusIcon from './icons/UserMinusIcon';


interface PublicProfileModalProps {
  profile: ProfileData;
  session: Session;
  onClose: () => void;
  onItemClick: (item: Collectible) => void;
  onStartConversation: (userId: string) => void;
}

const StatCard: React.FC<{ value: number; label: string }> = ({ value, label }) => (
    <div className="bg-base-content/10 backdrop-blur-sm rounded-xl p-4 text-center">
        <p className="text-4xl font-bold">{value}</p>
        <p className="text-sm text-current opacity-70">{label}</p>
    </div>
);

const PublicProfileModal: React.FC<PublicProfileModalProps> = ({ profile, session, onClose, onItemClick, onStartConversation }) => {
    const [stats, setStats] = useState({ collection: 0, wantlist: 0 });
    const [collection, setCollection] = useState<Collectible[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [loadingFollow, setLoadingFollow] = useState(true);
    const [followersCount, setFollowersCount] = useState(profile.followers);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    useEffect(() => {
        const fetchProfileData = async () => {
            if (!profile) return;
            setLoading(true);

            const [collectionRes, wantlistRes] = await Promise.all([
                supabase
                    .from('collectibles')
                    .select('*', { count: 'exact' })
                    .eq('owner_id', profile.id)
                    .order('created_at', { ascending: false })
                    .limit(4),
                supabase
                    .from('wantlist')
                    .select('id', { count: 'exact', head: true })
                    .eq('user_id', profile.id)
            ]);
            
            if (isMounted.current) {
                const collectionItems = (collectionRes.data || []).map(item => ({
                    ...item,
                    profiles: { handle: profile.handle }
                })) as Collectible[];

                setCollection(collectionItems);
                setStats({
                    collection: collectionRes.count || 0,
                    wantlist: wantlistRes.count || 0,
                });
                setLoading(false);
            }
        };
        fetchProfileData();
    }, [profile]);
    
    useEffect(() => {
        const checkFollowingStatus = async () => {
            if (!session || session.user.id === profile.id) {
                setLoadingFollow(false);
                return;
            }
            setLoadingFollow(true);
            const { data, error } = await supabase
                .from('subscriptions')
                .select('follower_id')
                .eq('follower_id', session.user.id)
                .eq('following_id', profile.id)
                .single();

            if (isMounted.current) {
                if (error && error.code !== 'PGRST116') { // PGRST116: no rows found, which is fine
                    console.error("Error checking follow status:", error);
                }
                setIsFollowing(!!data);
                setLoadingFollow(false);
            }
        };

        checkFollowingStatus();
    }, [profile.id, session]);

    const handleFollow = async () => {
        if (!session || session.user.id === profile.id) return;
        setLoadingFollow(true);
        const { error } = await supabase
            .from('subscriptions')
            .insert({ follower_id: session.user.id, following_id: profile.id });
        
        if (isMounted.current) {
            if (error) {
                console.error("Error following user:", error);
                alert("Не удалось подписаться.");
            } else {
                setIsFollowing(true);
                setFollowersCount(c => c + 1);
            }
            setLoadingFollow(false);
        }
    };

    const handleUnfollow = async () => {
        if (!session || session.user.id === profile.id) return;
        setLoadingFollow(true);
        const { error } = await supabase
            .from('subscriptions')
            .delete()
            .match({ follower_id: session.user.id, following_id: profile.id });

        if (isMounted.current) {
            if (error) {
                console.error("Error unfollowing user:", error);
                alert("Не удалось отписаться.");
            } else {
                setIsFollowing(false);
                setFollowersCount(c => c - 1);
            }
            setLoadingFollow(false);
        }
    };

    const handleStartChat = () => {
        onStartConversation(profile.id);
        onClose();
    };

    const isOwnProfile = session.user.id === profile.id;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-base-100 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="p-8 overflow-y-auto">
                    {loading ? (
                        <p>Загрузка профиля...</p>
                    ) : (
                        <div className="space-y-12">
                            <div className="bg-base-200 p-6 rounded-2xl relative overflow-hidden">
                                {profile.header_image_url && (
                                    <img 
                                        src={profile.header_image_url} 
                                        alt="Profile header" 
                                        className="absolute inset-0 w-full h-full object-cover" 
                                    />
                                )}
                                <div className={`absolute inset-0 ${profile.header_image_url ? 'bg-black/50' : ''}`}></div>
                                
                                <div className={`relative ${profile.header_image_url ? 'text-white' : ''}`}>
                                    <div className="flex flex-col sm:flex-row items-start space-x-6">
                                        <img src={profile.avatar_url} alt={profile.name || 'Avatar'} className="w-24 h-24 rounded-lg object-cover mb-4 sm:mb-0 border-4 border-base-300" />
                                        <div className="flex-grow">
                                            <h1 className="text-3xl font-bold">{profile.name || 'Безымянный'} <span className={profile.header_image_url ? 'text-white/70' : 'text-base-content/60'}>@{profile.handle || 'user'}</span></h1>
                                            <p className={profile.header_image_url ? 'text-white/80' : 'text-base-content/70'}>{profile.location || 'Местоположение не указано'}</p>
                                        </div>
                                        <div className="flex space-x-2 mt-4 sm:mt-0">
                                            {!isOwnProfile && (
                                                <button 
                                                    onClick={isFollowing ? handleUnfollow : handleFollow}
                                                    disabled={loadingFollow}
                                                    className={`font-semibold py-2 px-5 rounded-full text-sm transition-colors flex items-center gap-2 disabled:opacity-50 ${
                                                        isFollowing 
                                                        ? 'bg-base-300 text-base-content hover:bg-base-content/20' 
                                                        : 'bg-primary/80 text-black hover:bg-primary'
                                                    }`}
                                                >
                                                    {isFollowing ? <UserMinusIcon className="w-4 h-4" /> : <UserPlusIcon className="w-4 h-4" />}
                                                    <span>{isFollowing ? 'Отписаться' : 'Подписаться'}</span>
                                                </button>
                                            )}
                                             <button 
                                                onClick={handleStartChat}
                                                className="bg-primary/80 text-black hover:bg-primary font-semibold py-2 px-5 rounded-full text-sm transition-colors flex items-center gap-2"
                                                >
                                                <MessagesIcon className="w-4 h-4" />
                                                <span>Написать</span>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                                        <StatCard value={stats.collection} label="Предметы" />
                                        <StatCard value={stats.wantlist} label="В вишлисте" />
                                        <StatCard value={followersCount} label="Подписчики" />
                                    </div>
                                </div>
                            </div>
                            
                            <div>
                                <h2 className="text-2xl font-bold mb-6">Витрина</h2>
                                {collection.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                        {collection.map(item => (
                                            <ItemCard key={item.id} item={item} onItemClick={onItemClick} />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-base-content/70 text-center py-8">Коллекция пользователя пуста.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PublicProfileModal;