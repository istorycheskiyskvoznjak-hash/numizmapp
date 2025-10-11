import React from 'react';
import { WantlistList, WantlistItem } from '../types';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import LockClosedIcon from './icons/LockClosedIcon';
import EyeIcon from './icons/EyeIcon';
import ImageIcon from './icons/ImageIcon';

interface WantlistListCardProps {
  list: WantlistList;
  items: WantlistItem[];
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isOwnProfile?: boolean;
}

const getItemCountText = (count: number): string => {
    const lastDigit = count % 10;
    const lastTwoDigits = count % 100;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
      return 'предметов';
    }
    if (lastDigit === 1) {
      return 'предмет';
    }
    if (lastDigit >= 2 && lastDigit <= 4) {
      return 'предмета';
    }
    return 'предметов';
};

const WantlistListCard: React.FC<WantlistListCardProps> = ({ list, items, onClick, onEdit, onDelete, isOwnProfile }) => {
  
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  };

  const previewItems = items.slice(0, 4);

  return (
    <div
      className="bg-base-300 rounded-2xl p-4 flex flex-col justify-between group cursor-pointer hover:bg-base-content/10 transition-colors relative"
      onClick={onClick}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <div>
        <div className="flex justify-between items-start">
            <div>
                <h3 className="font-bold text-xl">{list.name}</h3>
                <p className="text-base-content/70 text-sm">{items.length} {getItemCountText(items.length)}</p>
            </div>
            {isOwnProfile && (
                <div className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border backdrop-blur-sm ${list.is_public ? 'bg-emerald-500/30 text-emerald-200 border-emerald-300/50' : 'bg-amber-500/30 text-amber-200 border-amber-300/50'}`}>
                    {list.is_public ? <EyeIcon className="w-3.5 h-3.5" /> : <LockClosedIcon className="w-3.5 h-3.5" />}
                    <span>{list.is_public ? 'Публичный' : 'Приватный'}</span>
                </div>
            )}
        </div>
        {list.description && <p className="text-sm mt-2 text-base-content/80 line-clamp-2">{list.description}</p>}
      </div>

      <div className="mt-4 pt-4 border-t border-base-content/10">
        {previewItems.length > 0 ? (
          <div className="flex -space-x-4">
            {previewItems.map(item => (
              <div key={item.id} className="w-10 h-10 bg-base-100 rounded-full border-2 border-base-300 flex items-center justify-center overflow-hidden shadow-md">
                {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                    <ImageIcon className="w-5 h-5 text-base-content/40" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-base-content/60">В этом списке пока нет предметов.</p>
        )}
      </div>

      {(onEdit || onDelete) && (
          <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300">
              {onEdit && (
              <button onClick={handleEditClick} className="p-2 rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60 transition-colors" aria-label="Редактировать список">
                  <EditIcon className="w-4 h-4" />
              </button>
              )}
              {onDelete && (
              <button onClick={handleDeleteClick} className="p-2 rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-red-500/80 transition-colors" aria-label="Удалить список">
                  <TrashIcon className="w-4 h-4" />
              </button>
              )}
          </div>
      )}
    </div>
  );
};

export default WantlistListCard;