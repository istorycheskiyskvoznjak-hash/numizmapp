import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Profile, Message, Collectible } from '../types';
import { Session } from '@supabase/supabase-js';
import SendIcon from './icons/SendIcon';
import TrashIcon from './icons/TrashIcon';
import PaperclipIcon from './icons/PaperclipIcon';
import CollectionItemPicker from './CollectionItemPicker';
import AttachedItemCard from './AttachedItemCard';

interface ChatWindowProps {
    session: Session;
    otherUser: Profile;
    onChatDeleted: () => void;
    onItemClick: (itemId: string) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ session, otherUser, onChatDeleted, onItemClick }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [isPickerOpen, setIsPickerOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const currentUser = session.user;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchMessages = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${currentUser.id},recipient_id.eq.${otherUser.id}),and(sender_id.eq.${otherUser.id},recipient_id.eq.${currentUser.id})`)
            .order('created_at', { ascending: true });

        if (error) {
            console.error("Error fetching messages:", error);
        } else {
            setMessages(data as Message[]);
        }
        setLoading(false);
    }, [currentUser.id, otherUser.id]);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const channel = supabase.channel(`messages:${currentUser.id}:${otherUser.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `recipient_id=eq.${currentUser.id}`,
                },
                (payload) => {
                    const newMessagePayload = payload.new as Message;
                    if (newMessagePayload.sender_id === otherUser.id) {
                         setMessages(currentMessages => [...currentMessages, newMessagePayload]);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser.id, otherUser.id]);


    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const messageToSend: Omit<Message, 'id' | 'created_at' | 'is_read'> = {
            sender_id: currentUser.id,
            recipient_id: otherUser.id,
            content: newMessage.trim(),
        };

        const { data, error } = await supabase
            .from('messages')
            .insert(messageToSend)
            .select();

        if (error) {
            console.error("Error sending message:", error);
        } else if (data) {
            setMessages(currentMessages => [...currentMessages, data[0] as Message]);
            setNewMessage('');
        }
    };

    const handleDeleteChat = async () => {
        const confirmed = window.confirm(`Вы уверены, что хотите удалить весь чат с ${otherUser.name}? Это действие необратимо.`);
        if (!confirmed) return;

        try {
            const { error } = await supabase
                .from('messages')
                .delete()
                .or(`and(sender_id.eq.${currentUser.id},recipient_id.eq.${otherUser.id}),and(sender_id.eq.${otherUser.id},recipient_id.eq.${currentUser.id})`);
            
            if (error) throw error;
            onChatDeleted();
        } catch (err: any) {
            console.error("Error deleting chat:", err);
            alert("Не удалось удалить чат.");
        }
    };

    const handleSelectItem = async (item: Pick<Collectible, 'id' | 'name' | 'image_url'>) => {
        const content = `[collectible]${JSON.stringify(item)}`;
        setIsPickerOpen(false);

        const messageToSend = {
            sender_id: currentUser.id,
            recipient_id: otherUser.id,
            content: content,
        };

        const { data, error } = await supabase
            .from('messages')
            .insert(messageToSend)
            .select();

        if (error) {
            console.error("Error sending item message:", error);
        } else if (data) {
            setMessages(currentMessages => [...currentMessages, data[0] as Message]);
        }
    };

    const renderMessageContent = (msg: Message) => {
        if (msg.content.startsWith('[collectible]')) {
            try {
                const itemData = JSON.parse(msg.content.substring('[collectible]'.length));
                return <AttachedItemCard item={itemData} onItemClick={onItemClick} />;
            } catch (e) {
                console.error("Failed to parse collectible message", e);
                return <p className="text-sm break-words italic text-base-content/50">[Не удалось отобразить предмет]</p>;
            }
        }
        return <p className="text-sm break-words">{msg.content}</p>;
    };
    
    return (
        <>
            {/* Header */}
            <div className="p-4 border-b-2 border-base-300 flex items-center justify-between flex-shrink-0 bg-base-200 h-24">
                <div className="flex items-center space-x-3 min-w-0">
                    <img src={otherUser.avatar_url} alt={otherUser.name} className="w-10 h-10 rounded-full object-cover" />
                    <div className="min-w-0">
                        <p className="font-bold truncate">{otherUser.name}</p>
                        <p className="text-xs text-base-content/60 truncate">@{otherUser.handle}</p>
                    </div>
                </div>
                <button onClick={handleDeleteChat} className="p-2 rounded-full hover:bg-red-500/20 text-red-500 transition-colors flex-shrink-0" aria-label="Удалить чат">
                    <TrashIcon className="w-5 h-5"/>
                </button>
            </div>
            
            {/* Messages Area */}
            <div className="flex-grow p-4 overflow-y-auto bg-base-100">
                {loading ? (
                    <p className="text-center text-sm">Загрузка сообщений...</p>
                ) : (
                    <div className="space-y-4">
                        {messages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-2xl ${msg.sender_id === currentUser.id ? 'bg-primary text-black rounded-br-lg' : 'bg-base-300 rounded-bl-lg'}`}>
                                    {renderMessageContent(msg)}
                                    <p className={`text-xs mt-1 opacity-60 ${msg.sender_id === currentUser.id ? 'text-right' : 'text-left'}`}>
                                        {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                         <div ref={messagesEndRef} />
                    </div>
                )}
            </div>
            
            {/* Input Area */}
            <div className="p-4 border-t-2 border-base-300 flex-shrink-0 bg-base-200 relative">
                {isPickerOpen && (
                    <CollectionItemPicker
                        session={session}
                        onClose={() => setIsPickerOpen(false)}
                        onSelectItem={handleSelectItem}
                    />
                )}
                <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                    <button type="button" onClick={() => setIsPickerOpen(prev => !prev)} className="p-3 rounded-full hover:bg-secondary transition-colors flex-shrink-0" aria-label="Прикрепить предмет">
                        <PaperclipIcon className="w-5 h-5"/>
                    </button>
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Напишите сообщение..."
                        className="w-full px-4 py-2 bg-base-100 border border-base-300 rounded-full text-sm shadow-sm placeholder-base-content/50 focus:outline-none focus:border-primary"
                    />
                    <button type="submit" disabled={!newMessage.trim()} className="p-3 rounded-full bg-primary text-black disabled:opacity-50 hover:scale-110 transition-transform flex-shrink-0">
                        <SendIcon className="w-5 h-5"/>
                    </button>
                </form>
            </div>
        </>
    );
};

export default ChatWindow;