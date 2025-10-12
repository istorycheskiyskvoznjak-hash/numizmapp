import React from 'react';
import { WantlistItem } from '../types';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import MessagesIcon from './icons/MessagesIcon';
import ImageIcon from './icons/ImageIcon';

interface WantlistItemCardProps {
    item: WantlistItem;
    onEdit?: () => void;
    onDelete?: () => void;
    onToggleFound?: () => void;
    onStartConversation?: () => void;
    isTransitioning?: boolean;
    isOwnProfile?: boolean;
}

const WantlistItemCard: React.FC<WantlistItemCardProps> = ({ item, onEdit, onDelete, onToggleFound, onStartConversation, isTransitioning, isOwnProfile }) => (
    <div 
        className={`bg-base-200 rounded-xl flex items-stretch overflow-hidden transition-all duration-500 ${item.is_found && !isTransitioning ? 'opacity-60' : ''}`}
        style={{ order: item.is_found && !isTransitioning ? 1 : 0 }}
    >
        <div className="w-24 h-24 flex-shrink-0 bg-base-300">
            {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
            ) : (
                <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-10 h-10 text-base-content/20" />
                </div>
            )}
        </div>
        
        <div className="flex-1 flex items-center justify-between gap-4 p-4 min-w-0">
            <div className="flex items-center gap-3 flex-1 min-w-0">
                {item.is_found ? (
                    <span className="flex-shrink-0 text-xs font-bold bg-emerald-500/20 text-emerald-500 px-2.5 py-1 rounded-full">
                        Найдено
                    </span>
                ) : (
                    <span className="flex-shrink-0 text-xs font-bold bg-amber-500/20 text-amber-500 px-2.5 py-1 rounded-full">
                        Активно
                    </span>
                )}
                <h2 className={`font-semibold text-lg truncate ${item.is_found ? 'line-through text-base-content/70' : ''}`}>
                    {item.name}
                </h2>
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
                {isOwnProfile ? (
                    <>
                        {onToggleFound && (
                            <button 
                                onClick={onToggleFound} 
                                className={`p-2.5 rounded-full transition-colors ${item.is_found ? 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/40' : 'bg-base-300 hover:bg-secondary text-base-content'}`} 
                                title={item.is_found ? "Отметить как ненайденный" : "Отметить как найденный"}
                            >
                                <CheckCircleIcon className="w-5 h-5" />
                            </button>
                        )}
                        {onEdit && (
                            <button 
                                onClick={onEdit} 
                                disabled={!!item.is_found} 
                                className="bg-base-300 hover:bg-secondary text-base-content p-2.5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                                title="Редактировать"
                            >
                                <EditIcon className="w-5 h-5" />
                            </button>
                        )}
                        {onDelete && (
                            <button 
                                onClick={onDelete} 
                                className="bg-red-500/20 hover:bg-red-500/40 text-red-500 p-2.5 rounded-full transition-colors" 
                                title="Удалить"
                            >
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        )}
                    </>
                ) : (
                    onStartConversation && (
                        <button 
                            onClick={onStartConversation}
                            className="bg-primary/80 text-black hover:bg-primary font-semibold py-2 px-5 rounded-full text-sm flex items-center gap-2 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                            <MessagesIcon className="w-4 h-4" />
                            <span>Написать владельцу</span>
                        </button>
                    )
                )}
            </div>
        </div>
    </div>
);

export default WantlistItemCard;