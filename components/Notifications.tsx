import React, { useRef, useEffect } from 'react';
import { Notification } from '../types';
import ImageIcon from './icons/ImageIcon';
import BellIcon from './icons/BellIcon';

interface NotificationsProps {
  notifications: Notification[];
  onClose: () => void;
  onNotificationClick: (itemId: string) => void;
}

const Notifications: React.FC<NotificationsProps> = ({ notifications, onClose, onNotificationClick }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement;
        // Check if the click was on the bell icon itself to prevent immediate closing
        if (!target.closest('button[aria-label="Открыть уведомления"]')) {
           onClose();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  return (
    <div ref={dropdownRef} className="absolute top-14 right-0 w-80 sm:w-96 bg-base-200 rounded-2xl shadow-2xl border border-base-300 z-30 overflow-hidden flex flex-col">
      <div className="p-4 border-b border-base-300">
        <h3 className="font-bold text-lg">Уведомления</h3>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-8 text-base-content/60">
            <BellIcon className="w-16 h-16 mb-4" />
            <p className="font-semibold">Пока нет уведомлений</p>
            <p className="text-sm">Здесь будут появляться совпадения по вишлисту.</p>
          </div>
        ) : (
          <ul className="divide-y divide-base-300">
            {notifications.map(n => (
              <li key={n.id} onClick={() => onNotificationClick(n.collectible_id)} className="p-4 hover:bg-base-300 cursor-pointer transition-colors">
                <div className="flex gap-4">
                  <img src={n.profiles?.avatar_url || `https://i.pravatar.cc/150?u=${n.sender_id}`} alt={n.profiles?.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-bold">{n.profiles?.handle || 'Кто-то'}</span> добавил предмет, который совпадает с вашим вишлистом: <span className="font-semibold text-primary">{n.wantlist_item_name}</span>
                    </p>
                    <p className="text-xs text-base-content/60 mt-1">{new Date(n.created_at).toLocaleString('ru-RU')}</p>
                  </div>
                  <div className="w-12 h-12 bg-base-100 rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {n.collectibles?.image_url ? (
                          <img src={n.collectibles.image_url} alt={n.collectibles.name} className="w-full h-full object-cover" />
                      ) : (
                          <ImageIcon className="w-6 h-6 text-base-content/20" />
                      )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Notifications;
