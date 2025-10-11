export type Theme = 'light' | 'dark';

export type Page = 'Feed' | 'Collection' | 'Wantlist' | 'Messages' | 'Profile' | 'SubscriptionFeed' | 'PublicProfile' | 'PublicWantlist';

export interface Profile {
  id: string;
  name: string | null;
  handle: string | null;
  location: string | null;
  avatar_url: string;
  header_image_url: string | null;
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
    avatar_url: string;
  } | null;
  grade?: 'UNC' | 'XF' | 'VF' | 'F' | null;
  rarity?: 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | null;
  material?: string | null;
  mint?: string | null;
}

export interface Album {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  created_at: string;
  header_image_url: string | null;
  cover_image_url: string | null;
  theme_color?: 'default' | 'primary' | 'secondary' | null;
  cover_text?: string | null;
  is_public: boolean;
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

export interface WantlistList {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
}

export interface WantlistItem {
    id: string;
    user_id: string;
    list_id: string;
    name: string;
    details: string;
    description: string;
    created_at: string;
    is_found?: boolean;
    image_url?: string | null;
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