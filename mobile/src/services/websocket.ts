const WORKER_HOST = 'hangloop-api.milansharma942105.workers.dev';

export interface RoomStatePayload {
  playbackState: {
    currentVideo: {
      id: string;
      videoId: string;
      title: string;
      artist?: string;
      thumbnail: string;
      addedBy: string;
      durationSeconds: number;
    } | null;
    isPlaying: boolean;
    seekPosition: number;
    startTimestamp?: number;
    queue: any[];
    theme?: string;
    isStreamEnded?: boolean;
  };
  chatLogs: Array<{
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
  }>;
  members: Array<{
    id: string;
    username: string;
    full_name?: string;
    avatar_url: string;
    is_moderator?: boolean;
    is_super_admin?: boolean;
  }>;
  isHost?: boolean;
  isModerator?: boolean;
  isSuperAdmin?: boolean;
  hasOlderMessages?: boolean;
}

export type WebSocketListener = (data: any) => void;

export class RoomWebSocketClient {
  private ws: WebSocket | null = null;
  private listeners: Set<WebSocketListener> = new Set();
  private roomId: string;
  private isManualDisconnect: boolean = false;
  private reconnectTimer: any = null;
  private reconnectAttempts: number = 0;
  private user: {
    id: string;
    username: string;
    full_name?: string;
    avatar_url: string;
    is_moderator?: boolean;
    is_super_admin?: boolean;
  };

  constructor(
    roomId: string,
    user: {
      id: string;
      username: string;
      full_name?: string;
      avatar_url: string;
      is_moderator?: boolean;
      is_super_admin?: boolean;
    }
  ) {
    this.roomId = roomId;
    this.user = user;
  }

  connect() {
    this.isManualDisconnect = false;
    const wsUrl = `wss://${WORKER_HOST}/api/ws/room/${this.roomId}?userId=${encodeURIComponent(this.user.id)}&username=${encodeURIComponent(this.user.username)}&fullName=${encodeURIComponent(this.user.full_name || this.user.username)}&avatarUrl=${encodeURIComponent(this.user.avatar_url)}`;

    try {
      if (this.ws) {
        try { this.ws.close(); } catch (e) {}
      }

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log(`Connected to live Cloudflare Worker WebSocket for room: ${this.roomId}`);
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.notifyListeners(data);
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('WebSocket connection error:', err);
      };

      this.ws.onclose = () => {
        console.log('Room WebSocket connection closed');
        if (!this.isManualDisconnect) {
          const delay = Math.min(5000, 1000 * Math.pow(1.5, this.reconnectAttempts));
          this.reconnectAttempts++;
          this.reconnectTimer = setTimeout(() => {
            if (!this.isManualDisconnect) {
              console.log(`[WebSocket] Auto-reconnecting to room ${this.roomId}...`);
              this.connect();
            }
          }, delay);
        }
      };
    } catch (err) {
      console.warn('Could not initiate WebSocket connection:', err);
    }
  }

  subscribe(listener: WebSocketListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(data: any) {
    this.listeners.forEach((listener) => listener(data));
  }

  sendHeartbeat() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'HEARTBEAT' }));
    }
  }

  requestSync() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'REQUEST_SYNC' }));
    }
  }

  sendChatMessage(text: string, clientMessageId?: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'CHAT_SEND', text, clientMessageId }));
    }
  }

  sendTyping(isTyping: boolean) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'TYPING', isTyping }));
    }
  }

  addSongToQueue(videoId: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'ADD_QUEUE', videoId }));
    }
  }

  addToQueue(item: any) {
    const videoId = typeof item === 'string' ? item : (item?.videoId || item?.id || '');
    if (videoId && this.ws && this.ws.readyState === WebSocket.OPEN) {
      const payload = typeof item === 'object' ? {
        type: 'ADD_QUEUE',
        videoId,
        title: item.title,
        artist: item.artist,
        thumbnail: item.thumbnail,
        durationSeconds: item.durationSeconds,
      } : {
        type: 'ADD_QUEUE',
        videoId,
      };
      this.ws.send(JSON.stringify(payload));
    }
  }

  notifyTrackEnded(videoId?: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'TRACK_ENDED', videoId: videoId || '' }));
    }
  }

  notifyTrackFailed(videoId?: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'TRACK_FAILED', videoId: videoId || '' }));
    }
  }

  sendPlayerAction(action: 'SEEK' | 'TOGGLE_PLAY' | 'SKIP', payload: any = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'PLAYER_ACTION', action, ...payload }));
    }
  }

  blockUser(targetUserId: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'BLOCK_USER', targetUserId }));
    }
  }

  deleteChatMessage(messageId: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'CHAT_DELETE', messageId }));
    }
  }

  timeoutUser(targetUserId: string, durationMinutes: number = 5, reason: string = 'Violation of chat rules') {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'USER_TIMEOUT', targetUserId, durationMinutes, reason }));
    }
  }

  kickUser(targetUserId: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'KICK_USER', targetUserId }));
    }
  }

  makeModerator(targetUserId: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'MAKE_MODERATOR', targetUserId }));
    }
  }

  removeModerator(targetUserId: string) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'REMOVE_MODERATOR', targetUserId }));
    }
  }

  disconnect() {
    this.isManualDisconnect = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      try { this.ws.close(); } catch (e) {}
      this.ws = null;
    }
    this.listeners.clear();
  }
}
