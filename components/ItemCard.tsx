
import React from 'react';
import { Collectible } from '../types';
import ImageIcon from './icons/ImageIcon';

interface ItemCardProps {
  item: Collectible;
  onItemClick: (item: Collectible) => void;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, onItemClick }) => {
  const truncate = (str: string, n: number) => {
    if (!str) return '';
    return str.length > n ? str.substr(0, n - 1) + '…' : str;
  };

  return (
    <div 
      className="bg-base-200 rounded-xl overflow-hidden cursor-pointer group transition-all duration-300 hover:shadow-2xl hover:scale-105"
      onClick={() => onItemClick(item)}
    >
      <div className="relative aspect-[2/3] w-full bg-base-300">
        {item.image_url ? (
            <img src={item.image_url} alt={item.name} className="absolute h-full w-full object-cover" />
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
  );
};

export default ItemCard;