export type Theme = 'light' | 'dark';

export type Page = 'Feed' | 'Collection' | 'Wantlist' | 'Messages' | 'Profile';

export interface Profile {
  id: string;
  name: string;
  handle: string;
  location: string;
  avatar_url: string;
  followers: number;
}

export interface Collectible {
  id: string;
  name: string;
  category: 'coin' | 'stamp' | 'banknote';
  country: string;
  year: number;
  description: string;
  image_url: string;
  owner_id: string;
  created_at: string;
  profiles?: {
    handle: string;
  } | null;
}

export interface Comment {
  id: string;
  text: string;
  created_at: string;
  owner_id: string;
  collectible_id: string;
  profiles: {
    name: string;
    handle: string;
    avatar_url: string;
  } | null;
}

export interface WantlistItem {
    id: number;
    name: string;
    details: string;
    description: string;
}

export interface MessageThread {
    id: number;
    user: {
        name: string;
        handle: string;
        avatarUrl: string;
    };
    lastMessage: string;
}