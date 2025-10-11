import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { Collectible } from '../types';
import ImageIcon from './icons/ImageIcon';
import { Session } from '@supabase/supabase-js';

const SearchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
);

interface CollectionItemPickerProps {
    session: Session;
    onClose: () => void;
    onSelectItem: (item: Pick<Collectible, 'id' | 'name' | 'image_url'>) => void;
}

const CollectionItemPicker: React.FC<CollectionItemPickerProps> = ({ session, onClose, onSelectItem }) => {
    const [items, setItems] = useState<Pick<Collectible, 'id' | 'name' | 'image_url'>[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        const fetchItems = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('collectibles')
                .select('id, name, image_url')
                .eq('owner_id', session.user.id)
                .order('created_at', { ascending: false });
            
            if (isMounted.current) {
                if (error) {
                    console.error("Error fetching collection for picker:", error);
                } else {
                    setItems(data);
                }
                setLoading(false);
            }
        };

        fetchItems();
        return () => { isMounted.current = false; };
    }, [session.user.id]);

    const filteredItems = useMemo(() => {
        if (!searchTerm.trim()) {
            return items;
        }
        return items.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [items, searchTerm]);


    return (
        <div className="absolute bottom-20 left-4 right-4 z-10">
            <div 
                className="bg-base-300 rounded-2xl shadow-2xl border-2 border-base-content/10 p-4 max-h-80 flex flex-col" 
                onClick={e => e.stopPropagation()}
            >
                <h3 className="text-lg font-bold mb-2 text-center flex-shrink-0">Поделиться предметом из коллекции</h3>
                 <div className="relative mb-4 flex-shrink-0">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <SearchIcon className="w-4 h-4 text-base-content/40" />
                    </div>
                    <input
                        type="text"
                        placeholder="Поиск по названию..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 bg-base-100 border border-base-300 rounded-full text-sm shadow-sm placeholder-base-content/50 focus:outline-none focus:border-primary"
                        aria-label="Поиск предмета в коллекции"
                    />
                </div>
                {loading ? (
                    <p className="text-center text-base-content/70">Загрузка...</p>
                ) : items.length === 0 ? (
                    <p className="text-center text-base-content/70">Ваша коллекция пуста.</p>
                ) : filteredItems.length === 0 ? (
                     <p className="text-center text-base-content/70">Ничего не найдено.</p>
                ) : (
                    <div className="flex-grow overflow-y-auto pr-2">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {filteredItems.map(item => (
                                <div 
                                    key={item.id} 
                                    onClick={() => onSelectItem(item)} 
                                    className="bg-base-100 rounded-lg p-2 cursor-pointer hover:bg-primary hover:text-black transition-colors group"
                                >
                                    <div className="aspect-square w-full bg-base-300 rounded overflow-hidden flex items-center justify-center">
                                        {item.image_url ? (
                                            <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <ImageIcon className="w-8 h-8 text-base-content/20" />
                                        )}
                                    </div>
                                    <p className="text-xs font-semibold mt-2 truncate text-center">{item.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CollectionItemPicker;