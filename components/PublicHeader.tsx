import React from 'react';
import { Theme } from '../types';
import LogoIcon from './icons/LogoIcon';
import SunIcon from './icons/SunIcon';
import MoonIcon from './icons/MoonIcon';
import InstallIcon from './icons/InstallIcon';

interface PublicHeaderProps {
  theme: Theme;
  toggleTheme: () => void;
  onLoginClick?: () => void;
  showInstallButton: boolean;
  onInstallClick: () => void;
}

const PublicHeader: React.FC<PublicHeaderProps> = ({ 
    theme, 
    toggleTheme, 
    onLoginClick,
    showInstallButton,
    onInstallClick 
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 bg-base-100/80 backdrop-blur-md z-20 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <LogoIcon className="h-8 w-8 text-primary" />
            <span className="font-bold text-xl">Numizmapp</span>
          </div>

          <div className="flex items-center space-x-2">
            {showInstallButton && (
                <button
                    onClick={onInstallClick}
                    title="Установить приложение"
                    className="flex items-center justify-center shrink-0 w-10 h-10 md:w-auto md:px-4 rounded-full bg-primary text-primary-content font-semibold text-sm hover:bg-primary-focus transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary-focus focus-visible:ring-offset-2 focus-visible:ring-offset-base-100"
                >
                    <InstallIcon className="w-5 h-5 md:w-4 md:h-4"/>
                    <span className="hidden md:inline ml-2">Установить</span>
                </button>
            )}
            {onLoginClick && (
              <button
                onClick={onLoginClick}
                className="px-4 py-2 rounded-full text-sm font-bold bg-base-200 hover:bg-base-300 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-base-100"
              >
                Войти или Зарегистрироваться
              </button>
            )}
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

export default PublicHeader;