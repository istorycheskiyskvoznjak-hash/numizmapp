import React from 'react';
import { Page, Theme } from '../types';
import Header from './Header';
import PlusIcon from './icons/PlusIcon';

interface LayoutProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  theme: Theme;
  toggleTheme: () => void;
  children: React.ReactNode;
  onAddItemClick: () => void;
}

const Layout: React.FC<LayoutProps> = ({ currentPage, setCurrentPage, theme, toggleTheme, children, onAddItemClick }) => {
  return (
    <div className="min-h-screen bg-base-100 text-base-content font-sans">
      <Header 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage}
        theme={theme}
        toggleTheme={toggleTheme}
      />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-24">
        {children}
      </main>
      <div className="fixed bottom-8 right-8">
        <button 
          onClick={onAddItemClick}
          className="bg-primary hover:scale-110 text-black font-semibold py-3 px-5 rounded-full shadow-lg transition-transform duration-200 flex items-center gap-2"
          aria-label="Добавить новый предмет"
        >
            <PlusIcon className="w-5 h-5" />
            <span>Добавить</span>
        </button>
      </div>
    </div>
  );
};

export default Layout;