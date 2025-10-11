
import React from 'react';
import { Collectible } from '../types';
import ImageIcon from './icons/ImageIcon';
import SearchIcon from './icons/SearchIcon';
import BookmarkIcon from './icons/BookmarkIcon';
import BookmarkSolidIcon from './icons/BookmarkSolidIcon';
import EyeIcon from './icons/EyeIcon';
import HandshakeIcon from './icons/HandshakeIcon';
import QuestionMarkCircleIcon from './icons/QuestionMarkCircleIcon';
import HeartIcon from './icons/HeartIcon';

interface ItemCardProps {
  item: Collectible;
  onItemClick: (item: Collectible) => void;
  onCheckWantlist?: (item: Collectible) => void;
  isNew?: boolean;
  onViewProfile?: () => void;
  isOwner?: boolean;
  onParameterSearch?: (field: string, value: any, displayValue?: string) => void;
  // New props for the action rail
  isSaved?: boolean;
  isWatched?: boolean;
  isWantlistMatch?: boolean;
  onSave?: (itemId: string, isCurrentlySaved: boolean) => void;
  onWatch?: (itemId: string, isCurrentlyWatched: boolean) => void;
  onOffer?: (item: Collectible) => void;
  onRequestInfo?: (item: Collectible) => void;
}

const CATEGORY_TRANSLATIONS: Record<string, string> = {
  coin: 'Монета',
  stamp: 'Марка',
  banknote: 'Банкнота',
};

const MATERIAL_TRANSLATIONS: Record<string, string> = {
    gold: 'Золото',
    silver: 'Серебро',
    copper: 'Медь',
    bronze: 'Бронза',
    iron: 'Железо',
    paper: 'Бумага',
    other: 'Другое',
};

// Helper component for action buttons on the image
const ActionButtonOnImage: React.FC<{
    children: React.ReactNode;
    className?: string;
    ariaLabel: string;
    onClick?: (e: React.MouseEvent) => void;
    isActive?: boolean;
}> = ({ children, className = '', ariaLabel, onClick, isActive }) => (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`w-12 h-12 flex items-center justify-center rounded-full bg-primary/95 text-primary-content shadow-lg hover:bg-primary-focus transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-focus focus:ring-offset-2 focus:ring-offset-black/50 ${isActive ? 'bg-primary-focus' : ''} ${className}`}
    >
      {children}
    </button>
);

const WantlistMatchBadge: React.FC = () => (
    <div className="w-12 h-12 flex items-center justify-center rounded-full bg-emerald-500/95 text-white shadow-lg border-2 border-white/50" title="Совпадает с вашим вишлистом!">
        <HeartIcon className="w-6 h-6" />
    </div>
);

const ParameterBadge: React.FC<{ field: string; value: string; displayValue?: string; onParameterSearch?: (field: string, value: string, displayValue?: string) => void }> = ({ field, value, displayValue, onParameterSearch }) => {
    const content = (
        <span className="px-2 py-0.5 rounded-full bg-base-100 border border-base-content/10 flex-shrink-0 capitalize">
            {displayValue || value}
        </span>
    );

    if (onParameterSearch) {
        return <button onClick={(e) => { e.stopPropagation(); onParameterSearch(field, value, displayValue || value); }} className="hover:scale-105 transition-transform">{content}</button>;
    }
    return content;
};

