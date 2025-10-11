import React from 'react';
import ImageIcon from './icons/ImageIcon';

interface AttachedItem {
    id: string;
    name: string;
    image_url: string | null;
}

interface AttachedItemCardProps {
    item: AttachedItem;
    onItemClick: (itemId: string) => void;
}

const AttachedItemCard: React.FC<AttachedItemCardProps> = ({ item, onItemClick }) => {
    return (
        <button 
            onClick={() => onItemClick(item.id)}
            className="w-full flex items-center gap-3 p-2 bg-black/10 dark:bg-white/10 rounded-lg text-left hover:bg-black/20 dark:hover:bg-white/20 transition-colors"
        >
            <div className="w-12 h-12 bg-base-300 rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden">
                {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                    <ImageIcon className="w-6 h-6 text-base-content/20" />
                )}
            </div>
            <div className="flex-grow min-w-0">
                <p className="text-xs font-bold truncate opacity-80">Предмет из коллекции:</p>
                <p className="text-sm font-semibold truncate">{item.name}</p>
            </div>
        </button>
    );
};

export default AttachedItemCard;