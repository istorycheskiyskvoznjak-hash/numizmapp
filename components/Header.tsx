import React from 'react';
import { Page, Theme } from '../types';
import LogoIcon from './icons/LogoIcon';
import { supabase } from '../supabaseClient';

interface HeaderProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  theme: Theme;
  toggleTheme: () => void;
}

const pageTitles: Record<Page, string> = {
  Feed: 'Лента',
  Collection: 'Коллекция',
  Wantlist: 'Вишлист',
  Messages: 'Сообщения',
  Profile: 'Профиль',
};

const NavLink: React.FC<{
  page: Page;
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  children: React.ReactNode;
}> = ({ page, currentPage, setCurrentPage, children }) => {
  const isActive = currentPage === page;
  return (
    <button
      onClick={() => setCurrentPage(page)}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
        isActive
          ? 'bg-base-300 text-base-content'
          : 'text-base-content/70 hover:bg-base-200'
      }`}
    >
      {children}
    </button>
  );
};

const Header: React.FC<HeaderProps> = ({ currentPage, setCurrentPage, theme, toggleTheme }) => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-base-100/80 backdrop-blur-md z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <LogoIcon className="h-8 w-8 text-primary" />
              <span className="font-bold text-xl">Numizmapp</span>
            </div>
            <nav className="hidden md:flex items-center bg-base-200 p-1 rounded-full">
              {(['Feed', 'Collection', 'Wantlist', 'Messages', 'Profile'] as Page[]).map(page => (
                <NavLink key={page} page={page} currentPage={currentPage} setCurrentPage={setCurrentPage}>
                  {pageTitles[page]}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
             <button onClick={handleLogout} className="hidden md:block px-4 py-2 rounded-full text-sm font-medium bg-base-200 hover:bg-base-300 transition-colors">
                Выйти
            </button>
            <button
              onClick={toggleTheme}
              className="px-4 py-2 rounded-full text-sm font-medium bg-base-200 hover:bg-base-300 transition-colors"
            >
              {theme === 'dark' ? 'Светлая тема' : 'Темная тема'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;