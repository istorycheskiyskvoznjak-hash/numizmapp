
import React, { useEffect } from 'react';
import UserCircleIcon from './icons/UserCircleIcon';

interface LoginPromptModalProps {
  onClose: () => void;
  onLogin: () => void;
}

const LoginPromptModal: React.FC<LoginPromptModalProps> = ({ onClose, onLogin }) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-base-200 rounded-2xl w-full max-w-md p-8 relative shadow-2xl flex flex-col items-center text-center" 
        onClick={e => e.stopPropagation()}
      >
        <div className="w-16 h-16 bg-primary/20 text-primary rounded-full flex items-center justify-center mb-4">
          <UserCircleIcon className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold">Требуется авторизация</h2>
        <p className="text-base-content/70 mt-2">
          Чтобы взаимодействовать с коллекциями, общаться с пользователями и использовать все возможности Numizmapp, пожалуйста, войдите или зарегистрируйтесь.
        </p>
        <div className="mt-6 flex items-center gap-4 w-full">
            <button
              onClick={onClose}
              className="w-full px-6 py-2 rounded-full text-sm font-medium bg-base-300 hover:bg-base-content/20 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Позже
            </button>
            <button 
              onClick={onLogin} 
              className="w-full px-6 py-2 rounded-full text-sm font-bold text-black bg-primary motion-safe:hover:scale-105 transition-transform disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-primary-focus"
            >
              Войти
            </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPromptModal;
