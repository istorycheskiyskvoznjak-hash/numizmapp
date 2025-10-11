
import React from 'react';
import { Collectible } from '../types';
import ImageIcon from './icons/ImageIcon';
import SearchIcon from './icons/SearchIcon';
import HeartIcon from './icons/HeartIcon';
import MessagesIcon from './icons/MessagesIcon';
import UserGroupIcon from './icons/UserGroupIcon'; // Using this for "Offer"

interface ItemCardProps {
  item: Collectible;
  onItemClick: (item: Collectible) => void;
  onCheckWantlist?: (item: Collectible) => void;
  isNew?: boolean;
}

// Helper component for action buttons on the image
const ActionButtonOnImage: React.FC<{
    children: React.ReactNode;
    className?: string;
    ariaLabel: string;
    onClick?: (e: React.MouseEvent) => void;
}> = ({ children, className, ariaLabel, onClick }) => (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`w-9 h-9 flex items-center justify-center rounded-full bg-primary text-primary-content shadow-lg hover:bg-primary-focus transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-focus focus:ring-offset-2 focus:ring-offset-black/50 ${className}`}
    >
      {children}
    </button>
);

const ItemCard: React.FC<ItemCardProps> = ({ item, onItemClick, onCheckWantlist, isNew }) => {
  const { name, country, year, category, image_url, profiles, grade, rarity } = item;

  const handleActionClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      // Placeholder for future actions
      alert('Действие еще не реализовано.');
  };
  
  const handleWantlistCheck = (e: React.MouseEvent) => {
      e.stopPropagation();
      onCheckWantlist?.(item);
  };
  
  return (
    <div 
      className="group relative flex flex-col rounded-2xl overflow-hidden bg-base-200 shadow-md hover:shadow-xl focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-base-100 transition-all duration-300"
      onClick={() => onItemClick(item)}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onItemClick(item)}
    >
      {/* Media Container */}
      <div className="relative aspect-square w-full cursor-pointer overflow-hidden">
        {image_url ? (
            <img src={image_url} alt={name} className="absolute h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
            <div className="flex items-center justify-center h-full w-full bg-base-300">
                <ImageIcon className="w-16 h-16 text-base-content/20" />
            </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 via-black/40 to-transparent"></div>
        
        {/* Top Left Status Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          {isNew && <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-300/40 backdrop-blur-sm">NEW</span>}
          {grade && <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-blue-500/30 text-blue-200 border border-blue-300/50 backdrop-blur-sm">{grade}</span>}
          {rarity && <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-amber-500/30 text-amber-200 border border-amber-300/50 backdrop-blur-sm">{rarity}</span>}
        </div>
        
        {/* On-Hover Actions */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300">
            {/* Top Left Action */}
            {onCheckWantlist && (
                <div className="absolute top-2.5 left-2.5">
                    <ActionButtonOnImage ariaLabel="Кому это нужно?" onClick={handleWantlistCheck}>
                        <SearchIcon className="w-4 h-4" />
                    </ActionButtonOnImage>
                </div>
            )}
            {/* Top Right Actions */}
            <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5">
                <ActionButtonOnImage ariaLabel="Like item" onClick={handleActionClick}><HeartIcon className="w-4 h-4" /></ActionButtonOnImage>
                <ActionButtonOnImage ariaLabel="Comment on item" onClick={handleActionClick}><MessagesIcon className="w-4 h-4" /></ActionButtonOnImage>
                <ActionButtonOnImage ariaLabel="Make an offer" onClick={handleActionClick}><UserGroupIcon className="w-4 h-4" /></ActionButtonOnImage>
            </div>
        </div>


        {/* Title Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="font-semibold text-lg text-white truncate drop-shadow-md">{name}</h3>
        </div>
      </div>
      
      {/* Meta Strip */}
      <div className="px-3 py-2 bg-base-300">
         <div className="flex items-center justify-between gap-4 text-xs text-base-content/80">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span className="px-2 py-0.5 rounded-full bg-base-100 border border-base-content/10 truncate">{country}</span>
                {year && <span className="px-2 py-0.5 rounded-full bg-base-100 border border-base-content/10">{year}</span>}
                <span className="px-2 py-0.5 rounded-full bg-base-100 border border-base-content/10 capitalize">{category}</span>
            </div>
            {profiles?.handle && profiles?.avatar_url && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <img src={profiles.avatar_url} alt={`Аватар ${profiles.handle}`} className="w-5 h-5 rounded-full object-cover" />
                <span className="font-medium truncate">@{profiles.handle}</span>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ItemCard;