const ItemCard: React.FC<ItemCardProps> = ({ 
    item, 
    onItemClick, 
    onCheckWantlist, 
    isNew, 
    onViewProfile, 
    isOwner, 
    onParameterSearch,
    isSaved,
    isWatched,
    isWantlistMatch,
    onSave,
    onWatch,
    onOffer,
    onRequestInfo
}) => {
  const { name, country, year, category, image_url, profiles, grade, rarity, material, mint } = item;

  const handleActionClick = (handler?: (e: React.MouseEvent) => void) => (e: React.MouseEvent) => {
      e.stopPropagation();
      handler?.(e);
  };
  
  const handleWantlistCheck = (e: React.MouseEvent) => {
      e.stopPropagation();
      onCheckWantlist?.(item);
  };
  
  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewProfile?.();
  };
  
  const showRequestInfo = !grade || !rarity || !material;
  
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
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 to-transparent pointer-events-none"></div>
        
        {/* Top Left Status Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          {isNew && <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-300/40 backdrop-blur-sm">NEW</span>}
          {grade && <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-blue-500/30 text-blue-200 border border-blue-300/50 backdrop-blur-sm">{grade}</span>}
          {rarity && <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-amber-500/30 text-amber-200 border border-amber-300/50 backdrop-blur-sm">{rarity}</span>}
        </div>
        
        {/* On-Hover Action Rail */}
        <div className="absolute top-1/2 right-2.5 -translate-y-1/2 flex flex-col gap-2.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150">
            {isOwner && onCheckWantlist && (
                 <ActionButtonOnImage ariaLabel="Проверить совпадения в вишлистах" onClick={handleActionClick(handleWantlistCheck)}>
                    <SearchIcon className="w-6 h-6" />
                </ActionButtonOnImage>
            )}
            {!isOwner && (
                <>
                    {isWantlistMatch ? (
                        <WantlistMatchBadge />
                    ) : (
                         <ActionButtonOnImage ariaLabel={isSaved ? "Удалить из избранного" : "Сохранить в избранное"} onClick={handleActionClick(() => onSave?.(item.id, !!isSaved))}>
                            {isSaved ? <BookmarkSolidIcon className="w-6 h-6" /> : <BookmarkIcon className="w-6 h-6" />}
                        </ActionButtonOnImage>
                    )}
                    <ActionButtonOnImage ariaLabel={isWatched ? "Прекратить наблюдение" : "Наблюдать за лотом"} onClick={handleActionClick(() => onWatch?.(item.id, !!isWatched))} isActive={isWatched}>
                        <EyeIcon className="w-6 h-6" />
                    </ActionButtonOnImage>
                    <ActionButtonOnImage 
                        ariaLabel="Сделать предложение" 
                        onClick={handleActionClick(() => onOffer?.(item))}
                        className={isWantlistMatch ? 'bg-emerald-500/95 ring-2 ring-white/50' : ''}
                    >
                        <HandshakeIcon className="w-6 h-6" />
                    </ActionButtonOnImage>
                    {showRequestInfo && (
                        <ActionButtonOnImage ariaLabel="Запросить информацию" onClick={handleActionClick(() => onRequestInfo?.(item))}>
                            <QuestionMarkCircleIcon className="w-6 h-6" />
                        </ActionButtonOnImage>
                    )}
                </>
            )}
        </div>

        {/* Title Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="font-semibold text-lg text-white truncate drop-shadow-md">{name}</h3>
        </div>
      </div>
      
      {/* Meta Strip */}
      <div className="px-3 py-2 bg-base-300">
         <div className="flex items-end justify-between gap-4 text-xs text-base-content/80">
            <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <ParameterBadge field="country" value={country} onParameterSearch={onParameterSearch} />
                    {year && <ParameterBadge field="year" value={String(year)} onParameterSearch={onParameterSearch} />}
                    <ParameterBadge field="category" value={category} displayValue={CATEGORY_TRANSLATIONS[category] || category} onParameterSearch={onParameterSearch} />
                    {material && MATERIAL_TRANSLATIONS[material] && <ParameterBadge field="material" value={material} displayValue={MATERIAL_TRANSLATIONS[material]} onParameterSearch={onParameterSearch} />}
                    {mint && <ParameterBadge field="mint" value={mint} onParameterSearch={onParameterSearch} />}
                </div>
            </div>
            {profiles?.handle && profiles?.avatar_url && !isOwner && (
                <button
                    onClick={handleProfileClick}
                    className="flex items-center gap-1.5 flex-shrink-0 focus:outline-none group/profile rounded-full py-1 px-1 -mr-1 hover:bg-base-100/50 transition-colors"
                    aria-label={`Перейти к профилю ${profiles.handle}`}
                >
                    <img src={profiles.avatar_url} alt={`Аватар ${profiles.handle}`} className="w-5 h-5 rounded-full object-cover transition-all" />
                    <span className="font-medium truncate group-hover/profile:text-primary transition-colors pr-1">@{profiles.handle}</span>
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default ItemCard;