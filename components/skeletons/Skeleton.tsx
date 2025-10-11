import React from 'react';

const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`bg-base-300/80 rounded-md animate-pulse ${className}`} />
);

export default Skeleton;
