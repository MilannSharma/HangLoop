import { SafeStorage } from './storage';

const WORKER_HOST = 'hangloop-api.milansharma942105.workers.dev';
export const API_BASE_URL = `https://${WORKER_HOST}/api`;

const TOKEN_STORAGE_KEY = '@hangloop_auth_token';
const USER_STORAGE_KEY = '@hangloop_auth_user';

export const SUPER_ADMIN_EMAIL = 'milansharma942105@gmail.com';

export interface UserProfile {
  id: string; // Immutable System User ID (e.g. ULP8F2K9X7)
  full_name?: string;
  email: string;
  username: string;
  bio: string;
  avatar_url: string;
  is_subscribed?: number;
  is_moderator?: boolean;
  is_super_admin?: boolean;
  moderator_permissions?: {
    can_delete_messages: boolean;
    can_timeout_users: boolean;
    can_kick_users: boolean;
  };
}

export interface ModeratorItem {
  id: string;
  user_id: string;
  username: string;
  full_name: string;
  email: string;
  avatar_url: string;
  can_delete_messages: boolean;
  can_timeout_users: boolean;
  can_kick_users: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoomData {
  id: string;
  name: string;
  theme?: string;
  tags?: string[];
  category: string;
  is_private: number;
  room_type?: 'LIVE_SONG' | 'PRIVATE_CHAT';
  music_enabled: number;
  max_members: number;
  created_by: string;
  expires_at?: string | null;
  thumbnail_url?: string;
  active_viewers?: number;
  current_video_id?: string;
  current_title?: string;
  current_artist?: string;
  current_thumbnail?: string;
  play_source_type?: 'APP_DB' | 'YOUTUBE_URL';
  source_youtube_url?: string;
  is_stream_ended?: boolean;
}

export interface CatalogStats {
  totalSongs: number;
  playable: number;
  failedOrDisabled: number;
  bollywood: number;
  punjabi: number;
  trending: number;
  addedRecently: number;
  lastResync: string;
}

export interface CatalogSongItem {
  id: string;
  youtube_video_id: string;
  youtube_url: string;
  canonical_url: string;
  title: string;
  song_name: string;
  artist: string;
  album_or_movie: string;
  release_year: number;
  language: string;
  theme: string;
  thumbnail_url: string;
  channel_name: string;
  duration_seconds: number;
  playable_status: 'PLAYABLE' | 'FAILED' | 'DISABLED';
  last_checked_at: string;
  failure_count: number;
  last_failure_reason?: string | null;
  source: string;
  is_active: number;
}

export const api = {
  // Session Persistence Helpers using SafeStorage
  async saveSession(user: UserProfile, token: string) {
    try {
      await SafeStorage.setItem(TOKEN_STORAGE_KEY, token);
      await SafeStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
      console.warn('Failed to save auth session:', e);
    }
  },

  async getAuthToken(): Promise<string | null> {
    try {
      return await SafeStorage.getItem(TOKEN_STORAGE_KEY);
    } catch (e) {
      return null;
    }
  },

  async getStoredUser(): Promise<UserProfile | null> {
    try {
      const userJson = await SafeStorage.getItem(USER_STORAGE_KEY);
      return userJson ? JSON.parse(userJson) : null;
    } catch (e) {
      return null;
    }
  },

  async restoreSession(): Promise<{ success: boolean; user?: UserProfile }> {
    try {
      const token = await SafeStorage.getItem(TOKEN_STORAGE_KEY);
      if (!token) return { success: false };

      const res = await fetch(`${API_BASE_URL}/auth/session`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();
      if (res.ok && data.success && data.user) {
        await SafeStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
        return { success: true, user: data.user };
      }

      await this.clearSession();
      return { success: false };
    } catch (err) {
      const user = await this.getStoredUser();
      if (user) return { success: true, user };
      return { success: false };
    }
  },

  async clearSession() {
    try {
      await SafeStorage.removeItem(TOKEN_STORAGE_KEY);
      await SafeStorage.removeItem(USER_STORAGE_KEY);
    } catch (e) {}
  },

  // Auth: Request Email OTP via Real Gmail SMTP
  async requestOtp(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: 'Network error. Could not connect to server.' };
    }
  },

