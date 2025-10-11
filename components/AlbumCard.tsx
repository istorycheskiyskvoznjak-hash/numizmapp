import React, { useState } from 'react';
import { Album } from '../types';
import FolderIcon from './icons/FolderIcon';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';

interface AlbumCardProps {
  album: Album;
  itemCount: number;
  coverImageUrl: string | null;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const AlbumCard: React.FC<AlbumCardProps> = ({ album, itemCount, coverImageUrl, onClick, onEdit, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);

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
  
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering onClick for the whole card
    if (onEdit) onEdit();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering onClick for the whole card
    if (onDelete) onDelete();
  };
  
  const toggleDescription = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const description = album.description || '';
  const isLongDescription = description.length > 175;
  const displayedDescription = isLongDescription && !isExpanded
    ? `${description.substring(0, 175)}...`
    : description;

  return (
    <div
      className="flex items-center gap-4 bg-base-200 p-3 rounded-xl cursor-pointer group transition-all duration-300 hover:shadow-lg hover:bg-base-300"
      onClick={onClick}
    >
      {/* Left side: Image/Icon */}
      <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-base-300 rounded-lg flex items-center justify-center overflow-hidden">
        {coverImageUrl ? (
          <img src={coverImageUrl} alt={`Cover for ${album.name}`} className="h-full w-full object-cover" />
        ) : (
          <FolderIcon className="w-10 h-10 text-base-content/20" />
        )}
      </div>

      {/* Right side: Info */}
      <div className="flex-1 min-w-0 self-start py-1">
        <h3 className="font-bold text-xl text-base-content">{album.name}</h3>
        {description && (
          <div className="text-sm text-base-content/70 mt-1 break-words">
            <p className="inline">{displayedDescription}</p>
            {isLongDescription && (
              <button onClick={toggleDescription} className="text-primary font-semibold hover:underline ml-1 inline">
                {isExpanded ? 'Скрыть' : 'Раскрыть'}
              </button>
            )}
          </div>
        )}
        <p className="text-sm font-semibold text-primary mt-2">
          {itemCount} {getItemCountText(itemCount)}
        </p>
      </div>

      {/* Action Buttons */}
      {(onEdit || onDelete) && (
        <div className="flex flex-col sm:flex-row gap-2 self-center ml-auto pl-2">
          {onEdit && (
            <button onClick={handleEditClick} className="p-2.5 rounded-full bg-base-300 group-hover:bg-base-100 hover:!bg-secondary transition-colors" aria-label="Редактировать альбом">
              <EditIcon className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button onClick={handleDeleteClick} className="p-2.5 rounded-full bg-base-300 group-hover:bg-base-100 hover:!bg-red-500/20 hover:!text-red-500 transition-colors" aria-label="Удалить альбом">
              <TrashIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AlbumCard;