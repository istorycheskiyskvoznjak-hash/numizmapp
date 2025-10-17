import React from 'react';
import { Page, Theme } from '../types';
import Header from './Header';
import BottomNavBar from './BottomNavBar';

interface LayoutProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  theme: Theme;
  toggleTheme: () => void;
  children: React.ReactNode;
  unreadMessageCount: number;
  onSearchOpen: () => void;
  onOpenAddItemModal: (initialAlbumId?: string | null) => void;
}

const Layout: React.FC<LayoutProps> = ({ 
    currentPage, 
    setCurrentPage, 
    theme, 
    toggleTheme, 
    children, 
    unreadMessageCount,
    onSearchOpen,
    onOpenAddItemModal
}) => {
  return (
    <div className="min-h-screen bg-base-100 text-base-content font-sans">
      <Header 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage}
        theme={theme}
        toggleTheme={toggleTheme}
        unreadMessageCount={unreadMessageCount}
        onSearchOpen={onSearchOpen}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-24">
        {children}
      </main>
      <BottomNavBar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        unreadMessageCount={unreadMessageCount}
        onOpenAddItemModal={onOpenAddItemModal}
      />
    </div>
  );
};

export default Layout;