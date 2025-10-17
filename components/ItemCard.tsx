import React from 'react';
import { Collectible } from '../types';
import ImageIcon from './icons/ImageIcon';
import BinocularsIcon from './icons/BinocularsIcon';
import BookmarkIcon from './icons/BookmarkIcon';
import BookmarkSolidIcon from './icons/BookmarkSolidIcon';
import MapPinIcon from './icons/MapPinIcon';
import CalendarDaysIcon from './icons/CalendarDaysIcon';
import TagIcon from './icons/TagIcon';
import CubeTransparentIcon from './icons/CubeTransparentIcon';
import BuildingLibraryIcon from './icons/BuildingLibraryIcon';
import CoinIcon from './icons/CoinIcon';
import StampIcon from './icons/StampIcon';
import BanknoteIcon from './icons/BanknoteIcon';
import WantlistMatchIcon from './icons/WantlistMatchIcon';
import CountryDisplay from './CountryDisplay';
import CircleStackIcon from './icons/CircleStackIcon';
import CurrencyRubleIcon from './icons/CurrencyRubleIcon';
import PiggyBankIcon from './icons/PiggyBankIcon';

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
  stretch?: boolean;
  size?: 'small';
}

const CATEGORY_TRANSLATIONS: Record<string, string> = {
  coin: 'Монета',
  stamp: 'Марка',
  banknote: 'Банкнота',
};

const CATEGORY_ICONS: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  coin: CoinIcon,
  stamp: StampIcon,
  banknote: BanknoteIcon,
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

type RarityValue = 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'R6' | 'R7' | 'R8' | 'R9' | 'R10';

const RarityBar: React.FC<{ rarity: RarityValue }> = ({ rarity }) => {
    const level = parseInt(rarity.substring(1));
    const colors = [
        'bg-yellow-400',   // R1
        'bg-amber-500',    // R2
        'bg-orange-500',   // R3
        'bg-orange-600',   // R4
        'bg-red-500',      // R5
        'bg-red-600',      // R6
        'bg-red-700',      // R7
        'bg-red-800',      // R8
        'bg-red-900',      // R9
        'bg-red-900',      // R10
    ];

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
                {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className={`w-1.5 h-4 rounded-full ${i < level ? colors[i] : 'bg-base-content/20'}`}></div>
                ))}
            </div>
            <span className="text-sm font-bold text-base-content/80">{rarity}</span>
        </div>
    );
};

const ParameterRow: React.FC<{
    icon: React.ReactNode;
    label: string;
    field: string;
    value: any;
    displayValue?: string;
    valueIcon?: React.ReactNode;
    onParameterSearch?: (field: string, value: any, displayValue?: string) => void;
}> = ({ icon, label, field, value, displayValue, valueIcon, onParameterSearch }) => {
    const content = (
        <>
            <div className="flex items-center gap-2">
                <div className="flex-shrink-0 w-5 h-5 text-base-content/50">{icon}</div>
                <span className="text-sm font-semibold text-base-content/70">{label}:</span>
            </div>
            <div className="flex items-center justify-end gap-1.5 min-w-0">
                {valueIcon}
                <span className="text-sm font-medium text-base-content truncate text-right">{displayValue || value}</span>
            </div>
        </>
    );

    const containerClasses = "w-full grid grid-cols-[auto_1fr] items-center gap-x-2 px-2 py-1.5";

    if (onParameterSearch) {
        return (
            <button
                onClick={(e) => { e.stopPropagation(); onParameterSearch(field, value, displayValue || value); }}
                className={`${containerClasses} rounded-lg hover:bg-base-300 transition-colors text-left`}
                title={`Искать по "${displayValue || value}"`}
            >
                {content}
            </button>
        );
    }
    return <div className={containerClasses}>{content}</div>;
};

type Grade = 'UNC' | 'XF' | 'VF' | 'F';

