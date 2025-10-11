import React from 'react';
import SpinnerIcon from './icons/SpinnerIcon';
import ArrowDownIcon from './icons/ArrowDownIcon';

interface LoadMoreButtonProps {
  onClick: () => void;
  loading: boolean;
  children: React.ReactNode;
  className?: string;
}

const LoadMoreButton: React.FC<LoadMoreButtonProps> = ({ onClick, loading, children, className }) => {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`bg-primary text-primary-content hover:bg-primary-focus font-semibold py-2 px-6 rounded-full text-sm transition-colors shadow-md w-full sm:w-auto disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-primary-focus focus-visible:ring-offset-2 focus-visible:ring-offset-base-100 ${className}`}
    >
      {loading ? (
        <>
          <SpinnerIcon className="w-5 h-5 animate-spin" />
          <span>Загрузка...</span>
        </>
      ) : (
        <>
          <ArrowDownIcon className="w-5 h-5" />
          <span>{children}</span>
        </>
      )}
    </button>
  );
};

export default LoadMoreButton;