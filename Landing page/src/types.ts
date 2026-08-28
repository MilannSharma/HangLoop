export interface User {
  id: string;
  username: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
  is_super_admin?: boolean;
  is_moderator?: boolean;
}

export interface LiveRoom {
  id: string;
  name: string;
  theme?: string;
  tags?: string[];
  active_viewers?: number;
  current_video_id?: string;
  current_title?: string;
  current_artist?: string;
  current_thumbnail?: string;
  thumbnail_url?: string;
}

export interface Feedback {
  id: string;
  name: string;
  tag?: string;
  stars: number;
  text: string;
  date: string;
}

export interface StreamRequest {
  id: string;
  title: string;
  url: string;
  genre: string;
  author: string;
  status: 'UNDER_REVIEW' | 'APPROVED' | 'PLANNED';
}

export interface ChatMessage {
  text: string;
  sender?: User;
  isSystem?: boolean;
  timestamp?: string;
}

export interface PlaybackState {
  currentVideo?: {
    videoId: string;
    title?: string;
    artist?: string;
    thumbnail?: string;
  };
  startTimestamp?: number;
  seekPosition?: number;
}

export interface WSMessage {
  type: string;
  playbackState?: PlaybackState;
  members?: User[];
  chatLogs?: ChatMessage[];
  message?: ChatMessage;
  activeCount?: number;
  emoji?: string;
}
