import React from 'react';
import PlusIcon from './icons/PlusIcon';
import CameraIcon from './icons/CameraIcon';
import SparklesIcon from './icons/SparklesIcon';

interface AddItemChoiceModalProps {
  onClose: () => void;
  onSelectSingle: () => void;
  onSelectBulk: () => void;
}

const ChoiceButton: React.FC<{
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}> = ({ onClick, icon, title, description }) => (
  <button
    onClick={onClick}
    className="w-full flex items-start text-left p-4 rounded-xl bg-base-100 hover:bg-base-300 transition-all border border-base-300/50 hover:border-primary/50"
  >
    <div className="w-12 h-12 flex-shrink-0 bg-primary/20 text-primary rounded-lg flex items-center justify-center mr-4">
      {icon}
    </div>
    <div>
      <h3 className="font-bold text-lg">{title}</h3>
      <p className="text-sm text-base-content/80">{description}</p>
    </div>
  </button>
);

const AddItemChoiceModal: React.FC<AddItemChoiceModalProps> = ({ onClose, onSelectSingle, onSelectBulk }) => {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-base-200 rounded-2xl w-full max-w-lg p-8 relative shadow-2xl space-y-6"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-center">Как вы хотите добавить предмет?</h2>
        <ChoiceButton 
          onClick={onSelectSingle}
          icon={<PlusIcon className="w-7 h-7" />}
          title="Добавить один предмет"
          description="Заполните форму вручную для одного предмета коллекционирования."
        />
        <ChoiceButton 
          onClick={onSelectBulk}
          icon={
            <div className="relative w-7 h-7">
              <CameraIcon className="w-7 h-7" />
              <SparklesIcon className="absolute -bottom-1 -right-1 w-4 h-4 text-yellow-400" />
            </div>
          }
          title="Сканировать несколько с ИИ"
          description="Сфотографируйте несколько предметов, и ИИ определит их."
        />
      </div>
    </div>
  );
};

export default AddItemChoiceModal;
