
export type AppTheme = 'purple' | 'dark' | 'ocean' | 'sunset' | 'forest' | 'custom';
export type ProfileFont = 'space' | 'syne' | 'serif' | 'mono';
export type AppTab = 'feed' | 'chat' | 'live' | 'ai' | 'settings' | 'explore' | 'profile' | 'reels' | 'notifications' | 'dashboard' | 'ai-studio' | 'media-lab';
export type ChatTheme = 'default' | 'candy' | 'cyber' | 'lavender' | 'midnight';

export type ContentCategory = 'Tech' | 'Art' | 'Music' | 'Lifestyle' | 'Nature' | 'Neural' | 'Future';

export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  borderRadius: 'none' | 'md' | 'xl' | '3xl' | 'full';
  glassIntensity: number; // 0 to 1
  fontFamily: ProfileFont;
  mode: 'light' | 'dark';
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  cover: string;
  previewUrl?: string;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  status?: string;
  statusMusic?: MusicTrack;
  profileFont?: ProfileFont;
  isLoggedIn: boolean;
  followers: number;
  following: number;
  postsCount: number;
  profileHealth: number; // 0 to 100
  isFollowing?: boolean;
  interests?: Record<string, number>; // Category name to score
  themeConfig?: ThemeConfig;
}

export interface Post {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  content: string;
  image?: string;
  video?: string;
  music?: MusicTrack;
  likes: number;
  comments: number;
  timestamp: string;
  isLiked?: boolean;
  isSaved?: boolean;
  category?: ContentCategory;
}

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'post_share' | 'reel_share' | 'location' | 'live_location';

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  isSharing: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text?: string;
  mediaUrl?: string;
  mediaType: MessageType;
  sharedContentId?: string;
  sharedContentThumb?: string;
  sharedContentAuthor?: string;
  locationData?: LocationData;
  timestamp: Date;
  isLiked?: boolean;
  isEdited?: boolean;
}

export interface Notification {
  id: string;
  type: 'like' | 'follow' | 'comment' | 'mention' | 'ai';
  userId: string;
  username: string;
  userAvatar: string;
  content: string;
  timestamp: string;
  read: boolean;
  targetId?: string;
}

export interface Story {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  image: string;
  seen: boolean;
}
