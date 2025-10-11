
import React from 'react';
import { WantlistItem } from '../types';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import ImageIcon from './icons/ImageIcon';

interface WantlistItemCardProps {
    item: WantlistItem;
    onEdit?: () => void;
    onDelete?: () => void;
    onToggleFound?: () => void;
    isTransitioning?: boolean;
}

const WantlistItemCard: React.FC<WantlistItemCardProps> = ({ item, onEdit, onDelete, onToggleFound, isTransitioning }) => (
    <div 
        className={`bg-base-200 p-4 rounded-xl flex items-start sm:items-center gap-4 flex-col sm:flex-row transition-all duration-500 ${item.is_found ? 'opacity-60' : ''}`}
        style={{ order: item.is_found && !isTransitioning ? 1 : 0 }}
    >
        {item.image_url && (
            <div className="w-28 h-28 flex-shrink-0 bg-base-300 rounded-lg flex items-center justify-center overflow-hidden">
                <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
            </div>
        )}
        <div className={`flex-grow transition-all duration-500 ${item.is_found ? 'italic line-through text-base-content/70' : ''}`}>
             <div className="flex items-center gap-3">
                {item.is_found ? (
                    <span className="text-xs font-bold bg-emerald-500/20 text-emerald-500 px-2.5 py-1 rounded-full no-underline">
                        ✓ Найдено
                    </span>
                ) : (
                    <span className="text-xs font-bold bg-amber-500/20 text-amber-500 px-2.5 py-1 rounded-full no-underline">
                        🔥 Активно
                    </span>
                )}
                <h2 className="font-bold text-xl">{item.name}</h2>
            </div>
            <p className="text-sm mt-2">{item.details}</p>
            <p className="mt-2">{item.description}</p>
        </div>
        {(onEdit || onDelete || onToggleFound) && (
            <div className="flex flex-row space-x-2 flex-shrink-0 self-center">
                 {onToggleFound && (
                    <button 
                        onClick={onToggleFound} 
                        className={`font-semibold p-2.5 rounded-full text-sm transition-colors ${item.is_found ? 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/40' : 'bg-base-300 hover:bg-secondary text-base-content'}`} 
                        title={item.is_found ? "Отметить как ненайденный" : "Отметить как найденный"}
                    >
                        <CheckCircleIcon className="w-4 h-4" />
                    </button>
                )}
                {onEdit && (
                    <button 
                        onClick={onEdit} 
                        disabled={item.is_found} 
                        className="bg-base-300 hover:bg-secondary text-base-content font-semibold p-2.5 rounded-full text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                        title="Редактировать"
                    >
                        <EditIcon className="w-4 h-4" />
                    </button>
                )}
                {onDelete && (
                    <button 
                        onClick={onDelete} 
                        className="bg-red-500/20 hover:bg-red-500/40 text-red-500 font-semibold p-2.5 rounded-full text-sm transition-colors" 
                        title="Удалить"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                )}
            </div>
        )}
    </div>
);

export default WantlistItemCard;