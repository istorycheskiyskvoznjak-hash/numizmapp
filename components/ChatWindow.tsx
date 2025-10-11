

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import { Message, Profile as ProfileData, Collectible } from '../types';
import SendIcon from './icons/SendIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import CollectionItemPicker from './CollectionItemPicker';
import AttachedItemCard from './AttachedItemCard';
import AttachCollectibleIcon from './icons/AttachCollectibleIcon';

interface ChatWindowProps {
  session: Session;
  recipient: ProfileData;
  onBack: () => void;
  onItemClick: (itemId: string) => void;
  onViewProfile: (profile: ProfileData) => void;
}

const ATTACHMENT_SEPARATOR = '$$ATTACHMENT::';

const ChatWindow: React.FC<ChatWindowProps> = ({ session, recipient, onBack, onItemClick, onViewProfile }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [showItemPicker, setShowItemPicker] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView();
    };

    const fetchMessages = useCallback(async () => {
        setLoading(true);
        setError(null);
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${session.user.id},recipient_id.eq.${recipient.id}),and(sender_id.eq.${recipient.id},recipient_id.eq.${session.user.id})`)
            .order('created_at', { ascending: true });
        
        if (isMounted.current) {
            if (error) {
                console.error("Error fetching messages:", error.message);
                setError("Не удалось загрузить сообщения.");
            } else {
                setMessages((data as Message[]).filter(m => !m.content.startsWith('[system')));
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
                if ((newMessagePayload.sender_id === recipient.id && newMessagePayload.recipient_id === session.user.id) && !newMessagePayload.content.startsWith('[system')) {
                    setMessages(currentMessages => [...currentMessages, newMessagePayload]);
                }
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
                setMessages(currentMessages => [...currentMessages, newMsg]);
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
                <button onClick={onBack} className="md:hidden mr-2 p-2 rounded-full hover:bg-base-300">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <button onClick={() => onViewProfile(recipient)} className="flex items-center gap-3">
                    <img src={recipient.avatar_url} alt={recipient.name || ''} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                        <h3 className="font-bold">{recipient.name}</h3>
                        <p className="text-sm text-base-content/70">@{recipient.handle}</p>
                    </div>
                </button>
            </div>
            {/* Messages */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {loading ? <p>Загрузка...</p> : error ? <p className="text-red-500">{error}</p> : (
                    messages.map(msg => {
                        const isMe = msg.sender_id === session.user.id;
                        const { text, item } = parseMessage(msg.content);
                        return (
                             <div key={msg.id} className={`flex items-end ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-xs lg:max-w-md p-3 rounded-2xl ${isMe ? 'bg-primary text-black rounded-br-lg' : 'bg-base-300 rounded-bl-lg'}`}>
                                    {item && <AttachedItemCard item={item} onItemClick={onItemClick} />}
                                    {text && <p className={`whitespace-pre-wrap break-words ${item ? 'mt-1' : ''}`}>{text}</p>}
                                    <p className={`text-xs mt-1 ${isMe ? 'text-black/60' : 'text-base-content/60'} text-right`}>
                                        {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="flex-shrink-0 p-4 border-t border-base-300 bg-base-200 relative">
                {showItemPicker && <CollectionItemPicker session={session} onClose={() => setShowItemPicker(false)} onSelectItem={handleSelectItem} />}
                <form onSubmit={handleFormSubmit} className="flex items-center gap-3">
                    <button type="button" onClick={() => setShowItemPicker(p => !p)} className="p-2 rounded-full hover:bg-base-300 transition-colors" aria-label="Прикрепить предмет">
                        <AttachCollectibleIcon className="w-6 h-6 text-base-content/80"/>
                    </button>
                    <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Напишите сообщение..."
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
                    <button type="submit" disabled={sending || (!newMessage.trim())} className="p-3 rounded-full bg-primary hover:scale-110 transition-transform disabled:opacity-50 disabled:scale-100">
                        <SendIcon className="w-5 h-5 text-black"/>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatWindow;