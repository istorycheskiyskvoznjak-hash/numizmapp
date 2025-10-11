import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Page, Theme, Collectible, Message, Notification } from './types';
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
  const [currentPage, setCurrentPage] = useState<Page>('Collection');
  const [selectedItem, setSelectedItem] = useState<Collectible | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [addItemModalState, setAddItemModalState] = useState<{ isOpen: boolean; initialAlbumId?: string | null }>({ isOpen: false });
  const [dataVersion, setDataVersion] = useState(0);
  const [initialMessageUserId, setInitialMessageUserId] = useState<string | null>(null);
  const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
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
            setNotifications([]);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Message listener
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

  // Notification listener
  useEffect(() => {
    if (!session) return;

    const fetchNotifications = async () => {
        const { data, error } = await supabase
            .from('notifications')
            .select(`
                *,
                profiles:sender_id (name, handle, avatar_url),
                collectibles:collectible_id (name, image_url)
            `)
            .eq('recipient_id', session.user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching notifications:", error.message);
        } else if (isMounted.current) {
            setNotifications(data as Notification[]);
        }
    };

    fetchNotifications();
    
    const channel = supabase
        .channel(`notifications-listener-${session.user.id}`)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `recipient_id=eq.${session.user.id}`
        }, async (payload) => {
            const newNotification = payload.new as Notification;
            
            // Fetch sender and collectible info for the new notification
            const [profileRes, collectibleRes] = await Promise.all([
                supabase.from('profiles').select('name, handle, avatar_url').eq('id', newNotification.sender_id).single(),
                supabase.from('collectibles').select('name, image_url').eq('id', newNotification.collectible_id).single()
            ]);
            
            const fullNotification = {
                ...newNotification,
                profiles: profileRes.data,
                collectibles: collectibleRes.data
            };
            
            setNotifications(prev => [fullNotification, ...prev]);
        })
        .subscribe();
        
    return () => {
        supabase.removeChannel(channel);
    };

  }, [session]);

  const totalUnreadCount = useMemo(() => {
    return Object.values(unreadMessages).reduce((sum, count) => sum + count, 0);
  }, [unreadMessages]);
  
  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter(n => !n.is_read).length;
  }, [notifications]);

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
            if (!prev[senderId]) return prev;
            return { ...prev, [senderId]: 0 };
        });
    }
  }, [session]);

  const markNotificationsAsRead = useCallback(async () => {
    if (!session || unreadNotificationsCount === 0) return;

    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);

    // Optimistically update UI
    setNotifications(prev => prev.map(n => n.is_read ? n : { ...n, is_read: true }));

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', unreadIds);

    if (error) {
        console.error("Error marking notifications as read:", error);
        // Revert UI update on error
        setNotifications(prev => prev.map(n => unreadIds.includes(n.id) ? { ...n, is_read: false } : n));
    }
  }, [session, notifications, unreadNotificationsCount]);


  const refreshData = () => {
    setDataVersion(v => v + 1);
  };

  const handleOpenAddItemModal = (initialAlbumId?: string | null) => {
    setAddItemModalState({ isOpen: true, initialAlbumId });
  };

  const handleCloseAddItemModal = () => {
    setAddItemModalState({ isOpen: false });
  };

  const handleItemAdded = () => {
    handleCloseAddItemModal();
    setCurrentPage('Collection');
    refreshData();
  };
  
  const handleItemDeleted = () => {
    setSelectedItem(null);
    refreshData();
  }

  const handleStartConversation = (userId: string) => {
    setInitialMessageUserId(userId);
    setCurrentPage('Messages');
    setSelectedItem(null);
  };

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };
  
  const handleItemClick = (item: Collectible) => {
    setSelectedItem(item);
  };

  const handleItemClickById = async (itemId: string) => {
    if (!itemId) return;
    
    const { data: itemData, error: itemError } = await supabase
      .from('collectibles')
      .select('*')
      .eq('id', itemId)
      .single();
      
    if (itemError) {
      console.error("Error fetching item by ID:", itemError.message);
      return;
    }

    if (!itemData) {
        console.warn(`Item with ID ${itemId} not found.`);
        return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('handle')
      .eq('id', itemData.owner_id)
      .single();
    
    if (profileError) {
        console.warn(`Could not fetch profile for owner ${itemData.owner_id}:`, profileError.message);
    }
    
    const fullItem: Collectible = {
      ...itemData,
      profiles: profileData ? { handle: profileData.handle } : null,
    };

    setSelectedItem(fullItem);
  };

  const renderPage = () => {
    if (!session) return null;
    switch (currentPage) {
      case 'Feed':
        return <Feed onItemClick={handleItemClick} dataVersion={dataVersion} />;
      case 'Collection':
        return <Collection onItemClick={handleItemClick} dataVersion={dataVersion} refreshData={refreshData} openAddItemModal={handleOpenAddItemModal}/>;
      case 'Wantlist':
        return <Wantlist />;
      case 'Messages':
        return <Messages session={session} initialUserId={initialMessageUserId} clearInitialUserId={() => setInitialMessageUserId(null)} unreadCounts={unreadMessages} markMessagesAsRead={markMessagesAsRead} onItemClick={handleItemClickById} />;
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
        unreadMessageCount={totalUnreadCount}
        notifications={notifications}
        unreadNotificationsCount={unreadNotificationsCount}
        markNotificationsAsRead={markNotificationsAsRead}
        onNotificationClick={handleItemClickById}
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
          onItemUpdate={refreshData}
        />
      )}
      {addItemModalState.isOpen && (
        <AddItemModal 
          onClose={handleCloseAddItemModal}
          onSuccess={handleItemAdded}
          initialAlbumId={addItemModalState.initialAlbumId}
        />
      )}
    </>
  );
};

export default App;