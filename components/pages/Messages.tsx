import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../supabaseClient';
import { Profile } from '../../types';
import { Session } from '@supabase/supabase-js';
import ChatWindow from '../ChatWindow';
import MessagesIcon from '../icons/MessagesIcon';

interface MessagesProps {
    session: Session;
    initialUserId: string | null;
    clearInitialUserId: () => void;
}

const Messages: React.FC<MessagesProps> = ({ session, initialUserId, clearInitialUserId }) => {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchProfiles = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .neq('id', session.user.id); // Exclude self

            if (error) {
                console.error("Error fetching profiles:", error);
            } else {
                setProfiles(data as Profile[]);
            }
            setLoading(false);
        };
        fetchProfiles();
    }, [session.user.id]);
    
    useEffect(() => {
        if (initialUserId && profiles.length > 0) {
            const userToSelect = profiles.find(p => p.id === initialUserId);
            if (userToSelect) {
                setSelectedUser(userToSelect);
            }
            clearInitialUserId();
        }
    }, [initialUserId, profiles, clearInitialUserId]);

    const filteredProfiles = useMemo(() => {
        if (!searchTerm) return profiles;
        return profiles.filter(profile =>
            profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            profile.handle.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [profiles, searchTerm]);

    return (
        <div className="flex h-[calc(100vh-8rem)] bg-base-200 rounded-2xl overflow-hidden">
            {/* Left Panel: User List */}
            <div className="w-1/3 border-r border-base-300 flex flex-col">
                <div className="p-4 border-b border-base-300">
                    <h1 className="text-xl font-bold">Чаты</h1>
                    <input
                        type="text"
                        placeholder="Поиск пользователей..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="mt-4 w-full px-3 py-2 bg-base-100 border border-base-300 rounded-full text-sm shadow-sm placeholder-base-content/50 focus:outline-none focus:border-primary"
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
                                    <div>
                                        <p className="font-bold text-sm">{profile.name}</p>
                                        <p className="text-xs text-base-content/60">@{profile.handle}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Right Panel: Chat Window */}
            <div className="w-2/3 flex flex-col">
                {selectedUser ? (
                    <ChatWindow
                        session={session}
                        otherUser={selectedUser}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-base-content/60 p-8">
                        <MessagesIcon className="w-24 h-24 mb-4"/>
                        <h2 className="text-xl font-bold">Выберите чат</h2>
                        <p>Выберите пользователя из списка слева, чтобы начать переписку.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Messages;