const GradeDisplay: React.FC<{ currentGrade: Grade; size?: 'small' }> = ({ currentGrade, size }) => {
    const grades: Grade[] = ['UNC', 'XF', 'VF', 'F'];
    const paddingClass = size === 'small' ? 'px-1' : 'px-2';
    
    return (
        <div className="flex items-center text-xs font-bold bg-base-content/10 p-0.5 rounded-full">
            {grades.map(grade => {
                const isActive = currentGrade === grade;
                return (
                    <span 
                        key={grade}
                        className={`${paddingClass} py-0.5 rounded-full transition-all duration-200 ${isActive ? 'bg-primary text-primary-content shadow' : 'text-base-content/60'}`}
                    >
                        {grade}
                    </span>
                );
            })}
        </div>
    );
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
    stretch = false,
    size,
}) => {
  const { name, country, year, category, image_url, profiles, grade, rarity, material, mint, mintage, private_value, country_flag_override_url } = item;
  
  const handleActionClick = (handler?: (e: React.MouseEvent) => void) => (e: React.MouseEvent) => {
      e.stopPropagation();
      handler?.(e);
  };
  
  const handleProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewProfile?.();
  };
  
  const CategoryIcon = CATEGORY_ICONS[category] || TagIcon;

  return (
    <div 
      className="group flex flex-col rounded-2xl overflow-hidden bg-base-200 shadow-md hover:shadow-xl focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-base-100 transition-all duration-300 cursor-pointer h-full"
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
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none"></div>
        
        {/* Top Badges & Actions */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex justify-between items-start gap-1.5">
             <div className="flex flex-col items-start gap-1.5">
                {!isOwner && profiles?.handle && (
                    <button
                        onClick={handleProfileClick}
                        className="flex items-center gap-1.5 min-w-0 group/profile bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full border border-white/20"
                        aria-label={`Перейти к профилю ${profiles.handle}`}
                    >
                        <img src={profiles.avatar_url} alt={`Аватар ${profiles.handle}`} className="w-5 h-5 rounded-full object-cover border-2 border-white/30" />
                        <span className="text-sm font-medium text-white/90 truncate drop-shadow-sm group-hover/profile:underline">@{profiles.handle}</span>
                    </button>
                )}
                {isNew && (
                    <div title="Новый предмет" className="ml-1">
                        <div className="relative w-4 h-4">
                            <div className="absolute inset-0 bg-green-400 rounded-full animate-ping"></div>
                            <div className="relative w-full h-full rounded-full bg-green-500 border-2 border-white/50 shadow-lg"></div>
                        </div>
                    </div>
                )}
            </div>
             <div className="flex items-center gap-1.5">
                {!isOwner && onSave && (
                     <button
                        onClick={handleActionClick(() => onSave(item.id, !!isSaved))}
                        title={isSaved ? "Удалить из избранного" : "Сохранить в избранное"}
                        className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200
                          ${isSaved 
                            ? 'bg-primary text-primary-content shadow' 
                            : 'bg-black/40 backdrop-blur-sm border border-white/20 text-white/80 hover:bg-black/60 hover:text-white opacity-0 group-hover:opacity-100'
                          }`}
                    >
                        {isSaved ? <BookmarkSolidIcon className="w-5 h-5" /> : <BookmarkIcon className="w-5 h-5" />}
                    </button>
                )}
                 {!isOwner && isWantlistMatch && (
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-content shadow" title="Совпадение с вашим вишлистом!">
                        <WantlistMatchIcon className="w-5 h-5" />
                    </div>
                )}
            </div>
        </div>
        
        {/* Overlay Content */}
        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
          <h3 className="font-semibold text-lg truncate drop-shadow-md">{name}</h3>
        </div>
      </div>
      
      {/* Info Container */}
      <div className={`flex-grow flex flex-col p-3 ${!stretch && 'space-y-2'}`}>
        <div className={stretch ? 'flex-grow' : ''}>
            {/* Catalog data */}
            <div className={`bg-base-100 rounded-lg divide-y divide-base-300/50 border border-base-300/50 ${stretch ? 'mb-2' : ''}`}>
                {rarity && (
                    <div className="w-full grid grid-cols-[auto_1fr] items-center gap-x-2 px-2 py-1.5">
                        <div className="flex items-center">
                            <span className="text-sm font-semibold text-base-content/70">Редкость:</span>
                        </div>
                        <div className="flex items-center justify-end gap-1.5 min-w-0">
                            <RarityBar rarity={rarity as RarityValue} />
                        </div>
                    </div>
                )}
                {grade && (
                     <div className="w-full grid grid-cols-[auto_1fr] items-center gap-x-2 px-2 py-1.5">
                        <div className="flex items-center">
                            <span className="text-sm font-semibold text-base-content/70">Состояние:</span>
                        </div>
                        <div className="flex items-center justify-end min-w-0">
                            <GradeDisplay currentGrade={grade as Grade} size={size} />
                        </div>
                    </div>
                )}
                <ParameterRow 
                    icon={<TagIcon />} 
                    label="Тип" 
                    field="category" 
                    value={category} 
                    displayValue={CATEGORY_TRANSLATIONS[category] || category} 
                    onParameterSearch={onParameterSearch}
                    valueIcon={<CategoryIcon className="w-6 h-6 text-base-content/80 flex-shrink-0" />}
                />
                <ParameterRow 
                    icon={<MapPinIcon />} 
                    label="Страна" 
                    field="country" 
                    value={country} 
                    onParameterSearch={onParameterSearch} 
                    valueIcon={<CountryDisplay countryName={country} flagUrl={country_flag_override_url} />}
                />
                {year && <ParameterRow icon={<CalendarDaysIcon />} label="Год" field="year" value={String(year)} onParameterSearch={onParameterSearch} />}
                {material && MATERIAL_TRANSLATIONS[material] && <ParameterRow icon={<CubeTransparentIcon />} label="Материал" field="material" value={material} displayValue={MATERIAL_TRANSLATIONS[material]} onParameterSearch={onParameterSearch} />}
                {mint && <ParameterRow icon={<BuildingLibraryIcon />} label="Двор" field="mint" value={mint} onParameterSearch={onParameterSearch} />}
                {mintage != null && <ParameterRow icon={<CircleStackIcon />} label="Тираж" field="mintage" value={mintage.toLocaleString('ru-RU')} />}
                {isOwner && private_value != null && <ParameterRow icon={<PiggyBankIcon />} label="Личная оценка" field="private_value" value={`${private_value.toLocaleString('ru-RU')} €`} />}
            </div>
        </div>
        
        {/* Footer */}
        {isOwner && (
            <div className="border-t border-base-content/10 pt-2 flex items-center justify-between gap-2">
                {onCheckWantlist ? (
                    <button
                        onClick={handleActionClick(() => onCheckWantlist(item))}
                        className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-base-content/80 hover:text-primary transition-colors py-1.5 px-3 rounded-lg hover:bg-base-300"
                        title="Проверить спрос на этот предмет в вишлистах других пользователей"
                    >
                        <BinocularsIcon className="w-6 h-6" />
                        <span>Проверить спрос</span>
                    </button>
                ) : (
                    <div className="text-sm font-semibold italic text-base-content/60 px-1 w-full text-center">Это из вашей коллекции</div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default ItemCard;