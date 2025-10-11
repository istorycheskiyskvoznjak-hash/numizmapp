
import React from 'react';
import Skeleton from './Skeleton';

const ItemCardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col rounded-2xl overflow-hidden bg-base-200 shadow-md">
      {/* Media Skeleton */}
      <Skeleton className="aspect-square w-full" />
      
      {/* Meta Strip Skeleton */}
      <div className="px-3 py-2 bg-base-300">
        <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default ItemCardSkeleton;
