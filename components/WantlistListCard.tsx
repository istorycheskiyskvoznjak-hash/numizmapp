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
  
  const foundCount = items.filter(i => i.is_found).length;
  const totalCount = items.length;
  const progressPercentage = totalCount > 0 ? (foundCount / totalCount) * 100 : 0;

  return (
    <div
      className="bg-base-300 rounded-2xl p-4 flex flex-col group cursor-pointer hover:bg-base-content/10 transition-colors relative"
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
                <>
                    {list.is_public ? (
                        <div title="Этот список виден всем" className="bg-primary text-primary-content px-2.5 py-1 rounded-full flex items-center gap-1.5 text-xs font-bold shadow-sm">
                            <EyeIcon className="w-3.5 h-3.5" />
                            <span>Публичный</span>
                        </div>
                    ) : (
                        <div title="Этот список виден только вам" className="bg-red-500 text-white px-2.5 py-1 rounded-full flex items-center gap-1.5 text-xs font-bold shadow-sm">
                            <LockClosedIcon className="w-3.5 h-3.5" />
                            <span>Приватный</span>
                        </div>
                    )}
                </>
            )}
        </div>
        {list.description && <p className="text-sm mt-2 text-base-content/80 line-clamp-2">{list.description}</p>}
        {totalCount > 0 && (
            <div className="mt-3">
                <div className="flex justify-between items-center text-xs text-base-content/80 mb-1">
                    <span className="font-semibold">Прогресс</span>
                    <span>{foundCount} / {totalCount}</span>
                </div>
                <div className="w-full bg-base-100 rounded-full h-2 overflow-hidden">
                    <div 
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                </div>
            </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-base-content/10">
        {items.length > 0 ? (
            <ul className="space-y-2 text-sm">
                {items.slice(0, 4).map(item => (
                <li key={item.id} className={`flex items-center gap-3 transition-colors ${item.is_found ? 'text-base-content/50' : 'text-base-content/90'}`}>
                    <div className="w-6 h-6 bg-base-100 rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden border border-base-content/10">
                    {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                        <ImageIcon className="w-4 h-4 text-base-content/40" />
                    )}
                    </div>
                    {item.is_found ? (
                        <span className="flex-shrink-0 text-[10px] font-bold bg-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded-full">
                            Найдено
                        </span>
                    ) : (
                        <span className="flex-shrink-0 text-[10px] font-bold bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-full">
                            Активно
                        </span>
                    )}
                    <span className={`truncate flex-1 ${item.is_found ? 'line-through' : ''}`}>{item.name}</span>
                </li>
                ))}
                {items.length > 4 && (
                <li className="text-xs text-base-content/60 pl-8 pt-1">
                    ...и еще {items.length - 4}
                </li>
                )}
            </ul>
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