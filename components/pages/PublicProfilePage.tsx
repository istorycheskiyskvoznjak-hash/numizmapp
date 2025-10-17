

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { Profile as ProfileData, Theme, Collectible } from '../../types';
import Profile from './Profile';
import PublicHeader from '../PublicHeader';
import LoginPromptModal from '../LoginPromptModal';
import ItemDetailModal from '../ItemDetailModal';

interface PublicProfilePageProps {
  profileHandle: string;
  theme: Theme;
  toggleTheme: () => void;
}

const PublicProfilePage: React.FC<PublicProfilePageProps> = ({ profileHandle, theme, toggleTheme }) => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Collectible | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('handle', profileHandle)
        .single();

      if (!isMounted.current) return;

      if (fetchError) {
        console.error("Error fetching public profile:", fetchError);
        setError("Профиль не найден или произошла ошибка.");
      } else {
        setProfile(data as ProfileData);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [profileHandle]);

  const handleActionAttempt = () => {
    setIsLoginPromptOpen(true);
  };
  
  const handleItemClick = (item: Collectible) => {
    setSelectedItem(item);
  };

  const handleCloseItemDetail = () => {
    setSelectedItem(null);
  };

  const handleLoginRedirect = () => {
    window.location.href = window.location.pathname;
  };

  const renderContent = () => {
    if (loading) {
      return <div className="text-center p-8">Загрузка профиля...</div>;
    }
    if (error) {
      return <div className="text-center p-8 text-red-500">{error}</div>;
    }
    if (profile) {
      return (
        <Profile
          session={null}
          profileId={profile.id}
          onItemClick={handleItemClick}
          onViewAlbum={handleActionAttempt}
          onViewCollection={handleActionAttempt}
          onViewWantlist={handleActionAttempt}
          onParameterSearch={handleActionAttempt}
          onStartConversation={handleActionAttempt}
        />
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-base-100 text-base-content font-sans">
      <PublicHeader theme={theme} toggleTheme={toggleTheme} onLoginClick={handleLoginRedirect} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-24">
        {renderContent()}
      </main>
      {isLoginPromptOpen && (
        <LoginPromptModal
          onClose={() => setIsLoginPromptOpen(false)}
          onLogin={handleLoginRedirect}
        />
      )}
      {selectedItem && (
        <ItemDetailModal
            item={selectedItem}
            session={null}
            onClose={handleCloseItemDetail}
            onStartConversation={handleActionAttempt}
            onParameterSearch={handleActionAttempt}
            // Pass dummy functions for actions that are not available to guests
            onDeleteSuccess={() => {}}
            onItemUpdate={() => {}}
            onEditItem={() => {}}
            // FIX: Add the missing 'isAdmin' prop. Public users are not admins.
            isAdmin={false}
        />
      )}
    </div>
  );
};

export default PublicProfilePage;