import { PlaybackState, QueueItem, ChatMessage, Room } from './types';
import { fetchYouTubeMetadata, validateVideoTheme, validateVideoPlayable, searchYouTubeCandidates } from './themeValidator';
import { recordSongFailure } from './catalogService';
import { isAIBotCommand, processAIBotMessage } from './kiraService';

interface ConnectedMember {
  webSocket: WebSocket;
  user: {
    id: string;
    username: string;
    full_name?: string;
    avatar_url: string;
    is_moderator?: boolean;
    is_super_admin?: boolean;
  };
  sessionId: string;
}

export class RoomDurableObject {
  private state: DurableObjectState;
  private env: any;
  private members: Map<WebSocket, ConnectedMember> = new Map();
  private playbackState: PlaybackState = {
    currentVideo: null,
    isPlaying: true,
    startTimestamp: Date.now(),
    seekPosition: 0,
    queue: [],
    theme: 'BOLLYWOOD'
  };
  private chatLogs: ChatMessage[] = [];
  private roomStartTime: number | null = null;
  private blockedUsers: Set<string> = new Set();
  private timeouts: Map<string, number> = new Map(); // userId -> expiresAt (epoch ms)
  private ownerId: string | null = null;
  private roomId: string = '';
  private initialized: boolean = false;
  private consecutiveFailures: number = 0;
  private lastAdvancedVideoId: string = '';
  private failedVideoIds: Set<string> = new Set();
  private recentPlayedVideoIds: string[] = [];
  private playSourceType: 'APP_DB' | 'YOUTUBE_URL' = 'APP_DB';
  private sourceYouTubeUrl: string = '';
  private currentAlarmVideoId: string = '';
  private lastChatTimes: Map<string, number> = new Map(); // userId -> lastMessageTimestamp (ms)
  private typingUsers: Map<string, { userId: string; username: string; expiresAt: number }> = new Map();
  private roomName: string = '';
  private tags: string[] = [];
  private isStreamEnded: boolean = false;
  private welcomedUsers: Map<string, number> = new Map(); // userId -> lastWelcomeTimestampMs

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
    this.env = env;
  }

  private async ensureChatLogsHydrated(): Promise<void> {
    if (this.chatLogs.length > 0 || !this.env.DB || !this.roomId) return;
    try {
      const { results: chatRows } = await this.env.DB.prepare(
        `SELECT id, client_message_id, sender_id, sender_name, sender_avatar,
                sender_is_moderator, sender_is_super_admin, text, is_ai, ai_name,
                is_system, timestamp_ms, created_at
         FROM chat_messages
         WHERE room_id = ?
         ORDER BY timestamp_ms DESC, created_at DESC
         LIMIT 50`
      ).bind(this.roomId).all();

      if (chatRows && chatRows.length > 0) {
        const loadedLogs: ChatMessage[] = chatRows.reverse().map((r: any) => ({
          id: r.id,
          clientMessageId: r.client_message_id || undefined,
          sender: {
            id: r.sender_id || 'u-unknown',
            username: r.sender_name || 'User',
            full_name: r.sender_name || 'User',
            avatar_url: r.sender_avatar || '',
            is_moderator: r.sender_is_moderator === 1,
            is_super_admin: r.sender_is_super_admin === 1,
          },
          text: r.text,
          isAI: r.is_ai === 1,
          aiName: r.ai_name || undefined,
          isSystem: r.is_system === 1,
          timestamp: r.timestamp_ms || (r.created_at ? new Date(r.created_at + (r.created_at.includes('Z') ? '' : 'Z')).getTime() : Date.now())
        }));
        this.chatLogs = loadedLogs;
      }
    } catch (e) {
      console.warn('Error hydrating chat history from D1 in DO:', e);
    }
  }

  private async rescheduleAlarm(): Promise<void> {
    // Dedicated YouTube URL live stream rooms must NEVER schedule catalog auto-advance alarms
    if (this.playSourceType === 'YOUTUBE_URL') {
      return;
    }
    const durationMs = (this.playbackState.currentVideo?.durationSeconds || 240) * 1000;
    this.currentAlarmVideoId = this.playbackState.currentVideo?.videoId || '';
    await this.state.storage.setAlarm(Date.now() + durationMs).catch(() => {});
  }

  // Cloudflare Durable Object Alarm: Continuous 24/7 Server-Side Radio Broadcast Engine
  async alarm() {
    try {
      // Dedicated YouTube URL live streams must NEVER auto-advance to other catalog songs
      if (this.playSourceType === 'YOUTUBE_URL') {
        return;
      }

      // Stale alarm detection: If video already advanced by client (TRACK_ENDED / SKIP), ignore this stale alarm
      if (this.currentAlarmVideoId && this.playbackState.currentVideo?.videoId && this.currentAlarmVideoId !== this.playbackState.currentVideo.videoId) {
        console.log('[RoomDurableObject Alarm] Stale alarm detected for', this.currentAlarmVideoId, 'vs current:', this.playbackState.currentVideo.videoId, '— skipping duplicate advance.');
        return;
      }

      console.log('[RoomDurableObject Alarm] Advancing queue for 24/7 broadcast...');
      await this.advanceQueue();
      this.broadcast({
        type: 'PLAYBACK_SYNC',
        playbackState: this.getNormalizedPlaybackState()
      });
      await this.rescheduleAlarm();
    } catch (e) {
      console.error('[RoomDurableObject Alarm] Error:', e);
      // Reschedule backup alarm in 30s
      await this.state.storage.setAlarm(Date.now() + 30000).catch(() => {});
    }
  }

  private async syncTimeline(): Promise<void> {
    if (!this.playbackState.currentVideo || !this.playbackState.isPlaying) return;
    // Dedicated YouTube live streams remain locked on current video
    if (this.playSourceType === 'YOUTUBE_URL') {
      return;
    }
    let now = Date.now();
    let durationMs = (this.playbackState.currentVideo.durationSeconds || 240) * 1000;
    let elapsedMs = now - this.playbackState.startTimestamp;

    // Advance across any number of elapsed songs (e.g. while 0 viewers were in the room)
    let advanceCount = 0;
    while (elapsedMs >= durationMs && advanceCount < 50) {
      advanceCount++;
      const previousStart = this.playbackState.startTimestamp;
      await this.advanceQueue();
      // Anchor new song's start timestamp to when the previous song actually ended
      this.playbackState.startTimestamp = previousStart + durationMs;
      now = Date.now();
      durationMs = (this.playbackState.currentVideo?.durationSeconds || 240) * 1000;
      elapsedMs = now - this.playbackState.startTimestamp;
    }

    if (this.playbackState.currentVideo) {
      const remainingMs = Math.max(1000, durationMs - elapsedMs);
      this.currentAlarmVideoId = this.playbackState.currentVideo.videoId || '';
      await this.state.storage.setAlarm(Date.now() + remainingMs).catch(() => {});
      await this.state.storage.put('startTimestamp', this.playbackState.startTimestamp);
      await this.state.storage.put('currentVideo', this.playbackState.currentVideo);
    }
  }

  private async initializeRoom(roomId: string) {
    if (this.initialized) return;
    this.roomId = roomId;

    try {
      // 1. Check Durable Object persistent storage first
      const storedStart = await this.state.storage.get<number>('startTimestamp');
      const storedVideo = await this.state.storage.get<any>('currentVideo');
      if (storedStart && storedVideo) {
        this.playbackState.startTimestamp = storedStart;
        this.playbackState.currentVideo = storedVideo;
      }

      if (this.env.DB) {
        const roomRow: any = await this.env.DB.prepare(
          `SELECT * FROM rooms WHERE id = ?`
        ).bind(roomId).first();

        if (roomRow) {
          this.roomName = roomRow.name || '';
          this.playbackState.theme = roomRow.theme || 'BOLLYWOOD';
          this.ownerId = roomRow.created_by;
          this.playSourceType = roomRow.play_source_type === 'YOUTUBE_URL' ? 'YOUTUBE_URL' : 'APP_DB';
          this.sourceYouTubeUrl = roomRow.source_youtube_url || '';

          try {
            this.tags = JSON.parse(roomRow.tags || '[]');
          } catch (e) {
            this.tags = roomRow.theme ? [roomRow.theme] : ['BOLLYWOOD'];
          }
          if (this.tags.length === 0 && roomRow.theme) {
            this.tags = [roomRow.theme];
          }

          if (!this.playbackState.currentVideo && roomRow.current_video_id) {
            this.playbackState.currentVideo = {
              id: 'cur-' + Date.now(),
              videoId: roomRow.current_video_id,
              title: roomRow.current_title || 'Live Track',
              artist: roomRow.current_artist || 'Artist',
              thumbnail: roomRow.current_thumbnail || `https://img.youtube.com/vi/${roomRow.current_video_id}/hqdefault.jpg`,
              addedBy: 'Hangloop Auto',
              durationSeconds: this.playSourceType === 'YOUTUBE_URL' ? 0 : 240
            };

            if (roomRow.started_at) {
              const parsed = new Date(roomRow.started_at + (roomRow.started_at.includes('Z') ? '' : 'Z')).getTime();
              if (!isNaN(parsed) && parsed > 0) {
                this.playbackState.startTimestamp = parsed;
              }
            }
          }

          // Fetch stored queue from D1 if APP_DB mode
          if (this.playSourceType === 'APP_DB') {
            const { results: queueRows } = await this.env.DB.prepare(
              `SELECT * FROM room_queue WHERE room_id = ? ORDER BY order_index ASC`
            ).bind(roomId).all();

            if (queueRows && queueRows.length > 0) {
              this.playbackState.queue = queueRows.map((q: any) => ({
                id: q.id,
                videoId: q.video_id,
                title: q.title,
                artist: q.artist,
                thumbnail: q.thumbnail,
                addedBy: q.added_by,
                durationSeconds: q.duration_seconds
              }));
            }
          }
        }
      }
    } catch (e) {
      console.error('Error initializing room from D1:', e);
    }

    // Always ensure chat history is hydrated from D1
    await this.ensureChatLogsHydrated();

    // If still no track, fetch first catalog track for theme (App Queue initial track)
    if (!this.playbackState.currentVideo) {
      await this.advanceToThemeCatalogTrack();
    }

    // Ensure server timeline and alarm is scheduled
    await this.syncTimeline();
    await this.rescheduleAlarm();
    await this.state.storage.put('startTimestamp', this.playbackState.startTimestamp);
    await this.state.storage.put('currentVideo', this.playbackState.currentVideo);

    this.initialized = true;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const roomId = url.searchParams.get('roomId') || url.pathname.split('/').pop() || '';

    if (roomId) {
      await this.initializeRoom(roomId);
    }

    // Always ensure timeline is up to date before processing any request
    await this.syncTimeline();

    if (url.pathname === '/websocket' || request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      await this.handleWebSocket(server, request);

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    if (url.pathname === '/kill-isolate' || url.pathname === '/reboot-isolate') {
      setTimeout(() => {
        throw new Error('REBOOT_ISOLATE_INTENTIONAL');
      }, 50);
      return new Response(JSON.stringify({ success: true, message: 'Isolate marked for immediate termination' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (url.pathname === '/restart' || url.pathname === '/reset') {
      this.initialized = false;
      this.chatLogs = [];
      for (const [ws] of this.members.entries()) {
        try { ws.close(1012, 'Room Restarting for Engine Update'); } catch (e) {}
      }
      this.members.clear();
      if (roomId) {
        await this.initializeRoom(roomId);
      }
      return new Response(JSON.stringify({ success: true, message: `Room ${roomId} restarted successfully` }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (url.pathname === '/state') {
      return new Response(JSON.stringify(this.getNormalizedPlaybackState()), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (url.pathname === '/update-room' && request.method === 'POST') {
      const body = await request.json() as any;
      const { name, videoId, title, artist, thumbnail, sourceUrl, tags } = body;

      if (name) {
        this.roomName = name;
      }
      if (Array.isArray(tags)) {
        this.tags = tags;
      }

      if (videoId) {
        this.playbackState.currentVideo = {
          id: 'cur-' + Date.now(),
          videoId,
          title: title || 'Live Stream',
          artist: artist || 'YouTube',
          thumbnail: thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          addedBy: 'Admin',
          durationSeconds: 0
        };
        if (sourceUrl) this.sourceYouTubeUrl = sourceUrl;
        this.playbackState.startTimestamp = Date.now();
        this.playbackState.seekPosition = 0;
        this.playbackState.isPlaying = true;
        this.isStreamEnded = false;

        await this.state.storage.put('currentVideo', this.playbackState.currentVideo);
        await this.state.storage.put('startTimestamp', this.playbackState.startTimestamp);
      }

      this.broadcast({
        type: 'ROOM_UPDATED',
        room: {
          name: this.roomName,
          tags: this.tags,
          current_video_id: this.playbackState.currentVideo?.videoId,
          current_title: this.playbackState.currentVideo?.title,
          current_artist: this.playbackState.currentVideo?.artist,
          current_thumbnail: this.playbackState.currentVideo?.thumbnail,
          source_youtube_url: this.sourceYouTubeUrl
        },
        playbackState: this.getNormalizedPlaybackState()
      });

      this.broadcast({
        type: 'PLAYBACK_SYNC',
        playbackState: this.getNormalizedPlaybackState()
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (url.pathname === '/delete-room' && request.method === 'POST') {
      const body = (await request.json().catch(() => ({}))) as any;
      const message = body.message || 'This live room has been closed by admin.';

      // Notify all connected viewers that room is ended/deleted
      this.broadcast({
        type: 'ROOM_ENDED',
        message
      });

      // Close all connected WebSockets
      for (const ws of this.members.keys()) {
        try {
          ws.close(1000, 'Room Deleted');
        } catch (e) {}
      }
      this.members.clear();

      // Clear storage
      await this.state.storage.deleteAll().catch(() => {});

      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Not Found', { status: 404 });
  }

  private async handleWebSocket(webSocket: WebSocket, request: Request) {
    this.state.acceptWebSocket(webSocket);

    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') || 'guest-' + Math.random().toString(36).substring(7);
    const username = url.searchParams.get('username') || 'Guest_' + Math.floor(Math.random() * 1000);
    const rawFullName = url.searchParams.get('fullName') || username;
    const avatarUrl = url.searchParams.get('avatarUrl') || '';
    const sessionId = 'sess-' + Date.now() + '-' + Math.random().toString(36).substring(7);

    // Security Hardening: Default to false, elevate ONLY after verifying from D1
    let isModerator = false;
    let isSuperAdmin = false;
    let verifiedFullName = rawFullName;

    if (this.env.DB && userId) {
      try {
        const modRow: any = await this.env.DB.prepare(
          `SELECT * FROM moderators WHERE (user_id = ? OR LOWER(user_id) = ? OR username = ? OR LOWER(username) = ?) AND is_active = 1 LIMIT 1`
        ).bind(userId, userId.toLowerCase(), username, username.toLowerCase()).first();
        if (modRow) isModerator = true;

        const userRow: any = await this.env.DB.prepare(
          `SELECT full_name, email FROM users WHERE id = ? OR LOWER(id) = ? OR LOWER(username) = ? LIMIT 1`
        ).bind(userId, userId.toLowerCase(), username.toLowerCase()).first();
        if (userRow) {
          if (userRow.full_name) verifiedFullName = userRow.full_name;
          if ((userRow.email || '').toLowerCase().trim() === 'milansharma942105@gmail.com') {
            isSuperAdmin = true;
            isModerator = true;
          }
        }
      } catch (e) {
        console.warn('Error checking moderator in DO:', e);
      }
    }

    if (!this.ownerId) {
      this.ownerId = userId;
    }

    if (this.blockedUsers.has(userId)) {
      webSocket.send(JSON.stringify({ type: 'ERROR', message: 'You are blocked from this room' }));
      webSocket.close(1008, 'Blocked');
      return;
    }

    const memberInfo: ConnectedMember = {
      webSocket,
      user: {
        id: userId,
        username,
        full_name: verifiedFullName,
        avatar_url: avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
        is_moderator: isModerator,
        is_super_admin: isSuperAdmin,
      },
      sessionId
    };

    this.members.set(webSocket, memberInfo);

    if (!this.roomStartTime) {
      this.roomStartTime = Date.now();
    }

    // Record presence in D1
    if (this.env.DB) {
      try {
        await this.env.DB.prepare(
          `INSERT INTO room_presence (session_id, room_id, user_id, username, avatar_url, last_seen)
           VALUES (?, ?, ?, ?, ?, datetime('now'))
           ON CONFLICT(session_id) DO UPDATE SET last_seen=datetime('now')`
        ).bind(sessionId, this.roomId, userId, username, avatarUrl).run();
      } catch (e) {
        console.warn('Failed recording D1 presence:', e);
      }
    }

    // Ensure recent chat buffer is populated before sending INIT_STATE
    await this.ensureChatLogsHydrated();

    // Send INITIAL STATE snapshot with synchronized live seek position and recent catch-up buffer
    webSocket.send(JSON.stringify({
      type: 'INIT_STATE',
      playbackState: this.getNormalizedPlaybackState(),
      chatLogs: this.chatLogs.slice(-50),
      members: Array.from(this.members.values()).map(m => m.user),
      roomStartTime: this.roomStartTime,
      roomName: this.roomName,
      tags: this.tags,
      isHost: userId === this.ownerId,
      isModerator,
      isSuperAdmin,
      hasOlderMessages: this.chatLogs.length > 50,
      playSourceType: this.playSourceType,
      isStreamEnded: this.isStreamEnded
    }));

    // Broadcast member joined
    this.broadcast({
      type: 'MEMBER_JOINED',
      user: memberInfo.user,
      memberCount: this.members.size
    }, webSocket);

    // ── KIRA AI AUTO WELCOME ON ROOM ENTRANCE ──
    this.sendKiraWelcome(memberInfo.user);
  }

  private async sendKiraWelcome(user: { id: string; username: string; full_name?: string }) {
    if (!user || !user.id) return;
    const now = Date.now();
    const lastWelcomed = this.welcomedUsers.get(user.id) || 0;
    // Don't repeat welcome message if user reconnected within 3 minutes in this room session
    if (now - lastWelcomed < 180000) return;
    this.welcomedUsers.set(user.id, now);

    const displayName = (user.full_name || user.username || 'friend').replace(/[@]/g, '').trim();
    const welcomePhrases = [
      `Arre waah! Welcome @${displayName} to the room! 🎉 Kya sunna pasand karoge?`,
      `Ayy @${displayName} in the house! 🔥 Headphones lagao aur vibe karo!`,
      `Welcome @${displayName}! 🎧 Hangloop pe aapka swagat hai, gaane ka maza lo!`,
      `Hii @${displayName}! 💖 Aate hi room ka vibe badh gaya, enjoy the beats!`,
      `Yo @${displayName}! 🎶 Let's vibe together! Koi gaana suggest karna ho toh @kira bolna!`
    ];
    const welcomeText = welcomePhrases[Math.floor(Math.random() * welcomePhrases.length)];
    const botUserId = 'kira-ai';
    const botFullName = 'Kira 🤖';
    const botAvatar = 'https://api.dicebear.com/7.x/bottts/svg?seed=kira-ai';

    // Organic short delay so client finishes rendering the initial room state
    setTimeout(async () => {
      const botTimestamp = Date.now();
      const aiChatMessage: ChatMessage = {
        id: 'kira-welcome-' + botTimestamp + '-' + Math.random().toString(36).substring(7),
        sender: {
          id: botUserId,
          username: 'Kira',
          full_name: botFullName,
          avatar_url: botAvatar,
          is_moderator: true,
        },
        text: welcomeText,
        isAI: true,
        aiName: 'Kira',
        timestamp: botTimestamp
      };

      this.chatLogs.push(aiChatMessage);
      if (this.chatLogs.length > 50) this.chatLogs.shift();

      // Persist welcome message to D1
      if (this.env.DB && this.roomId) {
        try {
          await this.env.DB.prepare(
            `INSERT INTO chat_messages (id, client_message_id, room_id, sender_id, sender_name, sender_avatar, sender_is_moderator, sender_is_super_admin, text, is_ai, ai_name, is_system, timestamp_ms)
             VALUES (?, '', ?, ?, ?, ?, 1, 0, ?, 1, 'Kira', 0, ?)`
          ).bind(
            aiChatMessage.id,
            this.roomId,
            botUserId,
            botFullName,
            botAvatar,
            welcomeText,
            botTimestamp
          ).run();
        } catch (e) {
          console.warn('Failed persisting Kira welcome to D1:', e);
        }
      }

      this.broadcast({ type: 'CHAT_RECEIVE', message: aiChatMessage });
    }, 700);
  }

  async webSocketMessage(webSocket: WebSocket, message: string | ArrayBuffer) {
    if (typeof message !== 'string') return;
    try {
      const data = JSON.parse(message);
      const member = this.members.get(webSocket);
      if (!member) return;

      switch (data.type) {
        case 'HEARTBEAT': {
          if (this.env.DB && member.sessionId) {
            await this.env.DB.prepare(
              `UPDATE room_presence SET last_seen = datetime('now') WHERE session_id = ?`
            ).bind(member.sessionId).run();
          }

          // Server-side Watchdog: Auto-advance if current song duration has elapsed (APP_DB only)
          if (this.playSourceType !== 'YOUTUBE_URL' && this.playbackState.isPlaying && this.playbackState.currentVideo) {
            const elapsed = (Date.now() - this.playbackState.startTimestamp) / 1000;
            const currentSeek = this.playbackState.seekPosition + elapsed;
            const duration = this.playbackState.currentVideo.durationSeconds || 240;

            if (currentSeek >= duration + 1) {
              console.log('[DO Watchdog] Song duration elapsed on HEARTBEAT — advancing queue...');
              await this.advanceQueue();
              this.broadcast({
                type: 'PLAYBACK_SYNC',
                playbackState: this.getNormalizedPlaybackState()
              });
            }
          }
          webSocket.send(JSON.stringify({ 
            type: 'HEARTBEAT_ACK',
            playbackState: this.getNormalizedPlaybackState()
          }));
          break;
        }

        case 'REQUEST_SYNC':
        case 'RESYNC': {
          webSocket.send(JSON.stringify({
            type: 'PLAYBACK_SYNC',
            playbackState: this.getNormalizedPlaybackState()
          }));
          break;
        }

        case 'TYPING': {
          const isTyping = Boolean(data.isTyping);
          const now = Date.now();
          if (isTyping) {
            this.typingUsers.set(member.user.id, {
              userId: member.user.id,
              username: member.user.username,
              expiresAt: now + 3500
            });
          } else {
            this.typingUsers.delete(member.user.id);
          }

          // Clean up expired typing entries
          for (const [uid, info] of this.typingUsers.entries()) {
            if (info.expiresAt < now) this.typingUsers.delete(uid);
          }

          this.broadcast({
            type: 'USER_TYPING',
            userId: member.user.id,
            username: member.user.username,
            isTyping
          }, webSocket);
          break;
        }

        case 'CHAT_SEND': {
          const rawText = (data.text || '').trim();
          if (!rawText) break;

          // Rate limit: 1 message per 1.5 seconds per user
          const now = Date.now();
          const lastChat = this.lastChatTimes.get(member.user.id) || 0;
          if (now - lastChat < 1500) {
            webSocket.send(JSON.stringify({
              type: 'ERROR',
              message: 'Slow down! Please wait a moment before sending another message.'
            }));
            break;
          }
          this.lastChatTimes.set(member.user.id, now);

          // Check if user is currently timed out from chat
          const timeoutExp = this.timeouts.get(member.user.id);
          if (timeoutExp && timeoutExp > Date.now()) {
            const remainingSec = Math.ceil((timeoutExp - Date.now()) / 1000);
            const remainingMin = Math.ceil(remainingSec / 60);
            webSocket.send(JSON.stringify({
              type: 'ERROR',
              message: `You are temporarily timed out from chat. Remaining: ${remainingMin}m (${remainingSec}s).`
            }));
            break;
          }

          // Enforce 300 characters limit
          if (rawText.length > 300) {
            webSocket.send(JSON.stringify({
              type: 'ERROR',
              message: 'Message cannot exceed 300 characters.'
            }));
            break;
          }

          const text = rawText.slice(0, 300);
          const clientMessageId = typeof data.clientMessageId === 'string' ? data.clientMessageId.trim() : undefined;
          const authId = 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(7);
          const nowMs = Date.now();

          const chatMsg: ChatMessage = {
            id: authId,
            clientMessageId,
            sender: {
              id: member.user.id,
              username: member.user.username,
              full_name: member.user.full_name || member.user.username,
              avatar_url: member.user.avatar_url,
              is_moderator: member.user.is_moderator,
              is_super_admin: member.user.is_super_admin,
            },
            text,
            timestamp: nowMs
          };

          this.chatLogs.push(chatMsg);
          if (this.chatLogs.length > 50) this.chatLogs.shift();

          // Persist to D1
          if (this.env.DB && this.roomId) {
            try {
              await this.env.DB.prepare(
                `INSERT INTO chat_messages (id, client_message_id, room_id, sender_id, sender_name, sender_avatar, sender_is_moderator, sender_is_super_admin, text, is_ai, ai_name, is_system, timestamp_ms)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, '', 0, ?)`
              ).bind(
                chatMsg.id,
                clientMessageId || '',
                this.roomId,
                member.user.id,
                member.user.full_name || member.user.username,
                member.user.avatar_url || '',
                member.user.is_moderator ? 1 : 0,
                member.user.is_super_admin ? 1 : 0,
                text,
                nowMs
              ).run();
            } catch (e) {
              console.warn('Failed saving chat message to D1:', e);
            }
          }

          this.broadcast({ type: 'CHAT_RECEIVE', message: chatMsg });

          // ── AI BOTS LIVE CHAT INTEGRATION (KIRA & LEO) ──
          const botCheck = isAIBotCommand(text);
          if (botCheck.isBot && botCheck.botName) {
            const targetBot = botCheck.botName;
            const botUserId = targetBot === 'Kira' ? 'kira-ai' : 'leo-ai';
            const botFullName = targetBot === 'Kira' ? 'Kira 🤖' : 'Leo 🎧';
            const botAvatar = targetBot === 'Kira'
              ? 'https://api.dicebear.com/7.x/bottts/svg?seed=kira-ai'
              : 'https://api.dicebear.com/7.x/bottts/svg?seed=leo-ai';

            // 1. Broadcast realistic bot typing indicator
            this.broadcast({
              type: 'USER_TYPING',
              userId: botUserId,
              username: targetBot,
              isTyping: true
            });

            processAIBotMessage({
              botName: targetBot,
              messageId: `${targetBot.toLowerCase()}-req-` + chatMsg.id,
              userId: member.user.id,
              username: member.user.username,
              rawText: text,
              env: this.env
            }).then(async (botResult) => {
              // 2. Natural human typing delay based on message length (snappy 300ms - 700ms)
              const delay = Math.min(700, Math.max(300, (botResult.reply?.length || 20) * 6));
              await new Promise((r) => setTimeout(r, delay));

              // 3. Clear typing indicator
              this.broadcast({
                type: 'USER_TYPING',
                userId: botUserId,
                username: targetBot,
                isTyping: false
              });

              if (botResult.isBot && botResult.reply) {
                const botTimestamp = Date.now();
                const aiChatMessage: ChatMessage = {
                  id: `${targetBot.toLowerCase()}-` + botTimestamp + '-' + Math.random().toString(36).substring(7),
                  sender: {
                    id: botUserId,
                    username: targetBot,
                    full_name: botFullName,
                    avatar_url: botAvatar,
                    is_moderator: true,
                  },
                  text: botResult.reply,
                  isAI: true,
                  aiName: targetBot,
                  timestamp: botTimestamp
                };

                this.chatLogs.push(aiChatMessage);
                if (this.chatLogs.length > 50) this.chatLogs.shift();

                // Persist AI bot message to D1
                if (this.env.DB && this.roomId) {
                  this.env.DB.prepare(
                    `INSERT INTO chat_messages (id, client_message_id, room_id, sender_id, sender_name, sender_avatar, sender_is_moderator, sender_is_super_admin, text, is_ai, ai_name, is_system, timestamp_ms)
                     VALUES (?, '', ?, ?, ?, ?, 1, 0, ?, 1, ?, 0, ?)`
                  ).bind(
                    aiChatMessage.id,
                    this.roomId,
                    botUserId,
                    botFullName,
                    botAvatar,
                    botResult.reply,
                    targetBot,
                    botTimestamp
                  ).run().catch(() => {});
                }

                this.broadcast({ type: 'CHAT_RECEIVE', message: aiChatMessage });
              }
            }).catch((err) => {
              // Clear typing indicator on error
              this.broadcast({
                type: 'USER_TYPING',
                userId: botUserId,
                username: targetBot,
                isTyping: false
              });
              console.warn(`[RoomDurableObject] ${targetBot} AI processing error:`, err);
            });
          }
          break;
        }

        case 'ADD_QUEUE':
        case 'QUEUE_ADD': {
          if (this.playSourceType === 'YOUTUBE_URL') {
            webSocket.send(JSON.stringify({ type: 'ERROR', message: 'Queue is disabled for dedicated YouTube stream rooms.' }));
            break;
          }

          const videoData = data.video || data;
          const videoId = videoData.videoId || data.videoId;
          if (!videoId) {
            webSocket.send(JSON.stringify({ type: 'ERROR', message: 'Invalid video ID' }));
            break;
          }

          let songTitle = videoData.title || data.title || '';
          let songArtist = videoData.artist || data.artist || '';
          let songThumb = videoData.thumbnail || data.thumbnail || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
          let songDuration = videoData.durationSeconds || data.durationSeconds || 240;

          // 1. Primary: Check if song is in central music_catalog in D1
          if (this.env.DB) {
            try {
              const dbSong: any = await this.env.DB.prepare(
                `SELECT * FROM music_catalog WHERE youtube_video_id = ? AND is_active = 1 LIMIT 1`
              ).bind(videoId).first();

              if (dbSong) {
                songTitle = dbSong.song_name ? `${dbSong.song_name} — ${dbSong.album_or_movie || dbSong.artist}` : dbSong.title;
                songArtist = dbSong.artist || songArtist;
                songThumb = dbSong.thumbnail_url || songThumb;
                songDuration = dbSong.duration_seconds || songDuration;
              }
            } catch (e) {
              console.warn('Error querying music_catalog for queue item:', e);
            }
          }

          // 2. Fallback: If no title yet, check oEmbed
          if (!songTitle) {
            try {
              const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
              if (oembedRes.ok) {
                const oData: any = await oembedRes.json();
                songTitle = oData.title || 'Live Song';
                songArtist = oData.author_name || 'Official';
                if (oData.thumbnail_url) songThumb = oData.thumbnail_url;
              }
            } catch (e) {}
          }

          const newItem: QueueItem = {
            id: 'q-' + Date.now() + '-' + Math.random().toString(36).substring(7),
            videoId,
            title: songTitle || 'Queued Track',
            artist: songArtist || 'Artist',
            thumbnail: songThumb,
            addedBy: member.user.username,
            durationSeconds: songDuration
          };

          this.playbackState.queue.push(newItem);

          // Save to D1 queue
          if (this.env.DB && this.roomId) {
            try {
              await this.env.DB.prepare(
                `INSERT INTO room_queue (id, room_id, video_id, title, artist, thumbnail, duration_seconds, added_by, order_index)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
              ).bind(newItem.id, this.roomId, newItem.videoId, newItem.title, newItem.artist, newItem.thumbnail, newItem.durationSeconds, newItem.addedBy, this.playbackState.queue.length).run();
            } catch (e) {
              console.warn('Failed persisting queue to D1:', e);
            }
          }

          // Broadcast real-time queue update to all room members
          this.broadcast({
            type: 'QUEUE_UPDATED',
            queue: this.playbackState.queue,
            addedItem: newItem
          });

          this.broadcast({
            type: 'PLAYBACK_SYNC',
            playbackState: this.getNormalizedPlaybackState()
          });
          break;
        }

        case 'TRACK_ENDED': {
          // If this is a dedicated YouTube Live stream, mark stream as ended (do NOT switch to other songs!)
          if (this.playSourceType === 'YOUTUBE_URL') {
            this.isStreamEnded = true;
            this.playbackState.isPlaying = false;
            if (this.env.DB && this.roomId) {
              await this.env.DB.prepare(
                `UPDATE rooms SET is_playing = 0 WHERE id = ?`
              ).bind(this.roomId).run().catch(() => {});
            }
            this.broadcast({
              type: 'STREAM_ENDED',
              message: 'The YouTube Live stream has ended.'
            });
            this.broadcast({
              type: 'PLAYBACK_SYNC',
              playbackState: this.getNormalizedPlaybackState()
            });
            break;
          }

          // Duplicate advance guard: only advance if videoId matches current track
          const endedVideoId = data.videoId || '';
          const currentVideoId = this.playbackState.currentVideo?.videoId || '';
          if (endedVideoId && endedVideoId !== currentVideoId) {
            console.log('[RoomDurableObject] Ignoring stale TRACK_ENDED for', endedVideoId, '(current:', currentVideoId, ')');
            break;
          }
          if (endedVideoId && endedVideoId === this.lastAdvancedVideoId) {
            console.log('[RoomDurableObject] Duplicate TRACK_ENDED for', endedVideoId, '— already advanced.');
            break;
          }
          this.lastAdvancedVideoId = currentVideoId;
          this.consecutiveFailures = 0;
          await this.advanceQueue();
          this.broadcast({
            type: 'PLAYBACK_SYNC',
            playbackState: this.getNormalizedPlaybackState()
          });
          break;
        }

        case 'TRACK_FAILED': {
          // For dedicated YouTube Live streams, ignore transient player errors to prevent premature stream end
          if (this.playSourceType === 'YOUTUBE_URL') {
            console.log('[RoomDurableObject] Transient error reported for live stream', data.videoId, '— ignoring to keep live room active.');
            break;
          }

          // Duplicate advance guard
          const failedVideoId = data.videoId || '';
          const curVideoId = this.playbackState.currentVideo?.videoId || '';
          if (failedVideoId && failedVideoId !== curVideoId) {
            break;
          }
          if (failedVideoId && failedVideoId === this.lastAdvancedVideoId) {
            break;
          }
          // Cache failed video and disable it in central D1 music_catalog
          if (failedVideoId) {
            this.failedVideoIds.add(failedVideoId);
            if (this.env.DB) {
              recordSongFailure(this.env.DB, failedVideoId, 'Playback failed during live room stream').catch(() => {});
            }
          }
          this.lastAdvancedVideoId = curVideoId;
          this.consecutiveFailures = (this.consecutiveFailures || 0) + 1;
          if (this.consecutiveFailures > 5) {
            console.warn('[RoomDurableObject] Max consecutive track failures reached (5). Pausing auto-skip.');
            break;
          }
          await this.advanceQueue();
          this.broadcast({
            type: 'PLAYBACK_SYNC',
            playbackState: this.getNormalizedPlaybackState()
          });
          break;
        }

        case 'PLAYER_ACTION': {
          if (data.action === 'SEEK') {
            this.playbackState.seekPosition = data.seekPosition;
            this.playbackState.startTimestamp = Date.now();
          } else if (data.action === 'TOGGLE_PLAY') {
            this.playbackState.isPlaying = data.isPlaying;
            this.playbackState.startTimestamp = Date.now();
          } else if (data.action === 'SKIP') {
            if (this.playSourceType !== 'YOUTUBE_URL') {
              await this.advanceQueue();
            }
          }

          this.broadcast({
            type: 'PLAYBACK_SYNC',
            playbackState: this.getNormalizedPlaybackState()
          });
          break;
        }

        case 'BLOCK_USER': {
          const targetUserId = data.targetUserId;
          if (targetUserId && targetUserId !== member.user.id) {
            this.blockedUsers.add(targetUserId);
            this.broadcast({ type: 'USER_BLOCKED', targetUserId });
          }
          break;
        }

        case 'CHAT_DELETE': {
          const messageId = data.messageId;
          const isAuthorized = member.user.is_moderator || member.user.is_super_admin || member.user.id === this.ownerId;
          if (!isAuthorized || !messageId) {
            webSocket.send(JSON.stringify({ type: 'ERROR', message: 'You do not have permission to delete chat messages.' }));
            break;
          }

          this.chatLogs = this.chatLogs.filter(m => m.id !== messageId);
          if (this.env.DB) {
            this.env.DB.prepare(`DELETE FROM chat_messages WHERE id = ?`).bind(messageId).run().catch(() => {});
          }

          this.broadcast({
            type: 'CHAT_DELETED',
            messageId,
            deletedBy: member.user.full_name || member.user.username
          });
          break;
        }

        case 'USER_TIMEOUT': {
          const targetUserId = data.targetUserId;
          const durationMinutes = Math.min(1440, Math.max(1, parseInt(data.durationMinutes || '5', 10)));
          const reason = (data.reason || 'Violation of live chat rules').trim();
          const isAuthorized = member.user.is_moderator || member.user.is_super_admin || member.user.id === this.ownerId;

          if (!isAuthorized || !targetUserId) {
            webSocket.send(JSON.stringify({ type: 'ERROR', message: 'You do not have permission to timeout users.' }));
            break;
          }

          const expiresAt = Date.now() + (durationMinutes * 60 * 1000);
          this.timeouts.set(targetUserId, expiresAt);

          // Find target user name & notify them
          let targetName = 'User';
          for (const [ws, m] of this.members.entries()) {
            if (m.user.id === targetUserId) {
              targetName = m.user.full_name || m.user.username;
              ws.send(JSON.stringify({
                type: 'TIMED_OUT',
                expiresAt,
                durationMinutes,
                reason,
                message: `You have been timed out from chat for ${durationMinutes} minutes: ${reason}`
              }));
            }
          }

          const sysMsg: ChatMessage = {
            id: 'msg-sys-' + Date.now(),
            sender: { id: 'sys', username: 'System', full_name: 'System', avatar_url: '' },
            text: `⏳ ${targetName} was placed on a ${durationMinutes}m timeout. Reason: ${reason}`,
            isSystem: true,
            timestamp: Date.now()
          };
          this.chatLogs.push(sysMsg);
          if (this.chatLogs.length > 50) this.chatLogs.shift();

          if (this.env.DB && this.roomId) {
            this.env.DB.prepare(
              `INSERT INTO chat_messages (id, client_message_id, room_id, sender_id, sender_name, sender_avatar, sender_is_moderator, sender_is_super_admin, text, is_ai, ai_name, is_system, timestamp_ms)
               VALUES (?, '', ?, 'sys', 'System', '', 0, 0, ?, 0, '', 1, ?)`
            ).bind(sysMsg.id, this.roomId, sysMsg.text, sysMsg.timestamp).run().catch(() => {});
          }

          this.broadcast({
            type: 'USER_TIMED_OUT',
            targetUserId,
            expiresAt,
            durationMinutes,
            reason,
            systemMessage: sysMsg
          });
          break;
        }

        case 'KICK_USER': {
          const targetUserId = data.targetUserId;
          const isAuthorized = member.user.is_moderator || member.user.is_super_admin || member.user.id === this.ownerId;
          if (!isAuthorized || !targetUserId) {
            webSocket.send(JSON.stringify({ type: 'ERROR', message: 'You do not have permission to kick users.' }));
            break;
          }

          for (const [ws, m] of this.members.entries()) {
            if (m.user.id === targetUserId) {
              ws.send(JSON.stringify({
                type: 'ROOM_ENDED',
                message: 'You have been removed from the room by a moderator.'
              }));
              try { ws.close(1000, 'Kicked by moderator'); } catch (e) {}
            }
          }
          break;
        }

        case 'MAKE_MODERATOR': {
          const targetUserId = data.targetUserId;
          const isSuperAdmin = member.user.is_super_admin || (member.user.id === this.ownerId);
          if (!isSuperAdmin || !targetUserId) {
            webSocket.send(JSON.stringify({ type: 'ERROR', message: 'Unauthorized: Only Super Admin can assign moderators.' }));
            break;
          }

          for (const [ws, m] of this.members.entries()) {
            if (m.user.id === targetUserId || m.user.id.toLowerCase() === targetUserId.toLowerCase()) {
              m.user.is_moderator = true;
            }
          }

          this.broadcast({
            type: 'MODERATOR_UPDATED',
            targetUserId,
            isModerator: true
          });
          break;
        }

        case 'REMOVE_MODERATOR': {
          const targetUserId = data.targetUserId;
          const isSuperAdmin = member.user.is_super_admin || (member.user.id === this.ownerId);
          if (!isSuperAdmin || !targetUserId) {
            webSocket.send(JSON.stringify({ type: 'ERROR', message: 'Unauthorized: Only Super Admin can remove moderators.' }));
            break;
          }

          for (const [ws, m] of this.members.entries()) {
            if (m.user.id === targetUserId || m.user.id.toLowerCase() === targetUserId.toLowerCase()) {
              m.user.is_moderator = false;
            }
          }

          this.broadcast({
            type: 'MODERATOR_UPDATED',
            targetUserId,
            isModerator: false
          });
          break;
        }
      }
    } catch (err) {
      console.error('Error in webSocketMessage:', err);
    }
  }

  async webSocketClose(webSocket: WebSocket) {
    const member = this.members.get(webSocket);
    if (member) {
      this.members.delete(webSocket);
      this.lastChatTimes.delete(member.user.id);

      if (this.typingUsers.has(member.user.id)) {
        this.typingUsers.delete(member.user.id);
        this.broadcast({
          type: 'USER_TYPING',
          userId: member.user.id,
          username: member.user.username,
          isTyping: false
        });
      }

      if (this.env.DB && member.sessionId) {
        try {
          await this.env.DB.prepare(
            `DELETE FROM room_presence WHERE session_id = ?`
          ).bind(member.sessionId).run();
        } catch (e) {
          console.warn('Error deleting presence row:', e);
        }
      }

      this.broadcast({
        type: 'MEMBER_LEFT',
        userId: member.user.id,
        username: member.user.username,
        memberCount: this.members.size
      });
    }
  }

  private async advanceQueue(): Promise<void> {
    // Dedicated YouTube URL live streams must NEVER advance to other songs
    if (this.playSourceType === 'YOUTUBE_URL') {
      return;
    }

    const apiKey = this.env.YOUTUBE_API_KEY || '';

    // Record previous video in recent history to prevent immediate repetition
    if (this.playbackState.currentVideo?.videoId) {
      this.recentPlayedVideoIds.push(this.playbackState.currentVideo.videoId);
      if (this.recentPlayedVideoIds.length > 25) {
        this.recentPlayedVideoIds.shift();
      }
    }

    // ── 1. USER QUEUE (HIGHEST PRIORITY) ──
    // If users have added songs to the queue, play them first in order!
    if (this.playbackState.queue.length > 0) {
      const nextItem = this.playbackState.queue.shift()!;

      // Remove from D1 queue
      if (this.env.DB && this.roomId) {
        try {
          await this.env.DB.prepare(`DELETE FROM room_queue WHERE id = ?`).bind(nextItem.id).run();
        } catch (e) { console.warn('Error removing queue item from D1:', e); }
      }

      this.playbackState.currentVideo = nextItem;
      this.playbackState.isPlaying = true;
      this.playbackState.startTimestamp = Date.now();
      this.playbackState.seekPosition = 0;

      // Broadcast user queue update so frontend immediately shows the remaining user queue
      this.broadcast({
        type: 'QUEUE_UPDATED',
        queue: this.playbackState.queue,
        nowPlaying: this.playbackState.currentVideo
      });
    } else {
      // ── 2. APP QUEUE (BACKGROUND FALLBACK) ──
      // If user queue is empty, smoothly fallback to continuous theme catalog music
      await this.advanceToThemeCatalogTrack();
      this.playbackState.isPlaying = true;
      this.playbackState.startTimestamp = Date.now();
      this.playbackState.seekPosition = 0;

      this.broadcast({
        type: 'QUEUE_UPDATED',
        queue: [],
        nowPlaying: this.playbackState.currentVideo
      });
    }

    this.playbackState.isPlaying = true;
    this.playbackState.startTimestamp = Date.now();
    this.playbackState.seekPosition = 0;

    await this.state.storage.put('startTimestamp', this.playbackState.startTimestamp);
    await this.state.storage.put('currentVideo', this.playbackState.currentVideo);
    await this.rescheduleAlarm();

    if (this.env.DB && this.roomId && this.playbackState.currentVideo) {
      try {
        await this.env.DB.prepare(
          `UPDATE rooms 
           SET current_video_id = ?, current_title = ?, current_artist = ?, current_thumbnail = ?, started_at = datetime('now')
           WHERE id = ?`
        ).bind(
          this.playbackState.currentVideo.videoId,
          this.playbackState.currentVideo.title,
          this.playbackState.currentVideo.artist || '',
          this.playbackState.currentVideo.thumbnail || '',
          this.roomId
        ).run();
      } catch (e) {
        console.warn('Error updating room playback in D1:', e);
      }
    }
  }

  private async advanceToThemeCatalogTrack() {
    const theme = this.playbackState.theme || 'BOLLYWOOD';
    const currentVideoId = this.playbackState.currentVideo?.videoId || '';

    // 1. PRIMARY: Query central active music_catalog in D1
    if (this.env.DB) {
      try {
        const { results } = await this.env.DB.prepare(
          `SELECT * FROM music_catalog 
           WHERE theme = ? 
           AND is_active = 1 AND playable_status = 'PLAYABLE'
           ORDER BY RANDOM() LIMIT 25`
        ).bind(theme).all();

        if (results && results.length > 0) {
          let candidates = (results as any[]).filter(row => 
            row.youtube_video_id !== currentVideoId && 
            !this.recentPlayedVideoIds.includes(row.youtube_video_id) && 
            !this.failedVideoIds.has(row.youtube_video_id)
          );

          // If all songs played, reset history and loop cleanly
          if (candidates.length === 0) {
            this.recentPlayedVideoIds = currentVideoId ? [currentVideoId] : [];
            candidates = (results as any[]).filter(row => 
              row.youtube_video_id !== currentVideoId && 
              !this.failedVideoIds.has(row.youtube_video_id)
            );
          }

          if (candidates.length > 0) {
            const row = candidates[Math.floor(Math.random() * candidates.length)];
            this.playbackState.currentVideo = {
              id: 'mc-' + Date.now(),
              videoId: row.youtube_video_id,
              title: row.song_name ? `${row.song_name} — ${row.album_or_movie || row.artist}` : row.title,
              artist: row.artist,
              thumbnail: row.thumbnail_url || `https://img.youtube.com/vi/${row.youtube_video_id}/hqdefault.jpg`,
              addedBy: 'Hangloop Auto',
              durationSeconds: row.duration_seconds || 240
            };

            // Update last_played_at in D1
            this.env.DB.prepare(
              `UPDATE music_catalog SET last_played_at = datetime('now') WHERE youtube_video_id = ?`
            ).bind(row.youtube_video_id).run().catch(() => {});

            return;
          }
        }
      } catch (e) {
        console.warn('Error fetching from music_catalog in D1:', e);
      }

      // 2. SECONDARY: Query theme_catalog fallback table
      try {
        const { results } = await this.env.DB.prepare(
          `SELECT * FROM theme_catalog WHERE theme = ? ORDER BY RANDOM() LIMIT 15`
        ).bind(theme).all();

        if (results && results.length > 0) {
          let candidates = (results as any[]).filter(row => 
            row.video_id !== currentVideoId && 
            !this.recentPlayedVideoIds.includes(row.video_id) && 
            !this.failedVideoIds.has(row.video_id)
          );

          if (candidates.length === 0) {
            this.recentPlayedVideoIds = currentVideoId ? [currentVideoId] : [];
            candidates = (results as any[]).filter(row => 
              row.video_id !== currentVideoId && 
              !this.failedVideoIds.has(row.video_id)
            );
          }

          if (candidates.length > 0) {
            const row = candidates[Math.floor(Math.random() * candidates.length)];
            this.playbackState.currentVideo = {
              id: 'tc-' + Date.now(),
              videoId: row.video_id,
              title: row.title,
              artist: row.artist,
              thumbnail: row.thumbnail || `https://img.youtube.com/vi/${row.video_id}/hqdefault.jpg`,
              addedBy: 'Hangloop Auto',
              durationSeconds: row.duration_seconds || 240
            };
            return;
          }
        }
      } catch (e) {
        console.warn('Error fetching theme catalog from D1:', e);
      }
    }

    // 3. TERTIARY: 100% Verified Playable Real YouTube Tracks Pool
    const BUILTIN_POOL: Record<string, Array<{ videoId: string; title: string; artist: string; duration: number }>> = {
      BOLLYWOOD: [
        { videoId: 'BddP6PYo2gs', title: 'Kesariya — Brahmāstra', artist: 'Arijit Singh, Pritam', duration: 268 },
        { videoId: 'T94PHkuydcw', title: 'Kun Faya Kun — Rockstar', artist: 'A.R. Rahman, Javed Ali', duration: 473 },
        { videoId: 'hoNb6HuNmU0', title: 'Khairiyat — Chhichhore', artist: 'Arijit Singh, Pritam', duration: 280 },
        { videoId: 'Umqb9KENgmk', title: 'Tum Hi Ho — Aashiqui 2', artist: 'Arijit Singh, Mithoon', duration: 262 },
        { videoId: '95I5VaR7GeU', title: 'Laila Main Laila — Raees', artist: 'Pawni Pandey, Ram Sampath', duration: 230 },
        { videoId: 'YxWlaYCA8MU', title: 'Jhoome Jo Pathaan — Pathaan', artist: 'Arijit Singh, Sukriti Kakar', duration: 202 },
        { videoId: 'JFcgOboQZ08', title: 'Dilbar — Satyameva Jayate', artist: 'Neha Kakkar, Dhvani Bhanushali', duration: 184 },
        { videoId: 'tLqtnGLfm4Q', title: 'Tum Hi Aana — Marjaavaan', artist: 'Jubin Nautiyal, Payal Dev', duration: 249 },
        { videoId: 'x6Q7c9RyMzk', title: 'Rowdy Baby — Maari 2', artist: 'Dhanush, Sai Pallavi', duration: 284 },
        { videoId: 'v7TK_w8-v0A', title: 'Apna Bana Le — Bhediya', artist: 'Arijit Singh, Sachin-Jigar', duration: 261 }
      ],
      PUNJABI: [
        { videoId: 'hjWf8A0YNSE', title: 'High Rated Gabru — Guru Randhawa', artist: 'Guru Randhawa', duration: 215 },
        { videoId: 'dZ0fwJojhrs', title: 'Lahore — Guru Randhawa', artist: 'Guru Randhawa', duration: 200 },
        { videoId: 'NbyHNASFi6U', title: 'Blue Eyes — Yo Yo Honey Singh', artist: 'Yo Yo Honey Singh', duration: 220 },
        { videoId: 'dHsV56I1GwE', title: 'Dope Shope — Yo Yo Honey Singh', artist: 'Yo Yo Honey Singh', duration: 195 },
        { videoId: 'PaDaoNnOQaM', title: 'Mauja Hi Mauja — Mika Singh', artist: 'Mika Singh', duration: 244 },
        { videoId: '_KhQT-LGb-4', title: 'Aankh Marey — Mika Singh', artist: 'Mika Singh, Neha Kakkar', duration: 205 },
        { videoId: 'dCmp56tSSmA', title: 'Born To Shine — Diljit Dosanjh', artist: 'Diljit Dosanjh', duration: 213 },
        { videoId: 'cl0a3i2wFcc', title: 'G.O.A.T. — Diljit Dosanjh', artist: 'Diljit Dosanjh', duration: 223 },
        { videoId: 'cWMxCE2HTag', title: 'Softly — Karan Aujla', artist: 'Karan Aujla, Ikky', duration: 155 },
        { videoId: 'vX2cDW8LUWk', title: 'Excuses — AP Dhillon', artist: 'AP Dhillon, Gurinder Gill', duration: 176 },
        { videoId: '4tywp83zkmk', title: 'Cheques — Shubh', artist: 'Shubh', duration: 183 },
        { videoId: '6RrEQJNZwPQ', title: 'No Love — Shubh', artist: 'Shubh', duration: 170 },
        { videoId: 'xR3V5Ow2dTI', title: 'Baller — Shubh', artist: 'Shubh, Ikky', duration: 148 },
        { videoId: 'n_FCrCQ6-bA', title: '295 — Sidhu Moose Wala', artist: 'Sidhu Moose Wala', duration: 270 }
      ],
      LOFI_CHILL: [
        { videoId: 'jfKfPfyJRdk', title: 'Lofi Hip Hop Radio', artist: 'Lofi Girl', duration: 600 },
        { videoId: '60ItHLz5WEA', title: 'Faded Lo-Fi Mix', artist: 'Alan Walker', duration: 212 },
        { videoId: 'tLqtnGLfm4Q', title: 'Tum Hi Aana (Lofi Acoustic)', artist: 'Jubin Nautiyal', duration: 249 },
        { videoId: 'hoNb6HuNmU0', title: 'Khairiyat (Midnight Chill)', artist: 'Arijit Singh', duration: 280 },
        { videoId: 'BddP6PYo2gs', title: 'Kesariya (Lofi Vibe)', artist: 'Arijit Singh', duration: 268 }
      ],
      TRENDING: [
        { videoId: 'hOHKltAiKXQ', title: 'Big Dawgs — Hanumankind', artist: 'Hanumankind, Kalmi', duration: 232 },
        { videoId: '4tywp83zkmk', title: 'Cheques — Shubh', artist: 'Shubh', duration: 183 },
        { videoId: 'JGwWNGJdvx8', title: 'Shape of You — Ed Sheeran', artist: 'Ed Sheeran', duration: 233 },
        { videoId: 'kJQP7kiw5Fk', title: 'Despacito — Luis Fonsi', artist: 'Luis Fonsi, Daddy Yankee', duration: 282 },
        { videoId: 'OPf0YbXqDm0', title: 'Uptown Funk — Bruno Mars', artist: 'Mark Ronson ft. Bruno Mars', duration: 270 },
        { videoId: '9bZkp7q19f0', title: 'Gangnam Style — PSY', artist: 'PSY', duration: 252 },
        { videoId: '2Vv-BfVoq4g', title: 'Perfect — Ed Sheeran', artist: 'Ed Sheeran', duration: 263 },
        { videoId: 'YQHsXMglC9A', title: 'Hello — Adele', artist: 'Adele', duration: 367 },
        { videoId: 'RgKAFK5djSk', title: 'See You Again — Wiz Khalifa', artist: 'Wiz Khalifa ft. Charlie Puth', duration: 237 }
      ]
    };

    const pool = BUILTIN_POOL[theme] || BUILTIN_POOL.BOLLYWOOD;
    let available = pool.filter(p => p.videoId !== currentVideoId && !this.recentPlayedVideoIds.includes(p.videoId) && !this.failedVideoIds.has(p.videoId));
    if (available.length === 0) {
      this.recentPlayedVideoIds = currentVideoId ? [currentVideoId] : [];
      available = pool.filter(p => p.videoId !== currentVideoId && !this.failedVideoIds.has(p.videoId));
    }
    const chosen = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : pool[0];

    this.playbackState.currentVideo = {
      id: 'tc-builtin-' + Date.now(),
      videoId: chosen.videoId,
      title: chosen.title,
      artist: chosen.artist,
      thumbnail: `https://img.youtube.com/vi/${chosen.videoId}/hqdefault.jpg`,
      addedBy: 'Hangloop Auto',
      durationSeconds: chosen.duration
    };
  }

  private getNormalizedPlaybackState(): PlaybackState {
    let currentSeek = this.playbackState.seekPosition || 0;
    if (this.playbackState.isPlaying && this.playbackState.startTimestamp) {
      const elapsedSeconds = (Date.now() - this.playbackState.startTimestamp) / 1000;
      currentSeek += Math.max(0, elapsedSeconds);
    }
    return {
      ...this.playbackState,
      isStreamEnded: this.isStreamEnded,
      seekPosition: Math.max(0, currentSeek)
    };
  }

  private broadcast(payload: any, excludeWs?: WebSocket) {
    const jsonStr = JSON.stringify(payload);
    for (const ws of this.members.keys()) {
      if (ws !== excludeWs) {
        try {
          ws.send(jsonStr);
        } catch (e) {
          // Socket closed/stale
          this.members.delete(ws);
        }
      }
    }
  }
}
