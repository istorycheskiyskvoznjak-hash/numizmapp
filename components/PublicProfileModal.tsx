import React, { useState, useEffect, useRef } from 'react';
import { Profile as ProfileData, Collectible } from '../types';
import { supabase } from '../supabaseClient';
import ItemCard from './ItemCard';
import MessagesIcon from './icons/MessagesIcon';

interface PublicProfileModalProps {
  profile: ProfileData;
  onClose: () => void;
  onItemClick: (item: Collectible) => void;
  onStartConversation: (userId: string) => void;
}

const StatCard: React.FC<{ value: number; label: string }> = ({ value, label }) => (
    <div className="bg-base-200 p-6 rounded-xl text-center">
        <p className="text-3xl font-bold">{value}</p>
        <p className="text-sm text-base-content/70">{label}</p>
    </div>
);

const PublicProfileModal: React.FC<PublicProfileModalProps> = ({ profile, onClose, onItemClick, onStartConversation }) => {
    const [stats, setStats] = useState({ collection: 0, wantlist: 0 });
    const [collection, setCollection] = useState<Collectible[]>([]);
    const [loading, setLoading] = useState(true);
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

    const handleStartChat = () => {
        onStartConversation(profile.id);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-base-100 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="p-8 overflow-y-auto">
                    {loading ? (
                        <p>Загрузка профиля...</p>
                    ) : (
                        <div className="space-y-12">
                            <div className="bg-base-200 p-8 rounded-2xl">
                                <div className="flex flex-col sm:flex-row items-start space-x-6">
                                    <img src={profile.avatar_url} alt={profile.name || 'Avatar'} className="w-24 h-24 rounded-lg object-cover mb-4 sm:mb-0" />
                                    <div className="flex-grow">
                                        <h1 className="text-3xl font-bold">{profile.name || 'Безымянный'} <span className="text-base-content/60">@{profile.handle || 'user'}</span></h1>
                                        <p className="text-base-content/70">{profile.location || 'Местоположение не указано'}</p>
                                    </div>
                                    <div className="flex space-x-2 mt-4 sm:mt-0">
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
                                    <StatCard value={profile.followers} label="Подписчики" />
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