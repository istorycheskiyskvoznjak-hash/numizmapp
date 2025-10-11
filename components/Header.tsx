import React, { useState } from 'react';
import { Page, Theme, Notification } from '../types';
import LogoIcon from './icons/LogoIcon';
import { supabase } from '../supabaseClient';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';
import LogoutIcon from './icons/LogoutIcon';
import BellIcon from './icons/BellIcon';
import Notifications from './Notifications';

interface HeaderProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  theme: Theme;
  toggleTheme: () => void;
  unreadMessageCount: number;
  notifications: Notification[];
  unreadNotificationsCount: number;
  markNotificationsAsRead: () => void;
  onNotificationClick: (itemId: string) => void;
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
      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 flex items-center ${
        isActive
          ? 'bg-base-300 text-base-content'
          : 'text-base-content/70 hover:bg-base-200'
      }`}
    >
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
    notifications,
    unreadNotificationsCount,
    markNotificationsAsRead,
    onNotificationClick
}) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };
  
  const handleToggleNotifications = () => {
    setIsNotificationsOpen(prev => {
        const newIsOpen = !prev;
        if (newIsOpen) {
            markNotificationsAsRead();
        }
        return newIsOpen;
    });
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-base-100/80 backdrop-blur-md z-20">
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
                    <span className="ml-2 inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1.5 leading-none text-center whitespace-nowrap align-middle font-bold bg-primary text-black rounded-full text-xs">
                        {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center space-x-2">
             <button onClick={handleLogout} className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-base-200 hover:bg-base-300 transition-colors">
                <LogoutIcon className="w-4 h-4" />
                <span>Выйти</span>
            </button>
            <div className="relative">
                 <button
                  onClick={handleToggleNotifications}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-base-200 hover:bg-base-300 transition-colors"
                  aria-label="Открыть уведомления"
                >
                  <BellIcon className="w-5 h-5" />
                   {unreadNotificationsCount > 0 && (
                    <span className="absolute top-1 right-1 inline-flex items-center justify-center h-4 w-4 text-xs font-bold text-white bg-red-500 rounded-full border-2 border-base-100">
                    </span>
                  )}
                </button>
                {isNotificationsOpen && (
                    <Notifications
                        notifications={notifications}
                        onClose={() => setIsNotificationsOpen(false)}
                        onNotificationClick={(itemId) => {
                            onNotificationClick(itemId);
                            setIsNotificationsOpen(false);
                        }}
                    />
                )}
            </div>
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-base-200 hover:bg-base-300 transition-colors"
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