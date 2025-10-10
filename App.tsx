import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Page, Theme, Collectible, Message } from './types';
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
  const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>({});
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
        if (!session) {
            setUnreadMessages({});
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;

    const fetchInitialUnread = async () => {
        const { data: unreadData, error: unreadError } = await supabase
            .from('messages')
            .select('sender_id')
            .eq('recipient_id', session.user.id)
            .eq('is_read', false);

        if (unreadError) {
            console.error("Error fetching unread counts:", unreadError);
        } else if (unreadData) {
            const counts = unreadData.reduce((acc: Record<string, number>, msg) => {
                acc[msg.sender_id] = (acc[msg.sender_id] || 0) + 1;
                return acc;
            }, {});
            if (isMounted.current) {
                setUnreadMessages(counts);
            }
        }
    };
    
    fetchInitialUnread();

    const channel = supabase
        .channel(`messages-listener-app-${session.user.id}`)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `recipient_id=eq.${session.user.id}`
        }, (payload) => {
            const newMessage = payload.new as Message;
            // This check ensures we don't increment the count for our own messages if something is misconfigured.
            if (newMessage.sender_id !== session.user.id) {
                setUnreadMessages(prev => {
                    const newCounts = { ...prev };
                    newCounts[newMessage.sender_id] = (newCounts[newMessage.sender_id] || 0) + 1;
                    return newCounts;
                });
            }
        })
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
  }, [session]);

  const totalUnreadCount = useMemo(() => {
    return Object.values(unreadMessages).reduce((sum, count) => sum + count, 0);
  }, [unreadMessages]);

  const markMessagesAsRead = useCallback(async (senderId: string) => {
    if (!session) return;

    const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', senderId)
        .eq('recipient_id', session.user.id)
        .eq('is_read', false);

    if (error) {
        console.error("Error marking messages as read in App:", error);
    } else {
        setUnreadMessages(prev => {
            if (!prev[senderId]) return prev; // Avoid unnecessary state update
            return { ...prev, [senderId]: 0 };
        });
    }
  }, [session]);

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
        return <Messages session={session} initialUserId={initialMessageUserId} clearInitialUserId={() => setInitialMessageUserId(null)} unreadCounts={unreadMessages} markMessagesAsRead={markMessagesAsRead} />;
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
        unreadCount={totalUnreadCount}
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