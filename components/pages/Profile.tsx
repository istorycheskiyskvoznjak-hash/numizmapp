import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Collectible, Profile as ProfileData } from '../../types';
import ItemCard from '../ItemCard';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../../supabaseClient';
import { MOCK_WANTLIST } from '../../constants';
import EditProfileModal from '../EditProfileModal';

interface ProfileProps {
  onItemClick: (item: Collectible) => void;
  session: Session;
}

const StatCard: React.FC<{ value: number; label: string }> = ({ value, label }) => (
    <div className="bg-base-200 p-6 rounded-xl text-center">
        <p className="text-3xl font-bold">{value}</p>
        <p className="text-sm text-base-content/70">{label}</p>
    </div>
);

const Profile: React.FC<ProfileProps> = ({ onItemClick, session }) => {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [collection, setCollection] = useState<Collectible[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    const fetchProfileData = useCallback(async () => {
        // Don't set loading to true here to avoid flicker on refresh
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

        const { data: collectionData, error: collectionError } = await supabase
            .from('collectibles')
            .select('*')
            .eq('owner_id', session.user.id);
        
        if (isMounted.current) {
            if (profileError) {
                console.error('Error fetching profile:', profileError.message);
            } else {
                setProfile(profileData);
            }

            if (collectionError) {
                console.error('Error fetching collection:', collectionError.message);
            } else {
                const itemsWithProfile = (collectionData || []).map(item => ({
                    ...item,
                    profiles: profileData ? { handle: profileData.handle } : null
                }));
                setCollection(itemsWithProfile as Collectible[]);
            }
            
            setLoading(false);
        }
    }, [session.user.id]);

    useEffect(() => {
        setLoading(true);
        fetchProfileData();
    }, [fetchProfileData]);
    
    const handleProfileUpdateSuccess = () => {
        setIsEditModalOpen(false);
        fetchProfileData(); // Re-fetch data to show updated profile
    }

    if (loading) {
        return <div>Загрузка профиля...</div>;
    }

    if (!profile) {
        return <div>Не удалось загрузить профиль.</div>
    }
    
    const showcaseItems = collection.slice(0, 4);

    return (
        <>
            <div className="space-y-12">
                <div className="bg-base-200 p-8 rounded-2xl">
                    <div className="flex flex-col sm:flex-row items-start space-x-6">
                        <img src={profile.avatar_url} alt={profile.name} className="w-24 h-24 rounded-lg object-cover mb-4 sm:mb-0" />
                        <div className="flex-grow">
                            <h1 className="text-3xl font-bold">{profile.name} <span className="text-base-content/60">@{profile.handle}</span></h1>
                            <p className="text-base-content/70">{profile.location}</p>
                        </div>
                        <div className="flex space-x-2 mt-4 sm:mt-0">
                            <button onClick={() => setIsEditModalOpen(true)} className="bg-base-300 hover:bg-secondary font-semibold py-2 px-4 rounded-full text-sm transition-colors">Редактировать</button>
                            <button className="bg-base-300 hover:bg-secondary font-semibold py-2 px-4 rounded-full text-sm transition-colors">QR-код</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                        <StatCard value={collection.length} label="Предметы" />
                        <StatCard value={MOCK_WANTLIST.length} label="В вишлисте" />
                        <StatCard value={profile.followers} label="Подписчики" />
                    </div>
                </div>
                
                <div>
                    <h2 className="text-2xl font-bold mb-6">Витрина</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {showcaseItems.map(item => (
                            <ItemCard key={item.id} item={item} onItemClick={onItemClick} />
                        ))}
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
        </>
    );
};

export default Profile;