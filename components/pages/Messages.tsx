
import React from 'react';
import { MOCK_MESSAGES } from '../../constants';
import { MessageThread } from '../../types';

const MessageThreadCard: React.FC<{ thread: MessageThread }> = ({ thread }) => (
    <div className="bg-base-200 p-4 rounded-xl flex justify-between items-center">
        <div className="flex items-center space-x-4">
            <img src={thread.user.avatarUrl} alt={thread.user.name} className="w-12 h-12 rounded-full object-cover" />
            <div>
                <p className="font-bold">{thread.user.name} <span className="font-normal text-base-content/60">@{thread.user.handle}</span></p>
                <p className="text-sm text-base-content/80 mt-1">{thread.lastMessage}</p>
            </div>
        </div>
        <button className="bg-base-300 hover:bg-secondary text-base-content font-semibold py-2 px-4 rounded-full text-sm transition-colors">
            Открыть
        </button>
    </div>
);

const Messages: React.FC = () => {
  return (
    <div>
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Сообщения</h1>
        </div>
        <div className="space-y-4">
            {MOCK_MESSAGES.map(thread => <MessageThreadCard key={thread.id} thread={thread} />)}
        </div>
    </div>
  );
};

export default Messages;