  // Auth: Verify Email OTP
  async verifyOtp(email: string, otp: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: 'Network error verifying OTP.' };
    }
  },

  // Auth: Complete Multi-step Registration
  async registerUser(fullName: string, username: string, email: string): Promise<{ success: boolean; user?: UserProfile; token?: string; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, username, email })
      });
      const data = await res.json();
      if (res.ok && data.success && data.user && data.token) {
        await this.saveSession(data.user, data.token);
      }
      return data;
    } catch (err: any) {
      return { success: false, error: 'Registration failed. Network error.' };
    }
  },

  // Auth: Login Existing User
  async loginUser(email: string): Promise<{ success: boolean; user?: UserProfile; token?: string; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok && data.success && data.user && data.token) {
        await this.saveSession(data.user, data.token);
      }
      return data;
    } catch (err: any) {
      return { success: false, error: 'Login failed. Network error.' };
    }
  },

  // Auth: Logout
  async logoutUser() {
    try {
      const token = await SafeStorage.getItem(TOKEN_STORAGE_KEY);
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (e) {}
    await this.clearSession();
  },

  async createPrivateRoom(config: {
    name: string;
    durationMinutes: number;
    maxMembers: number;
    createdBy: string;
  }): Promise<{ success: boolean; room?: RoomData; roomId?: string; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/rooms/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: config.name,
          category: 'Private Chat',
          is_private: true,
          room_type: 'PRIVATE_CHAT',
          durationMinutes: Math.min(Math.max(1, config.durationMinutes), 60),
          max_members: config.maxMembers,
          created_by: config.createdBy
        })
      });
      const data = await res.json();
      if (data.success && data.roomId) {
        return {
          success: true,
          roomId: data.roomId,
          room: {
            id: data.roomId,
            name: config.name,
            category: 'Private Chat',
            is_private: 1,
            room_type: 'PRIVATE_CHAT',
            music_enabled: 0,
            max_members: config.maxMembers,
            created_by: config.createdBy
          }
        };
      }
      return { success: false, error: data.error || 'Could not create room' };
    } catch (err) {
      return { success: false, error: 'Network error creating private room' };
    }
  },

  async fetchRooms(): Promise<RoomData[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/rooms`);
      const data = await res.json();
      if (data.rooms && data.rooms.length > 0) {
        return data.rooms.map((r: any) => ({
          ...r,
          room_type: r.room_type || 'LIVE_SONG',
          thumbnail_url: r.thumbnail_url || r.current_thumbnail || `https://img.youtube.com/vi/${r.current_video_id || 'BddP6PYo2gs'}/hqdefault.jpg`,
          active_viewers: r.active_viewers || 1,
          play_source_type: r.play_source_type || 'APP_DB'
        }));
      }
      return [];
    } catch (err) {
      console.warn('Could not fetch rooms from Cloudflare D1 worker:', err);
      return [];
    }
  },

  async validateAndAddQueueSong(roomId: string, videoId: string, theme: string): Promise<{ valid: boolean; error?: string; metadata?: any }> {
    try {
      const res = await fetch(`${API_BASE_URL}/queue/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, videoId, theme })
      });
      return await res.json();
    } catch (err) {
      return { valid: true };
    }
  },

  async sendPresenceHeartbeat(roomId: string, userId: string, username: string, sessionId: string) {
    try {
      await fetch(`${API_BASE_URL}/presence/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, userId, username, sessionId })
      });
    } catch (err) {}
  },

  async submitReport(reporterId: string, targetId: string, reason: string, details?: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/user/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reporter_id: reporterId, target_id: targetId, reason, details })
      });
      return await res.json();
    } catch (err) {
      return { success: false };
    }
  },

  async blockUser(blockerId: string, blockedId: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/user/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocker_id: blockerId, blocked_id: blockedId })
      });
      return await res.json();
    } catch (err) {
      return { success: false };
    }
  },

  // ──────────────────────────────────────────────────────────────
  // SUPER ADMIN: Music Catalog APIs
  // ──────────────────────────────────────────────────────────────
  async fetchCatalogStats(): Promise<{ success: boolean; stats?: CatalogStats; error?: string }> {
    try {
      const token = await this.getAuthToken();
      const res = await fetch(`${API_BASE_URL}/admin/catalog/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async fetchCatalogSongs(options: {
    page?: number;
    limit?: number;
    search?: string;
    theme?: string;
    status?: string;
  }): Promise<{ success: boolean; songs?: CatalogSongItem[]; pagination?: any; error?: string }> {
    try {
      const token = await this.getAuthToken();
      const params = new URLSearchParams();
      if (options.page) params.set('page', String(options.page));
      if (options.limit) params.set('limit', String(options.limit));
      if (options.search) params.set('search', options.search);
      if (options.theme) params.set('theme', options.theme);
      if (options.status) params.set('status', options.status);

      const res = await fetch(`${API_BASE_URL}/admin/catalog/songs?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async discoverCatalogPreview(geminiApiKey: string, prompt?: string): Promise<{ success: boolean; preview?: any; error?: string }> {
    try {
      const token = await this.getAuthToken();
      const res = await fetch(`${API_BASE_URL}/admin/catalog/discover-preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ geminiApiKey, prompt })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async addCatalogBatch(songs: any[]): Promise<{ success: boolean; result?: any; error?: string }> {
    try {
      const token = await this.getAuthToken();
      const res = await fetch(`${API_BASE_URL}/admin/catalog/add-batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ songs })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async addCatalogSingle(songData: Partial<CatalogSongItem>): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const token = await this.getAuthToken();
      const res = await fetch(`${API_BASE_URL}/admin/catalog/add-single`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(songData)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async toggleCatalogStatus(songId: string, status: 'PLAYABLE' | 'DISABLED' | 'FAILED'): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const token = await this.getAuthToken();
      const res = await fetch(`${API_BASE_URL}/admin/catalog/toggle-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ songId, status })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async deleteCatalogSong(songId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const token = await this.getAuthToken();
      const res = await fetch(`${API_BASE_URL}/admin/catalog/songs?id=${encodeURIComponent(songId)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async resyncCatalog(geminiApiKey?: string): Promise<{ success: boolean; result?: any; error?: string }> {
    try {
      const token = await this.getAuthToken();
      const res = await fetch(`${API_BASE_URL}/admin/catalog/resync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ geminiApiKey })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async createAdminLiveRoom(payload: {
    name: string;
    theme: string;
    tags?: string[];
    play_source_type: 'APP_DB' | 'YOUTUBE_URL';
    source_youtube_url?: string;
    thumbnail_url?: string;
    initial_video_id?: string;
    initial_title?: string;
    initial_artist?: string;
  }): Promise<{ success: boolean; roomId?: string; error?: string }> {
    try {
      const token = await this.getAuthToken();
      const res = await fetch(`${API_BASE_URL}/admin/rooms/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  async editAdminLiveRoom(payload: {
    roomId: string;
    name?: string;
    source_youtube_url?: string;
    thumbnail_url?: string;
    tags?: string[];
  }): Promise<{ success: boolean; room?: RoomData; message?: string; error?: string }> {
    try {
      const token = await this.getAuthToken();
      const res = await fetch(`${API_BASE_URL}/admin/rooms/edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to edit room' };
    }
  },

  async deleteAdminLiveRoom(roomId: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const token = await this.getAuthToken();
      const res = await fetch(`${API_BASE_URL}/admin/rooms/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ roomId })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to delete room' };
    }
  },

  // ──────────────────────────────────────────────────────────────
  // In-Room Database Song Search & Request APIs
  // ──────────────────────────────────────────────────────────────
  async searchCatalogSongs(query: string, theme?: string): Promise<{ success: boolean; songs: any[] }> {
    try {
      const res = await fetch(`${API_BASE_URL}/catalog/search?q=${encodeURIComponent(query)}&theme=${encodeURIComponent(theme || 'ALL')}`);
      const data = await res.json();
      return { success: data.success || false, songs: data.songs || [] };
    } catch (err) {
      return { success: false, songs: [] };
    }
  },

  async requestSong(query: string, requestedBy: string, userEmail?: string): Promise<{ success: boolean; message?: string; alreadyExists?: boolean; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/song-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, requested_by: requestedBy, user_email: userEmail })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to submit song request' };
    }
  },

  async fetchAdminSongRequests(status: string = 'ALL'): Promise<{ success: boolean; requests: any[]; pendingCount?: number; completedCount?: number; error?: string }> {
    try {
      const token = await this.getAuthToken();
      const res = await fetch(`${API_BASE_URL}/admin/song-requests?status=${encodeURIComponent(status)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, requests: [], error: err.message };
    }
  },

  async syncAdminSongRequest(requestId: string): Promise<{ success: boolean; songId?: string; songTitle?: string; artist?: string; error?: string }> {
    try {
      const token = await this.getAuthToken();
      const res = await fetch(`${API_BASE_URL}/admin/song-requests/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ requestId })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  },

  // ──────────────────────────────────────────────────────────────
  // User Profile & Moderator Management APIs
  // ──────────────────────────────────────────────────────────────
  async updateProfile(fullName?: string, bio?: string, avatarUrl?: string): Promise<{ success: boolean; user?: UserProfile; message?: string; error?: string }> {
    try {
      const token = await this.getAuthToken();
      const res = await fetch(`${API_BASE_URL}/user/update-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ fullName, bio, avatarUrl })
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        await SafeStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
      }
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update profile' };
    }
  },

  async searchUsers(query: string): Promise<{ success: boolean; users: UserProfile[] }> {
    try {
      const res = await fetch(`${API_BASE_URL}/users/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      return { success: data.success || false, users: data.users || [] };
    } catch (err) {
      return { success: false, users: [] };
    }
  },

  async getModerators(): Promise<{ success: boolean; moderators: ModeratorItem[]; error?: string }> {
    try {
      const token = await this.getAuthToken();
      const res = await fetch(`${API_BASE_URL}/admin/moderators`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, moderators: [], error: err.message };
    }
  },

  async addModerator(
    emailOrUsername: string,
    permissions: {
      can_delete_messages?: boolean;
      can_timeout_users?: boolean;
      can_kick_users?: boolean;
      userId?: string;
      username?: string;
      full_name?: string;
      avatar_url?: string;
      email?: string;
    }
  ): Promise<{ success: boolean; moderator?: ModeratorItem; message?: string; error?: string }> {
    try {
      const token = await this.getAuthToken();
      const res = await fetch(`${API_BASE_URL}/admin/moderators`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          emailOrUsername,
          userId: permissions.userId || emailOrUsername,
          username: permissions.username,
          full_name: permissions.full_name,
          avatar_url: permissions.avatar_url,
          email: permissions.email,
          ...permissions
        })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to add moderator' };
    }
  },

  async updateModerator(
    id: string,
    permissions: { can_delete_messages?: boolean; can_timeout_users?: boolean; can_kick_users?: boolean; is_active?: boolean }
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const token = await this.getAuthToken();
      const res = await fetch(`${API_BASE_URL}/admin/moderators`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id, ...permissions })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update moderator' };
    }
  },

  async removeModerator(id: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const token = await this.getAuthToken();
      const res = await fetch(`${API_BASE_URL}/admin/moderators?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to remove moderator' };
    }
  }
};
