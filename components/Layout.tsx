import React from 'react';
import { Page, Theme, Notification } from '../types';
import Header from './Header';
import PlusIcon from './icons/PlusIcon';

interface LayoutProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  theme: Theme;
  toggleTheme: () => void;
  children: React.ReactNode;
  unreadMessageCount: number;
  notifications: Notification[];
  unreadNotificationsCount: number;
  markNotificationsAsRead: () => void;
  onNotificationClick: (itemId: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ 
    currentPage, 
    setCurrentPage, 
    theme, 
    toggleTheme, 
    children, 
    unreadMessageCount,
    notifications,
    unreadNotificationsCount,
    markNotificationsAsRead,
    onNotificationClick
}) => {
  return (
    <div className="min-h-screen bg-base-100 text-base-content font-sans">
      <Header 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage}
        theme={theme}
        toggleTheme={toggleTheme}
        unreadMessageCount={unreadMessageCount}
        notifications={notifications}
        unreadNotificationsCount={unreadNotificationsCount}
        markNotificationsAsRead={markNotificationsAsRead}
        onNotificationClick={onNotificationClick}
      />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-24">
        {children}
      </main>
    </div>
  );
};

export default Layout;