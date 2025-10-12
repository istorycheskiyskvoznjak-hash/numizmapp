import React from 'react';
import { Album, Collectible } from '../types';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';
import LockClosedIcon from './icons/LockClosedIcon';
import EyeIcon from './icons/EyeIcon';

interface AlbumCardProps {
  album: Album;
  items: Collectible[];
  itemCount: number;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isOwnProfile?: boolean;
}

const PrivacyBadge: React.FC<{ isPublic: boolean }> = ({ isPublic }) => {
  const Icon = isPublic ? EyeIcon : LockClosedIcon;
  return (
    <div title={isPublic ? 'Этот альбом виден всем' : 'Этот альбом виден только вам'} className={`relative flex items-center justify-center bg-primary text-primary-content w-7 h-7 rounded-full shadow-sm`}>
      <Icon className="w-4 h-4" />
      {!isPublic && (
        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-primary" />
      )}
    </div>
  );
};


const AlbumCard: React.FC<AlbumCardProps> = ({ album, items, itemCount, onClick, onEdit, onDelete, isOwnProfile }) => {
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
  
  const previewItems = items.slice(0, 4);

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.();
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  };
  
  const finalCoverUrl = album.cover_image_url;
  const hasHeader = !!album.header_image_url;
  const theme = album.theme_color || 'default';

  const themeClasses = {
      default: {
          bg: 'bg-base-300',
          textColor: hasHeader ? 'text-white' : 'text-base-content',
          paneBg: hasHeader ? 'bg-black/40 backdrop-blur-md' : 'bg-base-100/20',
          coverBorder: 'border-gold/30',
          coverBorderHover: 'group-hover:border-gold/60',
          coverPlaceholderText: 'text-gold/50',
          ring: 'ring-gold/50 focus-visible:ring-gold'
      },
      primary: {
          bg: 'bg-primary',
          textColor: 'text-primary-content',
          paneBg: hasHeader ? 'bg-black/40 backdrop-blur-md' : 'bg-black/10',
          coverBorder: 'border-primary-content/30',
          coverBorderHover: 'group-hover:border-primary-content/60',
          coverPlaceholderText: 'text-primary-content/50',
          ring: 'ring-primary-focus/50 focus-visible:ring-primary-focus'
      },
      secondary: {
          bg: 'bg-secondary',
          textColor: 'text-secondary-content',
          paneBg: hasHeader ? 'bg-black/40 backdrop-blur-md' : 'bg-black/10',
          coverBorder: 'border-secondary-content/30',
          coverBorderHover: 'group-hover:border-secondary-content/60',
          coverPlaceholderText: 'text-secondary-content/50',
          ring: 'ring-secondary-focus/50 focus-visible:ring-secondary-focus'
      },
      glass: {
        bg: 'bg-base-300', // Fallback for when no header image is provided
        textColor: 'text-white',
        paneBg: 'bg-black/20 backdrop-blur-sm border border-white/10',
        coverBorder: 'border-primary/40',
        coverBorderHover: 'group-hover:border-primary/70',
        coverPlaceholderText: 'text-white/70', // Not used for glass theme
        ring: 'ring-primary/50 focus-visible:ring-primary'
      }
  };
  const currentTheme = themeClasses[theme];


  return (
    <div
      className={`relative min-h-[180px] rounded-2xl overflow-hidden group transition-all duration-300 ease-in-out hover:shadow-2xl hover:scale-[1.01] focus-within:ring-2 focus-visible:ring-2 ring-offset-2 ring-offset-base-100 cursor-pointer shadow-lg ${currentTheme.bg} ${currentTheme.ring}`}
      onClick={onClick}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      {/* Layer 1: BG Texture */}
      {hasHeader && (
        <img src={album.header_image_url!} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105" />
      )}
      {/* Layer 2 & 3: Vignette + Overlay */}
      {hasHeader && <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/30"></div>}
      
      {/* Main Content Grid */}
      <div className="relative grid grid-cols-12 gap-x-4 sm:gap-x-6 p-4 h-full">
        {/* Left Column: Cover */}
        <div className="col-span-5 flex items-center justify-center">
            <div className="relative w-[90%] aspect-square transition-transform duration-300 ease-out group-hover:-translate-y-1 group-hover:scale-105">
                {theme === 'glass' ? (
                    <div className={`w-full h-full flex flex-col items-center justify-center bg-primary/10 backdrop-blur-md rounded-lg border-2 ${currentTheme.coverBorder} ${currentTheme.coverBorderHover} p-2 text-center shadow-inner transition-colors duration-300`}>
                        <h4 className="font-serif text-lg sm:text-xl uppercase tracking-widest text-primary [text-shadow:0_1px_4px_rgba(0,0,0,0.7)] leading-tight">
                            {album.cover_text || album.name}
                        </h4>
                    </div>
                ) : finalCoverUrl ? (
                    <div className={`relative w-full h-full bg-black rounded-lg shadow-lg border-2 ${currentTheme.coverBorder} ${currentTheme.coverBorderHover} transition-colors duration-300 p-1`}>
                        <img src={finalCoverUrl} alt={`Cover for ${album.name}`} className="h-full w-full object-cover rounded-[3px] shadow-inner" />
                        {/* Hover Sheen Effect */}
                        <div className="absolute inset-0 rounded-md overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="absolute top-0 -left-full w-1/2 h-full bg-gradient-to-r from-transparent to-white/20 -skew-x-12 animate-[sheen_1.5s_ease-out_infinite] group-hover:animate-[sheen_0.7s_ease-out_forwards]"></div>
                        </div>
                    </div>
                ) : (
                    <div className={`w-full h-full flex flex-col items-center justify-center bg-black/50 rounded-lg border-2 ${currentTheme.coverBorder} p-2 text-center ${currentTheme.coverPlaceholderText} shadow-inner`}>
                        <div className="flex-shrink-0">
                            <span className="font-serif text-lg tracking-widest uppercase">{album.cover_text || 'ALBUM'}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Right Column: Content Pane */}
        <div className="col-span-7 flex flex-col justify-between">
          <div className={`${currentTheme.paneBg} rounded-xl p-4 border border-white/10 h-full flex flex-col justify-between`}>
            <div>
              <h3 className={`font-semibold text-lg sm:text-xl tracking-tight leading-tight flex items-center ${currentTheme.textColor}`}>
                <span className="truncate">{album.name}</span>
              </h3>
              {album.description && (
                <p className={`text-sm mt-1 line-clamp-1 ${currentTheme.textColor}/70`}>
                  {album.description}
                </p>
              )}
               {previewItems.length > 0 && (
                <div className="mt-3 mb-3 space-y-2 text-lg">
                  {previewItems.map(item => (
                    <p key={item.id} className={`truncate leading-snug ${currentTheme.textColor}/70`}>
                      • {item.name}
                    </p>
                  ))}
                </div>
              )}
            </div>
            
            <div className="pt-2 flex justify-between items-center gap-2 flex-wrap">
              <div>
                {itemCount > 4 ? (
                    <div className="bg-primary text-primary-content font-semibold py-1 px-4 rounded-full text-sm shadow-sm">
                        и ещё {itemCount - 4} {getItemCountText(itemCount - 4)}
                    </div>
                ) : (
                    <div className="bg-primary/80 text-primary-content font-semibold py-1 px-4 rounded-full text-sm shadow-sm group-hover:bg-primary transition-colors">
                        Открыть альбом
                    </div>
                )}
              </div>
              <div>
                {isOwnProfile && <PrivacyBadge isPublic={album.is_public} />}
              </div>
            </div>
          </div>
        </div>
      </div>
       {/* Action Buttons - appear on hover */}
      {(onEdit || onDelete) && (
          <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300">
              {onEdit && (
              <button onClick={handleEditClick} className="p-2 rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60 transition-colors" aria-label="Редактировать альбом">
                  <EditIcon className="w-4 h-4" />
              </button>
              )}
              {onDelete && (
              <button onClick={handleDeleteClick} className="p-2 rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-red-500/80 transition-colors" aria-label="Удалить альбом">
                  <TrashIcon className="w-4 h-4" />
              </button>
              )}
          </div>
      )}
    </div>
  );
};

export default AlbumCard;