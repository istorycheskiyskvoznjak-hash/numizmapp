import { WantlistItem, MessageThread } from './types';

export const MOCK_WANTLIST: WantlistItem[] = [
    {
        id: 1,
        name: 'Денарий Траяна',
        details: 'Римская империя, 98-117 гг. н.э.',
        description: 'Ищу монету в хорошем состоянии (VF и выше), с четким портретом и легендой. Готов рассмотреть разные варианты реверса.'
    },
    {
        id: 2,
        name: 'Марка "Голубой Маврикий"',
        details: 'Британская колония Маврикий, 1847 г.',
        description: 'Рассмотрю покупку или обмен на редкие марки Российской империи. Интересует как "Post Office", так и "Post Paid".'
    }
];

export const MOCK_MESSAGES: MessageThread[] = [
    {
        id: 1,
        user: {
            name: 'Алексей Петров',
            handle: 'alex_coins',
            avatarUrl: 'https://i.pravatar.cc/150?u=alex_coins'
        },
        lastMessage: 'Здравствуйте! У меня есть денарий Траяна, который может вас заинтересовать. Могу прислать фото?'
    },
    {
        id: 2,
        user: {
            name: 'Мария Иванова',
            handle: 'philatelist_maria',
            avatarUrl: 'https://i.pravatar.cc/150?u=philatelist_maria'
        },
        lastMessage: 'Добрый день! Видела вашу коллекцию, впечатляет! Хотела бы обсудить обмен...'
    }
];
