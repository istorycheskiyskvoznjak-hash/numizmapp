import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { Profile } from '../../types';
import { Session } from '@supabase/supabase-js';
import ChatWindow from '../ChatWindow';
import MessagesIcon from '../icons/MessagesIcon';

interface MessagesProps {
    session: Session;
    initialUserId: string | null;
    clearInitialUserId: () => void;
    unreadCounts: Record<string, number>;
    markMessagesAsRead: (senderId: string) => Promise<void>;
}

const Messages: React.FC<MessagesProps> = ({ session, initialUserId, clearInitialUserId, unreadCounts, markMessagesAsRead }) => {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchProfiles = useCallback(async () => {
        setLoading(true);
        const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .neq('id', session.user.id);

        if (profilesError) {
            console.error("Error fetching profiles:", profilesError);
        } else {
            setProfiles(profilesData as Profile[]);
        }
        setLoading(false);
    }, [session.user.id]);

    useEffect(() => {
        fetchProfiles();
    }, [fetchProfiles]);
    
    useEffect(() => {
        if (initialUserId && profiles.length > 0) {
            const userToSelect = profiles.find(p => p.id === initialUserId);
            if (userToSelect) {
                setSelectedUser(userToSelect);
            }
            clearInitialUserId();
        }
    }, [initialUserId, profiles, clearInitialUserId]);

    // Mark messages as read when a chat is opened
    useEffect(() => {
        if (selectedUser && unreadCounts[selectedUser.id] > 0) {
            markMessagesAsRead(selectedUser.id);
        }
    }, [selectedUser, unreadCounts, markMessagesAsRead]);

    const filteredProfiles = useMemo(() => {
        if (!searchTerm) return profiles;
        return profiles.filter(profile =>
            profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            profile.handle.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [profiles, searchTerm]);

    return (
        <div className="flex h-[calc(100vh-8rem)] bg-base-200 rounded-2xl overflow-hidden border-2 border-base-300">
            {/* Left Panel: User List */}
            <div className="w-96 border-r-2 border-base-300 flex flex-col flex-shrink-0">
                <div className="p-4 border-b-2 border-base-300 h-24 flex flex-col justify-center space-y-2">
                    <h1 className="text-xl font-bold">Чаты</h1>
                    <input
                        type="text"
                        placeholder="Поиск пользователей..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 bg-base-100 border border-base-300 rounded-full text-sm shadow-sm placeholder-base-content/50 focus:outline-none focus:border-primary"
                    />
                </div>
                <div className="flex-grow overflow-y-auto">
                    {loading ? (
                        <p className="p-4 text-sm text-base-content/60">Загрузка пользователей...</p>
                    ) : (
                        <ul>
                            {filteredProfiles.map(profile => (
                                <li key={profile.id} onClick={() => setSelectedUser(profile)} className={`flex items-center space-x-3 p-4 cursor-pointer transition-colors ${selectedUser?.id === profile.id ? 'bg-base-300' : 'hover:bg-base-100'}`}>
                                    <img src={profile.avatar_url} alt={profile.name} className="w-10 h-10 rounded-full object-cover"/>
                                    <div className="flex-grow min-w-0">
                                        <p className="font-bold text-sm truncate">{profile.name}</p>
                                        <p className="text-xs text-base-content/60 truncate">@{profile.handle}</p>
                                    </div>
                                    {unreadCounts[profile.id] > 0 && (
                                        <div className="bg-primary text-black text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0">
                                            {unreadCounts[profile.id]}
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Right Panel: Chat Window */}
            <div className="flex-1 flex flex-col min-w-0 bg-base-100">
                {selectedUser ? (
                    <ChatWindow
                        session={session}
                        otherUser={selectedUser}
                        key={selectedUser.id} // Add key to force re-mount on user change
                    />
                ) : (
                    <div className="flex flex-col h-full">
                        {/* Fake Header */}
                        <div className="h-24 flex-shrink-0 border-b-2 border-base-300 bg-base-200"></div>
                        
                        {/* Empty Messages Area */}
                        <div className="flex-grow flex flex-col items-center justify-center text-center text-base-content/60 p-8">
                            <MessagesIcon className="w-24 h-24 mb-4"/>
                            <h2 className="text-xl font-bold">Выберите чат</h2>
                            <p>Выберите пользователя из списка слева, чтобы начать переписку.</p>
                        </div>
                        
                        {/* Fake Input Area */}
                        <div className="p-4 border-t-2 border-base-300 flex-shrink-0 bg-base-200">
                            <div className="flex items-center space-x-3">
                                <div className="flex-1 h-10 bg-base-100 border border-base-300 rounded-full"></div>
                                <div className="w-11 h-11 rounded-full bg-primary opacity-50 flex-shrink-0"></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Messages;