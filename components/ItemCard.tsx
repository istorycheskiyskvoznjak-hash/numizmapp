
import React from 'react';
import { Collectible } from '../types';
import ImageIcon from './icons/ImageIcon';
import SearchIcon from './icons/SearchIcon';

interface ItemCardProps {
  item: Collectible;
  onItemClick: (item: Collectible) => void;
  onCheckWantlist?: (item: Collectible) => void;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, onItemClick, onCheckWantlist }) => {
  const truncate = (str: string, n: number) => {
    if (!str) return '';
    return str.length > n ? str.substr(0, n - 1) + '…' : str;
  };

  return (
    <div 
      className="bg-base-200 rounded-xl overflow-hidden group transition-all duration-300 flex flex-col"
    >
      <div 
        onClick={() => onItemClick(item)}
        className="cursor-pointer"
      >
        <div className="relative aspect-[2/3] w-full bg-base-300">
          {item.image_url ? (
              <img src={item.image_url} alt={item.name} className="absolute h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
              <div className="flex items-center justify-center h-full w-full">
                  <ImageIcon className="w-16 h-16 text-base-content/20" />
              </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
          <div className="absolute top-2 right-2 flex items-center p-1.5 bg-black/30 backdrop-blur-sm rounded-md text-white text-xs">
            {item.name?.substring(0, item.name.indexOf(' '))}
          </div>
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h3 className="font-bold text-lg leading-tight">{truncate(item.name, 40)}</h3>
          </div>
        </div>
        <div className="p-4">
          <div className="flex justify-between items-center text-sm text-base-content/70">
            <span>{item.country}</span>
            <span className="font-mono">{item.year}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="inline-block bg-base-300 rounded-full px-3 py-1 font-semibold">{item.category}</span>
            <span className="text-base-content/50">от @{item.profiles?.handle || '...'}</span>
          </div>
        </div>
      </div>
      {onCheckWantlist && (
        <div className="px-4 pb-4 mt-auto">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCheckWantlist(item);
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-base-300 hover:bg-secondary transition-colors"
          >
            <SearchIcon className="w-4 h-4" />
            <span>Найти в вишлистах</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ItemCard;