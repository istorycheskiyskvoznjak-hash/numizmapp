import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import { Message, Profile as ProfileData, Collectible } from '../types';
import SendIcon from './icons/SendIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import CollectionItemPicker from './CollectionItemPicker';
import AttachedItemCard from './AttachedItemCard';
import PaperclipIcon from './icons/PaperclipIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';

interface ChatWindowProps {
  session: Session;
  recipient: ProfileData;
  onBack: () => void;
  onItemClick: (itemId: string) => void;
  onViewProfile: (profile: ProfileData) => void;
}

const ATTACHMENT_SEPARATOR = '$$ATTACHMENT::';

const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
};

const formatDateSeparator = (date: Date) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (isSameDay(date, today)) {
        return 'Сегодня';
    }
    if (isSameDay(date, yesterday)) {
        return 'Вчера';
    }
    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
};

const ChatWindow: React.FC<ChatWindowProps> = ({ session, recipient, onBack, onItemClick, onViewProfile }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [showItemPicker, setShowItemPicker] = useState(false);
    const [showScrollButton, setShowScrollButton] = useState(false);

    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    const scrollToBottom = (behavior: 'smooth' | 'auto' = 'auto') => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    const handleScroll = () => {
        const container = messagesContainerRef.current;
        if (container) {
            const isScrolledToBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
            setShowScrollButton(!isScrolledToBottom);
        }
    };

    const fetchMessages = useCallback(async () => {
        setLoading(true);
        setError(null);
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .is('hidden_at', null) // <-- Only fetch visible messages
            .or(`and(sender_id.eq.${session.user.id},recipient_id.eq.${recipient.id}),and(sender_id.eq.${recipient.id},recipient_id.eq.${session.user.id})`)
            .order('created_at', { ascending: true });
        
        if (isMounted.current) {
            if (error) {
                console.error("Error fetching messages:", error.message);
                setError("Не удалось загрузить сообщения.");
            } else {
                // Filter out legacy delete messages, but keep new history cleared messages
                const cleanMessages = data.filter(m => !m.content.startsWith('[system:deleted_by_'));
                setMessages(cleanMessages as Message[]);
            }
            setLoading(false);
        }
    }, [session.user.id, recipient.id]);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    useEffect(() => {
        const channel = supabase
            .channel(`messages-listener-chat-${session.user.id}-${recipient.id}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
            }, (payload) => {
                const newMessagePayload = payload.new as Message;
                
                const isMyMessage = newMessagePayload.sender_id === session.user.id && newMessagePayload.recipient_id === recipient.id;
                const isTheirMessage = newMessagePayload.sender_id === recipient.id && newMessagePayload.recipient_id === session.user.id;
                if (!isMyMessage && !isTheirMessage) return;

                if (newMessagePayload.content.startsWith('[system:history_cleared_by_handle:')) {
                    fetchMessages();
                    return;
                }
                if (newMessagePayload.content.startsWith('[system:deleted_by_')) {
                    return;
                }
                
                setMessages(currentMessages => [...currentMessages, newMessagePayload]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [session.user.id, recipient.id, fetchMessages]);

    const handleSendMessage = async (attachedItem?: Pick<Collectible, 'id' | 'name' | 'image_url'>) => {
        const content = newMessage.trim();
        if (!content && !attachedItem) return;

        setSending(true);

        let messageContent = content;
        if (attachedItem) {
            messageContent += `${ATTACHMENT_SEPARATOR}${JSON.stringify(attachedItem)}`;
        }

        const messageData = {
            sender_id: session.user.id,
            recipient_id: recipient.id,
            content: messageContent,
            is_read: false,
        };

        const { data: newMsg, error } = await supabase
            .from('messages')
            .insert(messageData)
            .select()
            .single();

        if (isMounted.current) {
            if (error) {
                console.error("Error sending message:", error);
                alert("Не удалось отправить сообщение.");
            } else if (newMsg) {
                setNewMessage('');
            }
            setSending(false);
        }
    };
    
    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSendMessage();
    };
    
    const handleSelectItem = (item: Pick<Collectible, 'id' | 'name' | 'image_url'>) => {
        handleSendMessage(item);
        setShowItemPicker(false);
    };

    const parseMessage = (content: string): { text: string; item: any | null } => {
        const parts = content.split(ATTACHMENT_SEPARATOR);
        if (parts.length > 1 && parts[1]) {
            try {
                return { text: parts[0], item: JSON.parse(parts[1]) };
            } catch (e) {
                console.error("Failed to parse attached item:", e);
                return { text: parts[0], item: null };
            }
        }
        return { text: content, item: null };
    };

    return (
        <div className="flex flex-col h-full bg-base-200">
            {/* Header */}
            <div className="flex-shrink-0 flex items-center p-4 border-b border-base-300 bg-base-200">
                <button onClick={onBack} className="md:hidden mr-2 p-2 rounded-full hover:bg-base-300 outline-none focus-visible:ring-2 focus-visible:ring-primary">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <button onClick={() => onViewProfile(recipient)} className="flex items-center gap-3 p-1 rounded-full focus-visible:ring-2 focus-visible:ring-primary outline-none">
                    <img src={recipient.avatar_url} alt={recipient.name || ''} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                        <h3 className="font-bold text-left">{recipient.name}</h3>
                        <p className="text-sm text-base-content/70 text-left">@{recipient.handle}</p>
                    </div>
                </button>
            </div>
            {/* Messages */}
            <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-grow overflow-y-auto p-4 space-y-4 relative">
                {loading ? <p>Загрузка...</p> : error ? <p className="text-red-500">{error}</p> : (
                    (() => {
                        let lastDate: Date | null = null;
                        return messages.map(msg => {
                            const currentDate = new Date(msg.created_at);
                            const showDateSeparator = !lastDate || !isSameDay(lastDate, currentDate);
                            lastDate = currentDate;

                            if (msg.content.startsWith('[system:history_cleared_by_handle:')) {
                                const handle = msg.content.split(':')[2].slice(0, -1);
                                const isMe = msg.sender_id === session.user.id;
                                return (
                                    <div key={msg.id} className="text-center text-xs italic text-base-content/60 my-2">
                                        {isMe ? 'Вы очистили историю чата.' : `Пользователь @${handle} очистил историю чата.`}
                                    </div>
                                );
                            }

                            const isMe = msg.sender_id === session.user.id;
                            const { text, item } = parseMessage(msg.content);

                            return (
                                <React.Fragment key={msg.id}>
                                    {showDateSeparator && (
                                        <div className="text-center text-xs font-semibold text-base-content/60 my-4 sticky top-2 z-10">
                                           <span className="bg-base-300 px-3 py-1 rounded-full">{formatDateSeparator(currentDate)}</span>
                                        </div>
                                    )}
                                     <div className={`flex items-end ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-xs lg:max-w-md p-3 shadow-md ${isMe ? 'bg-primary text-primary-content rounded-3xl rounded-br-lg' : 'bg-base-300 rounded-2xl rounded-bl-lg'}`}>
                                            {item && <AttachedItemCard item={item} onItemClick={onItemClick} />}
                                            {text && <p className={`whitespace-pre-wrap break-words ${item ? 'mt-1' : ''}`}>{text}</p>}
                                            <p className={`text-xs mt-1 ${isMe ? 'text-primary-content/60' : 'text-base-content/60'} text-right`}>
                                                {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                </React.Fragment>
                            )
                        })
                    })()
                )}
                <div ref={messagesEndRef} />
                 {showScrollButton && (
                    <button
                        onClick={() => scrollToBottom('smooth')}
                        className="absolute bottom-4 right-4 z-10 w-10 h-10 bg-base-300 rounded-full flex items-center justify-center shadow-lg hover:bg-secondary outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                        <ChevronDownIcon className="w-6 h-6" />
                    </button>
                )}
            </div>

            {/* Input */}
            <div className="flex-shrink-0 p-4 border-t border-base-300 bg-base-200 relative">
                {showItemPicker && <CollectionItemPicker session={session} onClose={() => setShowItemPicker(false)} onSelectItem={handleSelectItem} />}
                <form onSubmit={handleFormSubmit} className="flex items-center gap-3">
                    <button type="button" onClick={() => setShowItemPicker(p => !p)} className="p-2 rounded-full hover:bg-base-300 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary" aria-label="Прикрепить предмет">
                        <PaperclipIcon className="w-6 h-6 text-base-content/80"/>
                    </button>
                    <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Предложите обмен или задайте вопрос…"
                        className="w-full px-4 py-2 bg-base-100 border border-base-300 rounded-full text-sm shadow-sm placeholder-base-content/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition resize-none"
                        rows={1}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleFormSubmit(e);
                            }
                        }}
                        disabled={sending}
                    />
                    <button type="submit" disabled={sending || !newMessage.trim()} className="p-3 rounded-full bg-primary motion-safe:hover:scale-110 transition-transform disabled:opacity-50 disabled:scale-100 outline-none focus-visible:ring-2 focus-visible:ring-primary-focus">
                        <SendIcon className="w-5 h-5 text-primary-content"/>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatWindow;