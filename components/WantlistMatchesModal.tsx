import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Collectible, WantlistItem, Profile } from '../types';
import MessagesIcon from './icons/MessagesIcon';

interface Match extends WantlistItem {
    profiles: Pick<Profile, 'name' | 'handle' | 'avatar_url'> | null;
}

interface WantlistMatchesModalProps {
  item: Collectible;
  onClose: () => void;
  onStartConversation: (userId: string) => void;
}

const WantlistMatchesModal: React.FC<WantlistMatchesModalProps> = ({ item, onClose, onStartConversation }) => {
    const [matches, setMatches] = useState<Match[]>([]);
    const [loading, setLoading] = useState(true);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
          isMounted.current = false;
        };
      }, []);

    useEffect(() => {
        const fetchMatches = async () => {
            setLoading(true);
            
            const searchTerms = item.name.trim();
            if (!searchTerms) {
                setLoading(false);
                return;
            }

            // Step 1: Find matching wantlist items from other users
            const { data: wantlistData, error: wantlistError } = await supabase
                .from('wantlist')
                .select('*')
                .neq('user_id', item.owner_id)
                .ilike('name', `%${searchTerms}%`);

            if (!isMounted.current) return;

            if (wantlistError) {
                console.error("Error fetching wantlist items:", wantlistError.message);
                setMatches([]);
                setLoading(false);
                return;
            }

            if (!wantlistData || wantlistData.length === 0) {
                setMatches([]);
                setLoading(false);
                return;
            }

            // Step 2: Get user IDs and fetch their profiles
            const userIds = [...new Set(wantlistData.map(w => w.user_id))];
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('id, name, handle, avatar_url')
                .in('id', userIds);

            if (profilesError) {
                console.error("Error fetching profiles for matches:", profilesError.message);
                const formattedMatches = wantlistData.map(w => ({ ...w, profiles: null }));
                setMatches(formattedMatches as Match[]);
            } else {
                // Step 3: Combine the data
                const profilesMap = new Map(profilesData.map(p => [p.id, { name: p.name, handle: p.handle, avatar_url: p.avatar_url }]));
                const formattedMatches = wantlistData.map(wantlistItem => ({
                    ...wantlistItem,
                    profiles: profilesMap.get(wantlistItem.user_id) || null
                }));
                setMatches(formattedMatches as Match[]);
            }
            setLoading(false);
        };

        fetchMatches();
    }, [item]);

    const handleStartChat = (userId: string) => {
        onStartConversation(userId);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-base-200 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-base-300 flex-shrink-0">
                    <h1 className="text-2xl font-bold">Совпадения в вишлистах</h1>
                    <p className="text-base-content/70">для "{item.name}"</p>
                </div>
                <div className="flex-grow p-6 overflow-y-auto">
                    {loading ? (
                        <p className="text-center text-base-content/70">Поиск совпадений...</p>
                    ) : matches.length === 0 ? (
                        <div className="text-center py-8">
                            <h2 className="text-xl font-bold">Совпадений не найдено</h2>
                            <p className="text-base-content/70 mt-2">Никто не ищет этот предмет в данный момент.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {matches.map(match => (
                                <div key={match.id} className="bg-base-100 p-4 rounded-xl flex flex-col sm:flex-row gap-4">
                                    <div className="flex items-start gap-4 flex-grow">
                                        <img src={match.profiles?.avatar_url || `https://i.pravatar.cc/150?u=${match.user_id}`} alt={match.profiles?.name} className="w-12 h-12 rounded-full object-cover" />
                                        <div className="flex-1">
                                            <p className="font-bold">{match.profiles?.name || 'Пользователь'}</p>
                                            <p className="text-sm text-base-content/70">@{match.profiles?.handle || '...'}</p>
                                            <div className="mt-3 border-t border-base-300 pt-3">
                                                <p className="text-xs font-semibold text-base-content/80">Ищет:</p>
                                                <p className="font-semibold text-primary">{match.name}</p>
                                                {match.description && <p className="text-sm text-base-content/90 mt-1">{match.description}</p>}
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleStartChat(match.user_id)}
                                        className="bg-primary/80 text-black hover:bg-primary font-semibold py-2 px-4 rounded-full text-sm flex items-center gap-2 self-center sm:self-start flex-shrink-0"
                                    >
                                        <MessagesIcon className="w-4 h-4" />
                                        <span>Написать</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                 <div className="p-4 bg-base-300/50 flex justify-end flex-shrink-0 rounded-b-2xl">
                    <button type="button" onClick={onClose} className="px-6 py-2 rounded-full text-sm font-medium bg-base-300 hover:bg-base-content/20 transition-colors">
                        Закрыть
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WantlistMatchesModal;