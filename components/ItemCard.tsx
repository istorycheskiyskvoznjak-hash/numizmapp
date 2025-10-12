
import React from 'react';
import { Collectible } from '../types';
import ImageIcon from './icons/ImageIcon';
import SearchIcon from './icons/SearchIcon';
import BookmarkIcon from './icons/BookmarkIcon';
import BookmarkSolidIcon from './icons/BookmarkSolidIcon';
import MapPinIcon from './icons/MapPinIcon';
import CalendarDaysIcon from './icons/CalendarDaysIcon';
import TagIcon from './icons/TagIcon';
import CubeTransparentIcon from './icons/CubeTransparentIcon';
import BuildingLibraryIcon from './icons/BuildingLibraryIcon';
import ExclamationCircleIcon from './icons/ExclamationCircleIcon';


interface ItemCardProps {
  item: Collectible;
  onItemClick: (item: Collectible) => void;
  onCheckWantlist?: (item: Collectible) => void;
  isNew?: boolean;
  onViewProfile?: () => void;
  isOwner?: boolean;
  onParameterSearch?: (field: string, value: any, displayValue?: string) => void;
  isSaved?: boolean;
  onSave?: (itemId: string, isCurrentlySaved: boolean) => void;
  isWantlistMatch?: boolean;
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

const RarityBar: React.FC<{ rarity: 'R1' | 'R2' | 'R3' | 'R4' | 'R5' }> = ({ rarity }) => {
    const level = parseInt(rarity.substring(1));
    const colors = ['bg-yellow-400', 'bg-amber-400', 'bg-orange-500', 'bg-red-500', 'bg-red-600'];
    return (
        <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full border border-white/20" title="Редкость">
            <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={`w-1.5 h-3 rounded-full ${i < level ? colors[i] : 'bg-white/30'}`}></div>
                ))}
            </div>
            <span className="text-xs font-bold text-white/80">{rarity}</span>
        </div>
    );
};

const GradeDisplay: React.FC<{ currentGrade?: 'UNC' | 'XF' | 'VF' | 'F' | null }> = ({ currentGrade }) => {
    const GRADES: ('UNC' | 'XF' | 'VF' | 'F')[] = ['UNC', 'XF', 'VF', 'F'];
    return (
        <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm p-1 rounded-full border border-white/20">
            {GRADES.map(grade => (
                <span 
                    key={grade}
                    className={`px-2 py-0.5 text-xs font-bold rounded-md transition-all ${
                        currentGrade === grade 
                        ? 'bg-red-500 text-white shadow-lg' 
                        : 'text-white/40'
                    }`}
                >
                    {grade}
                </span>
            ))}
        </div>
    );
};


// New component for the wantlist match badge
const WantlistMatchBadge: React.FC = () => (
    <div className="flex items-center justify-center bg-primary text-primary-content w-7 h-7 rounded-full border border-primary-focus shadow-lg" title="Совпадает с вашим вишлистом!">
        <ExclamationCircleIcon className="w-5 h-5" />
    </div>
);

