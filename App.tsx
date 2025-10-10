import React, { useState, useEffect, useRef } from 'react';
import { Page, Theme, Collectible } from './types';
import Layout from './components/Layout';
import Feed from './components/pages/Feed';
import Collection from './components/pages/Collection';
import Wantlist from './components/pages/Wantlist';
import Messages from './components/pages/Messages';
import Profile from './components/pages/Profile';
import ItemDetailModal from './components/ItemDetailModal';
import AddItemModal from './components/AddItemModal';
import { supabase } from './supabaseClient';
import { Session } from '@supabase/supabase-js';
import Auth from './components/Auth';

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('dark');
  const [currentPage, setCurrentPage] = useState<Page>('Profile');
  const [selectedItem, setSelectedItem] = useState<Collectible | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);
  const [initialMessageUserId, setInitialMessageUserId] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === 'light' ? 'dark' : 'light');
    root.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted.current) {
        setSession(session);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted.current) {
        setSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshData = () => {
    setDataVersion(v => v + 1);
  };

  const handleItemAdded = () => {
    setIsAddItemModalOpen(false);
    setCurrentPage('Collection');
    refreshData(); // Trigger data refresh
  };
  
  const handleItemDeleted = () => {
    setSelectedItem(null);
    refreshData();
  }

  const handleStartConversation = (userId: string) => {
    setInitialMessageUserId(userId);
    setCurrentPage('Messages');
    setSelectedItem(null); // Close modal if open
  };

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };
  
  const handleItemClick = (item: Collectible) => {
    setSelectedItem(item);
  };

  const renderPage = () => {
    if (!session) return null;
    switch (currentPage) {
      case 'Feed':
        return <Feed onItemClick={handleItemClick} dataVersion={dataVersion} />;
      case 'Collection':
        return <Collection onItemClick={handleItemClick} dataVersion={dataVersion} refreshData={refreshData} />;
      case 'Wantlist':
        return <Wantlist />;
      case 'Messages':
        return <Messages session={session} initialUserId={initialMessageUserId} clearInitialUserId={() => setInitialMessageUserId(null)} />;
      case 'Profile':
        return <Profile session={session} onItemClick={handleItemClick}/>;
      default:
        return <Profile session={session} onItemClick={handleItemClick}/>;
    }
  };

  if (!session) {
    return (
        <div className={`min-h-screen bg-base-100 text-base-content font-sans ${theme}`}>
            <Auth />
        </div>
    );
  }

  return (
    <>
      <Layout 
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        theme={theme}
        toggleTheme={toggleTheme}
        onAddItemClick={() => setIsAddItemModalOpen(true)}
      >
        {renderPage()}
      </Layout>
      {selectedItem && (
        <ItemDetailModal 
          item={selectedItem}
          session={session}
          onClose={() => setSelectedItem(null)} 
          onDeleteSuccess={handleItemDeleted}
          onStartConversation={handleStartConversation}
        />
      )}
      {isAddItemModalOpen && (
        <AddItemModal 
          onClose={() => setIsAddItemModalOpen(false)}
          onSuccess={handleItemAdded}
        />
      )}
    </>
  );
};

export default App;