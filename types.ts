export type Theme = 'light' | 'dark';

export type Page = 'Feed' | 'Collection' | 'Wantlist' | 'Messages' | 'Profile' | 'SubscriptionFeed';

export interface Profile {
  id: string;
  name: string | null;
  handle: string | null;
  location: string | null;
  avatar_url: string;
  header_image_url: string | null;
  followers: number;
}

export interface Collectible {
  id: string;
  name: string;
  category: 'coin' | 'stamp' | 'banknote';
  country: string;
  year: number;
  description: string;
  image_url: string | null;
  owner_id: string;
  created_at: string;
  album_id?: string | null;
  profiles?: {
    handle: string | null;
  } | null;
}

export interface Album {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Comment {
  id: string;
  text: string;
  created_at: string;
  owner_id: string;
  collectible_id: string;
  profiles: {
    name: string | null;
    handle: string | null;
    avatar_url: string;
  } | null;
}

export interface WantlistItem {
    id: string;
    user_id: string;
    name: string;
    details: string;
    description: string;
    created_at: string;
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

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

// FIX: Added the missing 'Notification' type to resolve import error.
export interface Notification {
  id:string;
  collectible_id: string;
  sender_id: string;
  wantlist_item_name: string;
  created_at: string;
  profiles: {
    name: string | null;
    handle: string | null;
    avatar_url: string;
  } | null;
  collectibles: {
    image_url: string | null;
    name: string;
  } | null;
}