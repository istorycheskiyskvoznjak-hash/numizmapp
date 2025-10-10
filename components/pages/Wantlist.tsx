
import React from 'react';
import { MOCK_WANTLIST } from '../../constants';
import { WantlistItem } from '../../types';

const WantlistItemCard: React.FC<{ item: WantlistItem }> = ({ item }) => (
    <div className="bg-base-200 p-6 rounded-xl flex justify-between items-center">
        <div>
            <h2 className="font-bold text-xl">{item.name}</h2>
            <p className="text-sm text-base-content/70 mt-1">{item.details}</p>
            <p className="text-base-content/90 mt-2">{item.description}</p>
        </div>
        <button className="bg-base-300 hover:bg-secondary text-base-content font-semibold py-2 px-4 rounded-full text-sm transition-colors">
            Предложить предмет
        </button>
    </div>
);

const Wantlist: React.FC = () => {
  return (
    <div>
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Вишлист</h1>
            <button className="bg-base-200 hover:bg-base-300 font-semibold py-2 px-4 rounded-full text-sm">Добавить в вишлист</button>
        </div>
        <div className="space-y-4">
            {MOCK_WANTLIST.map(item => <WantlistItemCard key={item.id} item={item} />)}
        </div>
    </div>
  );
};

export default Wantlist;