const ParameterRow: React.FC<{
    icon: React.ReactNode;
    label: string;
    field: string;
    value: any;
    displayValue?: string;
    onParameterSearch?: (field: string, value: any, displayValue?: string) => void;
}> = ({ icon, label, field, value, displayValue, onParameterSearch }) => {
    const content = (
        <>
            <div className="flex-shrink-0 w-5 h-5 text-base-content/50">{icon}</div>
            <span className="text-sm font-semibold text-base-content/70 w-20 flex-shrink-0">{label}:</span>
            <span className="text-sm font-medium text-base-content truncate">{displayValue || value}</span>
        </>
    );

    if (onParameterSearch) {
        return (
            <button
                onClick={(e) => { e.stopPropagation(); onParameterSearch(field, value, displayValue || value); }}
                className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-base-300 transition-colors text-left"
                title={`Искать по "${displayValue || value}"`}
            >
                {content}
            </button>
        );
    }
    return <div className="w-full flex items-center gap-3 px-2 py-1.5">{content}</div>;
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
    onSave,
    isWantlistMatch,
}) => {
  const { name, country, year, category, image_url, profiles, grade, rarity, material, mint } = item;

  const handleActionClick = (handler?: (e: React.MouseEvent) => void) => (e: React.MouseEvent) => {
      e.stopPropagation();
      handler?.(e);
  };
  
  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewProfile?.();
  };
  
  return (
    <div 
      className="group flex flex-col rounded-2xl overflow-hidden bg-base-200 shadow-md hover:shadow-xl focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-base-100 transition-all duration-300 cursor-pointer"
      onClick={() => onItemClick(item)}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onItemClick(item)}
    >
      {/* Media Container */}
      <div className="relative aspect-square w-full overflow-hidden">
        {image_url ? (
            <img src={image_url} alt={name} className="absolute h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
            <div className="flex items-center justify-center h-full w-full bg-base-300">
                <ImageIcon className="w-16 h-16 text-base-content/20" />
            </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black to-transparent pointer-events-none"></div>
        
        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex justify-between items-start gap-1.5">
            <div className="flex flex-col items-start gap-1.5">
                {grade && <GradeDisplay currentGrade={grade} />}
                {rarity && <RarityBar rarity={rarity} />}
            </div>
            <div className="flex flex-col items-end gap-1.5">
                 {isNew && (
                    <div title="Новый предмет">
                        <div className="relative w-4 h-4">
                            <div className="absolute inset-0 bg-green-400 rounded-full animate-ping"></div>
                            <div className="relative w-full h-full rounded-full bg-green-500 border-2 border-white/50 shadow-lg"></div>
                        </div>
                    </div>
                )}
                {isWantlistMatch && !isOwner && <WantlistMatchBadge />}
            </div>
        </div>
        
        {/* Title Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="font-semibold text-xl text-white truncate drop-shadow-md">{name}</h3>
        </div>
      </div>
      
      {/* Info Container */}
      <div className="flex-grow flex flex-col p-3 space-y-3">
        {/* Catalog data */}
        <div className="bg-base-100 rounded-lg divide-y divide-base-300/50 border border-base-300/50">
            <ParameterRow icon={<MapPinIcon />} label="Страна" field="country" value={country} onParameterSearch={onParameterSearch} />
            {year && <ParameterRow icon={<CalendarDaysIcon />} label="Год" field="year" value={String(year)} onParameterSearch={onParameterSearch} />}
            <ParameterRow icon={<TagIcon />} label="Тип" field="category" value={category} displayValue={CATEGORY_TRANSLATIONS[category] || category} onParameterSearch={onParameterSearch} />
            {material && MATERIAL_TRANSLATIONS[material] && <ParameterRow icon={<CubeTransparentIcon />} label="Материал" field="material" value={material} displayValue={MATERIAL_TRANSLATIONS[material]} onParameterSearch={onParameterSearch} />}
            {mint && <ParameterRow icon={<BuildingLibraryIcon />} label="Двор" field="mint" value={mint} onParameterSearch={onParameterSearch} />}
        </div>
        
        {/* Footer */}
        <div className="border-t border-base-content/10 pt-2 flex items-center justify-between gap-2">
             {profiles?.handle && profiles?.avatar_url && !isOwner ? (
                <button
                    onClick={handleProfileClick}
                    className="flex items-center gap-1.5 min-w-0 group/profile rounded-full py-1 pr-2 hover:bg-base-100/50 transition-colors"
                    aria-label={`Перейти к профилю ${profiles.handle}`}
                >
                    <img src={profiles.avatar_url} alt={`Аватар ${profiles.handle}`} className="w-6 h-6 rounded-full object-cover transition-all" />
                    <span className="text-sm font-medium truncate group-hover/profile:text-primary transition-colors">@{profiles.handle}</span>
                </button>
            ) : isOwner ? (
                <div className="text-sm font-semibold italic text-base-content/60 px-1">Это из вашей коллекции</div>
            ) : <div></div> /* Empty div to maintain layout */}

            <div className="flex items-center gap-1.5">
                {isOwner && onCheckWantlist && (
                    <button 
                        onClick={handleActionClick(() => onCheckWantlist(item))}
                        className="p-2 rounded-full text-base-content/70 hover:bg-base-300 hover:text-primary transition-colors"
                        title="Искать совпадения в вишлистах"
                    >
                        <SearchIcon className="w-5 h-5" />
                    </button>
                )}
                {!isOwner && onSave && (
                    <button
                        onClick={handleActionClick(() => onSave(item.id, !!isSaved))}
                        className={`p-2 rounded-full transition-colors ${isSaved ? 'text-primary hover:bg-primary/10' : 'text-base-content/70 hover:bg-base-300 hover:text-primary'}`}
                        title={isSaved ? "Удалить из избранного" : "Сохранить в избранное"}
                    >
                        {isSaved ? <BookmarkSolidIcon className="w-5 h-5" /> : <BookmarkIcon className="w-5 h-5" />}
                    </button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ItemCard;
