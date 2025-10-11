import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Collectible, Profile, Album, WantlistList, WantlistItem, Message } from '../types';
import SearchIcon from './icons/SearchIcon';
import ImageIcon from './icons/ImageIcon';
import UserCircleIcon from './icons/UserCircleIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import FolderIcon from './icons/FolderIcon';
import HeartIcon from './icons/HeartIcon';
import MessagesIcon from './icons/MessagesIcon';
import { Session } from '@supabase/supabase-js';

interface GlobalSearchModalProps {
  session: Session;
  onClose: () => void;
  onViewProfile: (profile: Profile) => void;
  onViewItem: (itemId: string) => void;
  onViewAlbum: (albumId: string) => void;
  onViewWantlist: (listId: string) => void;
  onViewMessageThread: (partnerId: string) => void;
}

type SearchResult = 
    | { type: 'profile'; data: Profile }
    | { type: 'collectible'; data: Collectible }
    | { type: 'album'; data: Album }
    | { type: 'wantlist_list'; data: WantlistList }
    | { type: 'wantlist_item'; data: WantlistItem }
    | { type: 'message'; data: Message & { partner: Profile }};

const resultIcons: Record<string, React.FC<any>> = {
    profile: UserCircleIcon,
    collectible: ImageIcon,
    album: FolderIcon,
    wantlist_list: HeartIcon,
    wantlist_item: HeartIcon,
    message: MessagesIcon,
};

const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ session, onClose, onViewProfile, onViewItem, onViewAlbum, onViewWantlist, onViewMessageThread }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const searchTimeoutRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (searchTerm.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    searchTimeoutRef.current = window.setTimeout(async () => {
      const term = searchTerm.trim();
      
      const [profilesRes, collectiblesRes, albumsRes, wantlistListsRes, wantlistItemsRes, messagesRes] = await Promise.all([
        supabase.from('profiles').select('*').or(`name.ilike.%${term}%,handle.ilike.%${term}%`).limit(3),
        supabase.from('collectibles').select('*').or(`name.ilike.%${term}%,description.ilike.%${term}%,country.ilike.%${term}%,mint.ilike.%${term}%,material.ilike.%${term}%`).limit(5),
        supabase.from('albums').select('*').ilike('name', `%${term}%`).eq('is_public', true).limit(3),
        supabase.from('wantlist_lists').select('*').or(`name.ilike.%${term}%,description.ilike.%${term}%`).limit(3),
        supabase.from('wantlist').select('*').or(`name.ilike.%${term}%,details.ilike.%${term}%,description.ilike.%${term}%`).limit(5),
        supabase.from('messages').select('*').ilike('content', `%${term}%`).or(`sender_id.eq.${session.user.id},recipient_id.eq.${session.user.id}`).limit(10)
      ]);

      let combinedResults: SearchResult[] = [];
      if (profilesRes.data) combinedResults.push(...profilesRes.data.map(p => ({ type: 'profile' as const, data: p as Profile })));
      if (collectiblesRes.data) combinedResults.push(...collectiblesRes.data.map(c => ({ type: 'collectible' as const, data: c as Collectible })));
      if (albumsRes.data) combinedResults.push(...albumsRes.data.map(a => ({ type: 'album' as const, data: a as Album })));
      if (wantlistListsRes.data) combinedResults.push(...wantlistListsRes.data.map(l => ({ type: 'wantlist_list' as const, data: l as WantlistList })));
      if (wantlistItemsRes.data) combinedResults.push(...wantlistItemsRes.data.map(i => ({ type: 'wantlist_item' as const, data: i as WantlistItem })));

      // Process messages to include partner profiles
      if (messagesRes.data && messagesRes.data.length > 0) {
        const partnerIds = [...new Set(messagesRes.data.map(m => m.sender_id === session.user.id ? m.recipient_id : m.sender_id))];
        const { data: partners } = await supabase.from('profiles').select('*').in('id', partnerIds);
        if (partners) {
            const partnersMap = new Map(partners.map(p => [p.id, p as Profile]));
            messagesRes.data.forEach(m => {
                const partnerId = m.sender_id === session.user.id ? m.recipient_id : m.sender_id;
                const partner = partnersMap.get(partnerId);
                if (partner) {
                    combinedResults.push({ type: 'message' as const, data: { ...m as Message, partner }});
                }
            });
        }
      }

      setResults(combinedResults);
      setLoading(false);
    }, 300);

    return () => { if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current); }
  }, [searchTerm, session.user.id]);
  
  const handleSelect = (result: SearchResult) => {
    switch (result.type) {
        case 'profile': onViewProfile(result.data); break;
        case 'collectible': onViewItem(result.data.id); break;
        case 'album': onViewAlbum(result.data.id); break;
        case 'wantlist_list': onViewWantlist(result.data.id); break;
        case 'wantlist_item': onViewWantlist(result.data.list_id); break;
        case 'message': onViewMessageThread(result.data.partner.id); break;
    }
    onClose();
  };

  const getResultDetails = (result: SearchResult): { title: string, subtitle: string } => {
    switch (result.type) {
        case 'profile': return { title: result.data.name || '', subtitle: `@${result.data.handle}`};
        case 'collectible': return { title: result.data.name, subtitle: `Предмет: ${result.data.country}` };
        case 'album': return { title: result.data.name, subtitle: 'Альбом' };
        case 'wantlist_list': return { title: result.data.name, subtitle: 'Вишлист' };
        case 'wantlist_item': return { title: result.data.name, subtitle: 'Ищет в вишлисте' };
        case 'message': return { title: `"${result.data.content.split('$$ATTACHMENT::')[0]}"`, subtitle: `Чат с @${result.data.partner.handle}`};
        default: return { title: 'Результат', subtitle: '' };
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-[15vh]" onClick={onClose}>
      <div className="bg-base-200 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="relative p-4 border-b border-base-300">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-8">
                <SearchIcon className="w-5 h-5 text-base-content/40" />
            </div>
            {loading && <div className="absolute inset-y-0 right-0 flex items-center pr-8"><SpinnerIcon className="w-5 h-5 text-primary animate-spin" /></div>}
            <input
                ref={inputRef} type="text" placeholder="Искать везде..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-12 py-3 bg-transparent text-lg focus:outline-none"
            />
        </div>
        <div className="max-h-[50vh] overflow-y-auto">
            {searchTerm.length > 1 && !loading && results.length === 0 && (
                <div className="p-16 text-center text-base-content/70">
                    <h3 className="text-lg font-semibold">Ничего не найдено</h3>
                    <p>Попробуйте другой поисковый запрос.</p>
                </div>
            )}
            {results.length > 0 && (
                <ul>
                    {results.map((result, index) => {
                        const { title, subtitle } = getResultDetails(result);
                        const Icon = resultIcons[result.type] || UserCircleIcon;
                        return (
                            <li key={`${result.type}-${result.data.id}-${index}`}>
                                <button onClick={() => handleSelect(result)} className="w-full text-left p-4 flex items-center gap-4 hover:bg-base-300 transition-colors outline-none focus-visible:bg-base-300">
                                    <div className="w-10 h-10 bg-base-300 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                                        <Icon className="w-6 h-6 text-base-content/60" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold truncate">{title}</p>
                                        <p className="text-sm text-base-content/70 truncate">{subtitle}</p>
                                    </div>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchModal;