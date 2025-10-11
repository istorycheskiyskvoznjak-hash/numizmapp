import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Page, Theme, Collectible, Message, Profile as ProfileData } from './types';
import Layout from './components/Layout';
import Feed from './components/pages/Feed';
import Collection from './components/pages/Collection';
import Wantlist from './components/pages/Wantlist';
import Messages from './components/pages/Messages';
import Profile from './components/pages/Profile';
import ItemDetailModal from './components/ItemDetailModal';
import ItemFormModal from './components/ItemFormModal';
import { supabase } from './supabaseClient';
import { Session } from '@supabase/supabase-js';
import Auth from './components/Auth';
import SubscriptionFeed from './components/pages/SubscriptionFeed';
import WantlistMatchesModal from './components/WantlistMatchesModal';
import GlobalSearchModal from './components/GlobalSearchModal';

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('dark');
  const [currentPage, _setCurrentPage] = useState<Page>('Collection');
  const [previousPage, setPreviousPage] = useState<Page>('Feed');
  const [selectedItem, setSelectedItem] = useState<Collectible | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [addItemModalState, setAddItemModalState] = useState<{ isOpen: boolean; initialAlbumId?: string | null }>({ isOpen: false });
  const [editingItem, setEditingItem] = useState<Collectible | null>(null);
  const [dataVersion, setDataVersion] = useState(0);
  const [initialMessageUserId, setInitialMessageUserId] = useState<string | null>(null);
  const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>({});
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const [initialAlbumId, setInitialAlbumId] = useState<string | null>(null);
  const [initialWantlistListId, setInitialWantlistListId] = useState<string | null>(null);
  const [checkingItem, setCheckingItem] = useState<Collectible | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const isMounted = useRef(true);

  // New navigation handler to centralize page changes and state cleanup
  const setCurrentPage = (page: Page) => {
    _setCurrentPage(oldPage => {
        if (oldPage !== page && oldPage !== 'PublicProfile' && oldPage !== 'Profile') {
            setPreviousPage(oldPage);
        }
        return page;
    });

    if (page !== 'PublicProfile') {
      setViewingProfileId(null);
      if (window.location.search.includes('profileId')) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
    // When navigating away from a specific collection album view, clear it
    if (page !== 'Collection') {
      setInitialAlbumId(null);
    }
    if (page !== 'Wantlist' && page !== 'PublicWantlist') {
      setInitialWantlistListId(null);
    }
  };


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

  // Global search shortcut
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        setIsSearchOpen(o => !o);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


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

  // Handles deep linking from URLs with profileId or albumId
  useEffect(() => {
    const handleUrlParams = async () => {
      if (!session) return; // Wait for session to be available

      const params = new URLSearchParams(window.location.search);
      const profileHandle = params.get('profileId');
      const albumIdFromUrl = params.get('albumId');

      if (profileHandle) {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('handle', profileHandle)
          .single();
        
        if (error) {
          console.error("Error fetching public profile ID:", error);
        } else if (isMounted.current && data) {
          if (data.id === session.user.id) {
            setCurrentPage('Profile');
          } else {
            setViewingProfileId(data.id);
            _setCurrentPage('PublicProfile'); // Use direct setter to avoid cleanup
          }
          // Clear URL param after navigation
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } else if (albumIdFromUrl) {
         if (isMounted.current) {
            setInitialAlbumId(albumIdFromUrl);
            setCurrentPage('Collection');
            // Clear URL param after navigation
            window.history.replaceState({}, document.title, window.location.pathname);
         }
      }
    };
    handleUrlParams();
  }, [session]);


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
                setUnreadMessages((prev: Record<string, number>) => {
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
            if (!prev[senderId]) return prev;
            return { ...prev, [senderId]: 0 };
        });
    }
  }, [session]);


  const refreshData = () => {
    setDataVersion(v => v + 1);
  };

  const handleOpenAddItemModal = (initialAlbumId?: string | null) => {
    setAddItemModalState({ isOpen: true, initialAlbumId });
  };

  const handleCloseItemFormModal = () => {
    setAddItemModalState({ isOpen: false });
    setEditingItem(null);
  };

  const handleItemFormSuccess = () => {
    handleCloseItemFormModal();
    setCurrentPage('Collection');
    refreshData();
  };
  
  const handleItemDeleted = () => {
    setSelectedItem(null);
    refreshData();
  }

  const handleEditItemRequest = (item: Collectible) => {
    setSelectedItem(null); // Close detail view
    setEditingItem(item);   // Open form in edit mode
  };

  const handleStartConversation = (userId: string) => {
    setInitialMessageUserId(userId);
    setCurrentPage('Messages');
    setSelectedItem(null);
    setCheckingItem(null);
  };

  const handleViewProfile = (profile: ProfileData) => {
    if (!session) return;
    if (profile.id === session.user.id) {
        setCurrentPage('Profile');
    } else {
        setViewingProfileId(profile.id);
        _setCurrentPage(oldPage => {
            if (oldPage !== 'PublicProfile' && oldPage !== 'Profile') {
                setPreviousPage(oldPage);
            }
            return 'PublicProfile';
        });
    }
    setSelectedItem(null);
    setIsSearchOpen(false);
  };


  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };
  
  const handleItemClick = (item: Collectible) => {
    setSelectedItem(item);
    setIsSearchOpen(false);
  };
  
  const handleViewAlbum = (albumId: string) => {
    setInitialAlbumId(albumId);
    setCurrentPage('Collection');
    setIsSearchOpen(false);
  };

  const handleViewCollection = () => {
    setInitialAlbumId(null);
    setCurrentPage('Collection');
  };
  
  const handleViewWantlist = (listId?: string) => {
      if (listId) {
        setInitialWantlistListId(listId);
      } else {
        setInitialWantlistListId(null);
      }
      
      if (viewingProfileId) {
        _setCurrentPage('PublicWantlist');
      } else {
        setCurrentPage('Wantlist');
      }
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
      .select('handle, avatar_url')
      .eq('id', itemData.owner_id)
      .single();
    
    if (profileError) {
        console.warn(`Could not fetch profile for owner ${itemData.owner_id}:`, profileError.message);
    }
    
    const fullItem: Collectible = {
      ...itemData,
      profiles: profileData ? { handle: profileData.handle, avatar_url: profileData.avatar_url } : null,
    };

    setSelectedItem(fullItem);
    setIsSearchOpen(false);
  };

  const renderPage = () => {
    if (!session) return null;
    switch (currentPage) {
      case 'Feed':
        return <Feed onItemClick={handleItemClick} onCheckWantlist={setCheckingItem} dataVersion={dataVersion} session={session} setCurrentPage={setCurrentPage} />;
      case 'SubscriptionFeed':
        return <SubscriptionFeed 
            session={session} 
            onItemClick={handleItemClick}
            onViewProfile={handleViewProfile}
            onNavigateToFeed={() => setCurrentPage('Feed')}
          />;
      case 'Collection':
        return <Collection onItemClick={handleItemClick} dataVersion={dataVersion} refreshData={refreshData} openAddItemModal={handleOpenAddItemModal} onStartConversation={handleStartConversation} initialAlbumId={initialAlbumId} clearInitialAlbumId={() => setInitialAlbumId(null)}/>;
      case 'Wantlist':
        return <Wantlist 
            session={session}
            initialListId={initialWantlistListId}
            clearInitialListId={() => setInitialWantlistListId(null)}
          />;
      case 'Messages':
        return <Messages 
            session={session} 
            initialUserId={initialMessageUserId} 
            clearInitialUserId={() => setInitialMessageUserId(null)} 
            unreadCounts={unreadMessages} 
            markMessagesAsRead={markMessagesAsRead} 
            onItemClick={handleItemClickById} 
            onViewProfile={handleViewProfile} />;
      case 'Profile':
        return <Profile 
            session={session} 
            onItemClick={handleItemClick} 
            onViewAlbum={handleViewAlbum} 
            onViewCollection={handleViewCollection}
            onViewWantlist={handleViewWantlist}
        />;
      case 'PublicProfile':
        if (!viewingProfileId) {
            setCurrentPage('Feed'); // Fallback
            return null;
        }
        return <Profile
            session={session}
            profileId={viewingProfileId}
            onItemClick={handleItemClick}
            onViewAlbum={handleViewAlbum}
            onViewCollection={handleViewCollection}
            onViewWantlist={handleViewWantlist}
            onStartConversation={handleStartConversation}
            onBack={() => setCurrentPage(previousPage)} // Use the stored previous page
        />;
      case 'PublicWantlist':
        if (!viewingProfileId) {
            setCurrentPage('Feed'); // Fallback
            return null;
        }
        return <Wantlist
            session={session}
            profileId={viewingProfileId}
            initialListId={initialWantlistListId}
            clearInitialListId={() => setInitialWantlistListId(null)}
            onBack={() => _setCurrentPage('PublicProfile')}
            onStartConversation={handleStartConversation}
        />;
      default:
        return <Profile 
            session={session} 
            onItemClick={handleItemClick} 
            onViewAlbum={handleViewAlbum} 
            onViewCollection={handleViewCollection}
            onViewWantlist={handleViewWantlist}
        />;
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
        onSearchOpen={() => setIsSearchOpen(true)}
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
          onEditItem={handleEditItemRequest}
        />
      )}
      {(addItemModalState.isOpen || editingItem) && (
        <ItemFormModal
          onClose={handleCloseItemFormModal}
          onSuccess={handleItemFormSuccess}
          initialAlbumId={addItemModalState.initialAlbumId}
          itemToEdit={editingItem}
        />
      )}
      {checkingItem && (
        <WantlistMatchesModal
            item={checkingItem}
            onClose={() => setCheckingItem(null)}
            onStartConversation={handleStartConversation}
        />
      )}
      {isSearchOpen && (
        <GlobalSearchModal
          onClose={() => setIsSearchOpen(false)}
          onViewProfile={handleViewProfile}
          onViewItem={handleItemClickById}
          onViewAlbum={handleViewAlbum}
        />
      )}
    </>
  );
};

export default App;