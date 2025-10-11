import React from 'react';
import { Page, Theme } from '../types';
import LogoIcon from './icons/LogoIcon';
import { supabase } from '../supabaseClient';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';
import LogoutIcon from './icons/LogoutIcon';
import FeedIcon from './icons/FeedIcon';
import RectangleGroupIcon from './icons/RectangleGroupIcon';
import HeartIcon from './icons/HeartIcon';
import MessagesIcon from './icons/MessagesIcon';
import UserCircleIcon from './icons/UserCircleIcon';
import SearchIcon from './icons/SearchIcon';
import CommandIcon from './icons/CommandIcon';

interface HeaderProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  theme: Theme;
  toggleTheme: () => void;
  unreadMessageCount: number;
  onSearchOpen: () => void;
}

const pageTitles: Record<Page, string> = {
  Feed: 'Лента',
  SubscriptionFeed: 'Лента',
  Collection: 'Коллекция',
  Wantlist: 'Вишлист',
  Messages: 'Сообщения',
  Profile: 'Профиль',
  PublicProfile: 'Профиль',
};

const pageIcons: Record<Page, React.FC<React.SVGProps<SVGSVGElement>>> = {
  Feed: FeedIcon,
  SubscriptionFeed: FeedIcon,
  Collection: RectangleGroupIcon,
  Wantlist: HeartIcon,
  Messages: MessagesIcon,
  Profile: UserCircleIcon,
  PublicProfile: UserCircleIcon,
};


const NavLink: React.FC<{
  page: Page;
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  children: React.ReactNode;
}> = ({ page, currentPage, setCurrentPage, children }) => {
  const isActive = currentPage === page || (page === 'Feed' && currentPage === 'SubscriptionFeed');
  const Icon = pageIcons[page];
  return (
    <button
      onClick={() => setCurrentPage(page)}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-200 ${
        isActive
          ? 'bg-primary text-primary-content font-bold shadow'
          : 'text-base-content/70 hover:bg-base-300'
      }`}
    >
      <Icon className="w-5 h-5" />
      {children}
    </button>
  );
};

const Header: React.FC<HeaderProps> = ({ 
    currentPage, 
    setCurrentPage, 
    theme, 
    toggleTheme, 
    unreadMessageCount,
    onSearchOpen,
}) => {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-base-100/80 backdrop-blur-md z-20 shadow-sm">
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
                  {page === 'Messages' && unreadMessageCount > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1.5 leading-none text-center whitespace-nowrap align-middle font-bold bg-primary text-primary-content rounded-full text-xs shadow-sm">
                        {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-2">
             <button onClick={onSearchOpen} className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-base-200 hover:bg-base-300 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100">
                <SearchIcon className="w-4 h-4" />
                <span>Поиск</span>
                <div className="flex items-center gap-1 text-xs bg-base-300/80 px-1.5 py-0.5 rounded">
                    <CommandIcon className="w-3 h-3" /> K
                </div>
            </button>
             <button onClick={handleLogout} className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-base-200 hover:bg-base-300 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100">
                <LogoutIcon className="w-4 h-4" />
                <span>Выйти</span>
            </button>
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-base-200 hover:bg-base-300 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100"
              aria-label={theme === 'dark' ? 'Активировать светлую тему' : 'Активировать темную тему'}
            >
              {theme === 'dark' ? <SunIcon className="w-5 h-5"/> : <MoonIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;