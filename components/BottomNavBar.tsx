import React from 'react';
import { Page } from '../types';
import FeedIcon from './icons/FeedIcon';
import RectangleGroupIcon from './icons/RectangleGroupIcon';
import HeartIcon from './icons/HeartIcon';
import MessagesIcon from './icons/MessagesIcon';
import UserCircleIcon from './icons/UserCircleIcon';
import PlusIcon from './icons/PlusIcon';

interface BottomNavBarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  unreadMessageCount: number;
  onOpenAddItemModal: (initialAlbumId?: string | null) => void;
}

const pageIcons: Record<Page, React.FC<React.SVGProps<SVGSVGElement>>> = {
  Feed: FeedIcon,
  SubscriptionFeed: FeedIcon,
  Collection: RectangleGroupIcon,
  Wantlist: HeartIcon,
  Messages: MessagesIcon,
  Profile: UserCircleIcon,
  PublicProfile: UserCircleIcon,
  PublicWantlist: HeartIcon,
};

const pageTitles: Record<Page, string> = {
    Feed: 'Лента',
    SubscriptionFeed: 'Лента',
    Collection: 'Коллекция',
    Wantlist: 'Вишлисты',
    Messages: 'Сообщения',
    Profile: 'Профиль',
    PublicProfile: 'Профиль',
    PublicWantlist: 'Вишлисты',
  };

const NavLink: React.FC<{
  page: Page;
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  unreadCount?: number;
}> = ({ page, currentPage, setCurrentPage, unreadCount }) => {
  const isActive = currentPage === page || (page === 'Feed' && currentPage === 'SubscriptionFeed');
  const Icon = pageIcons[page];
  
  return (
    <button
      onClick={() => setCurrentPage(page)}
      className={`flex flex-col items-center justify-center gap-1 w-full pt-2 pb-1 text-xs transition-colors duration-200 outline-none focus-visible:bg-base-300 rounded-md ${
        isActive ? 'text-primary' : 'text-base-content/70 hover:text-primary'
      }`}
      aria-label={pageTitles[page]}
    >
        <div className="relative">
            <Icon className="w-6 h-6" />
            {unreadCount && unreadCount > 0 && (
                <span className="absolute -top-1 -right-2 inline-flex items-center justify-center h-4 min-w-[1rem] px-1 text-center whitespace-nowrap align-middle font-bold bg-primary text-primary-content rounded-full text-[10px] shadow-sm">
                    {unreadCount > 9 ? '9+' : unreadCount}
                </span>
            )}
        </div>
      <span className={isActive ? 'font-bold' : ''}>{pageTitles[page]}</span>
    </button>
  );
};

const BottomNavBar: React.FC<BottomNavBarProps> = ({ currentPage, setCurrentPage, unreadMessageCount, onOpenAddItemModal }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-base-100/80 backdrop-blur-md z-20 border-t border-base-content/10 md:hidden">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 flex items-center justify-around h-16">
        <div className="flex justify-around w-full">
          {(['Feed', 'Collection'] as Page[]).map(page => (
            <NavLink
              key={page}
              page={page}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
            />
          ))}
        </div>

        <div className="flex-shrink-0 -mt-8">
          <button
            onClick={() => onOpenAddItemModal()}
            className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-content shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-focus focus:ring-offset-4 focus:ring-offset-base-100 transform transition-transform hover:scale-110"
            aria-label="Добавить предмет"
          >
            <PlusIcon className="w-8 h-8" />
          </button>
        </div>

        <div className="flex justify-around w-full">
          {(['Messages', 'Profile'] as Page[]).map(page => (
            <NavLink
              key={page}
              page={page}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              unreadCount={page === 'Messages' ? unreadMessageCount : undefined}
            />
          ))}
        </div>
      </div>
    </nav>
  );
};

export default BottomNavBar;