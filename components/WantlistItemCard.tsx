import React from 'react';
import { WantlistItem } from '../types';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';

interface WantlistItemCardProps {
    item: WantlistItem;
    onEdit: () => void;
    onDelete: () => void;
}

const WantlistItemCard: React.FC<WantlistItemCardProps> = ({ item, onEdit, onDelete }) => (
    <div className="bg-base-200 p-6 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex-grow">
            <h2 className="font-bold text-xl">{item.name}</h2>
            <p className="text-sm text-base-content/70 mt-1">{item.details}</p>
            <p className="text-base-content/90 mt-2">{item.description}</p>
        </div>
        <div className="flex space-x-2 flex-shrink-0 self-end sm:self-center">
            <button onClick={onEdit} className="bg-base-300 hover:bg-secondary text-base-content font-semibold p-2.5 rounded-full text-sm transition-colors" aria-label="Редактировать">
                <EditIcon className="w-4 h-4" />
            </button>
            <button onClick={onDelete} className="bg-red-500/20 hover:bg-red-500/40 text-red-500 font-semibold p-2.5 rounded-full text-sm transition-colors" aria-label="Удалить">
                <TrashIcon className="w-4 h-4" />
            </button>
        </div>
    </div>
);

export default WantlistItemCard;
