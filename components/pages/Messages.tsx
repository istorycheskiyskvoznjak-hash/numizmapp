import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../../supabaseClient';
import { Message, Profile as ProfileData } from '../../types';
import ChatWindow from '../ChatWindow';
import MessagesIcon from '../icons/MessagesIcon';
import PinIcon from '../icons/PinIcon';

interface MessagesProps {
  session: Session;
  initialUserId: string | null;
  clearInitialUserId: () => void;
  unreadCounts: Record<string, number>;
  markMessagesAsRead: (senderId: string) => void;
  onItemClick: (itemId: string) => void;
  onViewProfile: (profile: ProfileData) => void;
}

interface ChatPartner extends ProfileData {
    lastMessage: string;
    lastMessageTimestamp: string;
    lastMessageSenderId?: string;
}

const MoreOptionsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
    </svg>
);


const Messages: React.FC<MessagesProps> = ({
  session,
  initialUserId,
  clearInitialUserId,
  unreadCounts,
  markMessagesAsRead,
  onItemClick,
  onViewProfile,
}) => {
  const [partners, setPartners] = useState<ChatPartner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [pinnedChats, setPinnedChats] = useState<string[]>([]);
  const isMounted = useRef(true);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    isMounted.current = true;
    const storedPinnedChats = localStorage.getItem(`pinnedChats_${session.user.id}`);
    if (storedPinnedChats) {
        setPinnedChats(JSON.parse(storedPinnedChats));
    }
    return () => {
      isMounted.current = false;
    };
  }, [session.user.id]);

  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
              setOpenMenuId(null);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
          document.removeEventListener('mousedown', handleClickOutside);
      };
  }, []);
  
  const fetchPartners = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${session.user.id},recipient_id.eq.${session.user.id}`)
        .order('created_at', { ascending: false });

    if (!isMounted.current) return;

    if (messagesError) {
        console.error("Error fetching messages for partners:", messagesError.message);
        setError('Не удалось загрузить сообщения.');
        setLoading(false);
        return;
    }

    const partnerIds = new Set<string>();
    const latestMessages: Record<string, Message> = {};

    messages.forEach(msg => {
        const partnerId = msg.sender_id === session.user.id ? msg.recipient_id : msg.sender_id;
        if (!partnerIds.has(partnerId)) {
            partnerIds.add(partnerId);
            latestMessages[partnerId] = msg;
        }
    });

    if (partnerIds.size === 0) {
      setPartners([]);
      setLoading(false);
      return;
    }
    
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', Array.from(partnerIds));

    if (!isMounted.current) return;

    if (profilesError) {
        setError('Не удалось загрузить профили собеседников.');
        setLoading(false);
        return;
    }

    const partnerProfiles: ChatPartner[] = profiles.map(profile => {
        const lastMsg = latestMessages[profile.id];
        return {
            ...(profile as ProfileData),
            lastMessage: lastMsg.content,
            lastMessageTimestamp: lastMsg.created_at,
            lastMessageSenderId: lastMsg.sender_id,
        };
    });

    setPartners(partnerProfiles);
    
    if (initialUserId) {
        const initialPartner = partnerProfiles.find(p => p.id === initialUserId);
        if (initialPartner) {
            setSelectedPartner(initialPartner);
            markMessagesAsRead(initialUserId);
        } else {
            const { data: newPartnerProfile, error: newPartnerError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', initialUserId)
                .single();
            if (newPartnerError) {
                console.error("Could not fetch new partner profile:", newPartnerError);
            } else if (newPartnerProfile) {
                setSelectedPartner(newPartnerProfile as ProfileData);
            }
        }
        clearInitialUserId();
    }
    setLoading(false);
  }, [session.user.id, initialUserId, clearInitialUserId, markMessagesAsRead]);

  const sortedPartners = useMemo(() => {
    return [...partners].sort((a, b) => {
        const aIsPinned = pinnedChats.includes(a.id);
        const bIsPinned = pinnedChats.includes(b.id);

        if (aIsPinned && !bIsPinned) return -1;
        if (!aIsPinned && bIsPinned) return 1;

        return new Date(b.lastMessageTimestamp).getTime() - new Date(a.lastMessageTimestamp).getTime();
    });
  }, [partners, pinnedChats]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  useEffect(() => {
    const channel = supabase
        .channel(`messages-listener-partners-${session.user.id}`)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
        }, (payload) => {
            const newMessage = payload.new as Message;
            if (newMessage.recipient_id === session.user.id || newMessage.sender_id === session.user.id) {
                fetchPartners();
            }
        })
        .subscribe();
    return () => {
        supabase.removeChannel(channel);
    };
  }, [session.user.id, fetchPartners]);

  const handlePartnerSelect = (partner: ProfileData) => {
    setSelectedPartner(partner);
    markMessagesAsRead(partner.id);
  };

  const togglePinChat = (e: React.MouseEvent, partnerId: string) => {
    e.stopPropagation();
    setOpenMenuId(null);
    const newPinnedChats = pinnedChats.includes(partnerId)
        ? pinnedChats.filter(id => id !== partnerId)
        : [...pinnedChats, partnerId];
    
    setPinnedChats(newPinnedChats);
    localStorage.setItem(`pinnedChats_${session.user.id}`, JSON.stringify(newPinnedChats));
  };
  
  const parseMessageContent = (content: string) => {
      const parts = content.split('$$ATTACHMENT::');
      return { text: parts[0] };
  };

  if (loading) {
    return <div className="text-center p-8">Загрузка сообщений...</div>;
  }
  
  if (error) {
     return <div className="text-center p-8 text-red-500">{error}</div>;
  }

  return (
    <div className="flex h-[calc(100vh-120px)] bg-base-200 rounded-2xl overflow-hidden">
        <div className={`w-full md:w-1/3 border-r border-base-300 flex flex-col ${selectedPartner ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b border-base-300">
                <h2 className="text-xl font-bold">Чаты</h2>
            </div>
            <div className="flex-grow overflow-y-auto">
                {partners.length === 0 ? (
                    <div className="p-4 text-center text-base-content/70">
                        У вас пока нет чатов.
                    </div>
                ) : (
                    sortedPartners.map(partner => {
                        const isPinned = pinnedChats.includes(partner.id);
                        return (
                            <div
                                key={partner.id}
                                onClick={(e) => {
                                    if ((e.target as HTMLElement).closest('[data-options-container]')) {
                                        return;
                                    }
                                    handlePartnerSelect(partner);
                                }}
                                className={`w-full text-left p-4 flex items-center gap-4 transition-colors relative cursor-pointer ${selectedPartner?.id === partner.id ? 'bg-base-300' : 'hover:bg-base-300/50'}`}
                            >
                                <img src={partner.avatar_url || `https://i.pravatar.cc/150?u=${partner.id}`} alt={partner.name || ''} className="w-12 h-12 rounded-full object-cover"/>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <p className="font-bold truncate">{partner.name || partner.handle}</p>
                                            {isPinned && <PinIcon className="w-4 h-4 text-primary flex-shrink-0" />}
                                        </div>
                                        {unreadCounts[partner.id] > 0 && (
                                            <span className="bg-primary text-black text-xs font-bold rounded-full h-5 min-w-[1.25rem] px-1.5 flex items-center justify-center">
                                                {unreadCounts[partner.id]}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-base-content/70 truncate">
                                      {partner.lastMessageSenderId === session.user.id && 'Вы: '}
                                      {parseMessageContent(partner.lastMessage).text || 'Предмет из коллекции'}
                                    </p>
                                </div>
                                <div className="relative" data-options-container>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === partner.id ? null : partner.id); }}
                                        className="p-2 rounded-full text-base-content/70 hover:bg-base-100"
                                        aria-label="Больше опций"
                                    >
                                        <MoreOptionsIcon className="w-5 h-5" />
                                    </button>
                                    {openMenuId === partner.id && (
                                        <div ref={menuRef} className="absolute right-0 top-10 mt-1 w-48 bg-base-300 rounded-lg shadow-xl z-20 py-1">
                                            <button
                                                onClick={(e) => togglePinChat(e, partner.id)}
                                                className="w-full text-left px-4 py-2 flex items-center gap-3 text-sm text-base-content hover:bg-base-100"
                                            >
                                                <PinIcon className="w-4 h-4" />
                                                <span>{isPinned ? 'Открепить чат' : 'Закрепить чат'}</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
        <div className={`w-full md:w-2/3 flex flex-col ${!selectedPartner ? 'hidden md:flex' : 'flex'}`}>
            {selectedPartner ? (
                <ChatWindow
                    key={selectedPartner.id}
                    session={session}
                    recipient={selectedPartner}
                    onBack={() => setSelectedPartner(null)}
                    onItemClick={onItemClick}
                    onViewProfile={onViewProfile}
                />
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                    <MessagesIcon className="w-24 h-24 text-base-content/20 mb-4" />
                    <h2 className="text-2xl font-bold">Выберите чат</h2>
                    <p className="text-base-content/70 mt-2">Выберите собеседника, чтобы начать общение.</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default Messages;