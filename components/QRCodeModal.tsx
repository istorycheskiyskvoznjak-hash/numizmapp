

import React, { useEffect, useState } from 'react';
import { Profile } from '../types';
import XCircleIcon from './icons/XCircleIcon';
import CopyIcon from './icons/CopyIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';

interface QRCodeModalProps {
  profile: Profile;
  onClose: () => void;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ profile, onClose }) => {
  const [isCopied, setIsCopied] = useState(false);
  const profileUrl = `${window.location.origin}?profileId=${profile.handle}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
    profileUrl
  )}&size=256x256&bgcolor=1A1F29&color=DCE0E8&qzone=1`;

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

  const handleCopy = () => {
    navigator.clipboard.writeText(profileUrl).then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-base-200 rounded-2xl w-full max-w-sm p-8 relative shadow-2xl flex flex-col items-center text-center" 
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-base-content/50 hover:text-base-content outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full">
            <XCircleIcon className="w-7 h-7" />
        </button>
        <img 
            src={profile.avatar_url} 
            alt={profile.name || ''}
            className="w-20 h-20 rounded-full object-cover border-4 border-base-300" 
        />
        <h2 className="text-2xl font-bold mt-4">{profile.name}</h2>
        <p className="text-base-content/70">@{profile.handle}</p>

        <div className="bg-base-100 p-4 rounded-lg mt-6">
            <img src={qrCodeUrl} alt="QR Code for profile" width="256" height="256" />
        </div>
        <p className="text-xs text-base-content/60 mt-4">
            Отсканируйте код, чтобы поделиться этим профилем
        </p>
        <div className="mt-2 w-full relative cursor-pointer" onClick={handleCopy}>
            <input
                type="text"
                readOnly
                value={profileUrl}
                className="w-full bg-base-300 text-center text-xs p-2 pr-10 rounded-md border border-base-100 focus:outline-none cursor-pointer"
                onFocus={(e) => e.target.select()}
                aria-label="Ссылка на профиль"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-base-content/60 pointer-events-none">
                {isCopied ? <CheckCircleIcon className="w-5 h-5 text-emerald-500" /> : <CopyIcon className="w-5 h-5" />}
            </div>
        </div>
        <div className="h-4 mt-1">
            {isCopied && <p className="text-xs text-emerald-500">Ссылка скопирована!</p>}
        </div>
      </div>
    </div>
  );
};

export default QRCodeModal;