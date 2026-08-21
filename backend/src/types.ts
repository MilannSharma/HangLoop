export interface User {
  id: string;
  email: string;
  username: string;
  full_name?: string;
  bio: string;
  avatar_url: string;
  is_subscribed: number;
  is_moderator?: boolean;
  is_super_admin?: boolean;
  moderator_permissions?: {
    can_delete_messages: boolean;
    can_timeout_users: boolean;
    can_kick_users: boolean;
  };
  created_at: string;
}

export interface Room {
  id: string;
  name: string;
  theme: string;
  category: string;
  tags?: string[];
  is_private: number;
  password?: string;
  music_enabled: number;
  max_members: number;
  current_video_id: string;
  current_title: string;
  current_artist: string;
  current_thumbnail: string;
  play_source_type?: 'APP_DB' | 'YOUTUBE_URL';
  source_youtube_url?: string;
  started_at: string;
  is_playing: number;
  seek_position: number;
  created_by: string;
  created_at: string;
  active_viewers?: number;
}

export interface QueueItem {
  id: string;
  videoId: string;
  title: string;
  artist?: string;
  thumbnail: string;
  addedBy: string;
  durationSeconds: number;
}

export interface PlaybackState {
  currentVideo: QueueItem | null;
  isPlaying: boolean;
  startTimestamp: number; // Server epoch ms when playing started
  seekPosition: number; // Current playback position in seconds
  queue: QueueItem[];
  theme?: string;
  isStreamEnded?: boolean;
}

export interface ChatMessage {
  id: string;
  clientMessageId?: string;
  sender: {
    id: string;
    username: string;
    full_name?: string;
    avatar_url: string;
    is_moderator?: boolean;
    is_super_admin?: boolean;
  };
  text: string;
  isSystem?: boolean;
  isAI?: boolean;
  aiName?: string;
  timestamp: number;
}

export interface ThemeCatalogTrack {
  id: string;
  theme: string;
  video_id: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration_seconds: number;
}
