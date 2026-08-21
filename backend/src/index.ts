import { RoomDurableObject } from './RoomDurableObject';
import { fetchYouTubeMetadata, validateVideoTheme } from './themeValidator';
import { sendGmailOTP } from './gmailMailer';
import { verifySuperAdmin } from './adminAuth';
import {
  getCatalogStats,
  getSongsList,
  addSongToCatalog,
  addBatchToCatalog,
  toggleSongStatus,
  deleteSong,
  runDiscoveryAndPreview,
  resyncCatalog,
  searchCatalog,
  createSongRequest,
  getSongRequests,
  syncRequestedSong,
  seedFullCatalog,
  backfillCatalogDurations
} from './catalogService';
import { processKiraMessage, ensureKiraTables } from './kiraService';

export { RoomDurableObject };

export interface Env {
  DB: D1Database;
  R2_BUCKET: R2Bucket;
  ROOM_DO: DurableObjectNamespace;
  AI?: any; // Cloudflare Workers AI Binding (Ai)
  YOUTUBE_API_KEY?: string;
  GEMINI_API_KEY?: string;
  GMAIL_EMAIL?: string;
  GMAIL_APP_PASSWORD?: string;
}

// SHA-256 Helper for OTP Hashing
async function hashString(str: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate Immutable User ID (e.g. ULP8F2K9X7)
function generateUserId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'ULP';
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Ensure All Tables & Schema
let tablesInitialized = false;
async function ensureAllTables(db: D1Database) {
  if (!db || tablesInitialized) return;
  const queries = [
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      bio TEXT DEFAULT 'Listening on Hangloop',
      avatar_url TEXT DEFAULT '',
      is_subscribed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS user_sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS moderators (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      email TEXT NOT NULL,
      can_delete_messages INTEGER DEFAULT 1,
      can_timeout_users INTEGER DEFAULT 1,
      can_kick_users INTEGER DEFAULT 1,
      is_active INTEGER DEFAULT 1,
      created_by TEXT DEFAULT 'milansharma942105@gmail.com',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS chat_timeouts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      room_id TEXT,
      expires_at DATETIME NOT NULL,
      reason TEXT,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS room_presence (
      session_id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      username TEXT DEFAULT 'Guest',
      avatar_url TEXT DEFAULT '',
      last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      client_message_id TEXT DEFAULT '',
      room_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      sender_avatar TEXT DEFAULT '',
      sender_is_moderator INTEGER DEFAULT 0,
      sender_is_super_admin INTEGER DEFAULT 0,
      text TEXT NOT NULL,
      is_ai INTEGER DEFAULT 0,
      ai_name TEXT DEFAULT '',
      is_system INTEGER DEFAULT 0,
      timestamp_ms INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS user_reports (
      id TEXT PRIMARY KEY,
      reporter_id TEXT NOT NULL,
      target_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      details TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS user_blocks (
      blocker_id TEXT NOT NULL,
      blocked_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (blocker_id, blocked_id)
    )`,
    `CREATE TABLE IF NOT EXISTS song_requests (
      id TEXT PRIMARY KEY,
      query TEXT NOT NULL,
      clean_title TEXT,
      requested_by TEXT NOT NULL,
      user_email TEXT,
      status TEXT DEFAULT 'PENDING',
      synced_song_id TEXT,
      failure_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME
    )`,
    `CREATE INDEX IF NOT EXISTS idx_room_queue_room ON room_queue(room_id, order_index)`,
    `CREATE INDEX IF NOT EXISTS idx_room_presence_room ON room_presence(room_id, last_seen)`,
    `CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room_id, created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_chat_messages_room_time ON chat_messages(room_id, created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token, expires_at)`,
    `CREATE INDEX IF NOT EXISTS idx_music_catalog_theme_status ON music_catalog(theme, is_active, playable_status)`
  ];

  for (const q of queries) {
    try {
      await db.prepare(q).run();
    } catch (e) {
      console.warn('Error creating table with query:', q.slice(0, 40), e);
    }
  }

  // Idempotent Migration: Inspect existing chat_messages table and safely add any missing columns
  try {
    const { results: columns } = await db.prepare(`PRAGMA table_info(chat_messages)`).all();
    const existingColNames = new Set((columns || []).map((c: any) => c.name));

    const requiredColumns = [
      { name: 'client_message_id', type: 'TEXT DEFAULT \'\'' },
      { name: 'sender_is_moderator', type: 'INTEGER DEFAULT 0' },
      { name: 'sender_is_super_admin', type: 'INTEGER DEFAULT 0' },
      { name: 'is_ai', type: 'INTEGER DEFAULT 0' },
      { name: 'ai_name', type: 'TEXT DEFAULT \'\'' },
      { name: 'is_system', type: 'INTEGER DEFAULT 0' },
      { name: 'timestamp_ms', type: 'INTEGER' }
    ];

    for (const col of requiredColumns) {
      if (!existingColNames.has(col.name)) {
        await db.prepare(`ALTER TABLE chat_messages ADD COLUMN ${col.name} ${col.type}`).run().catch((err) => {
          console.warn(`Could not add column ${col.name}:`, err);
        });
      }
    }

    // Idempotent Migration: Ensure tags column in rooms table
    const { results: roomCols } = await db.prepare(`PRAGMA table_info(rooms)`).all();
    const existingRoomCols = new Set((roomCols || []).map((c: any) => c.name));
    if (!existingRoomCols.has('tags')) {
      await db.prepare(`ALTER TABLE rooms ADD COLUMN tags TEXT DEFAULT '[]'`).run().catch((err) => {
        console.warn('Could not add tags column to rooms:', err);
      });
    }
  } catch (e) {
    console.warn('Error during chat_messages / rooms PRAGMA migration:', e);
  }
  tablesInitialized = true;
}

async function ensureModerationTables(db: D1Database) {
  return ensureAllTables(db);
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // CORS Headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      await ensureAllTables(env.DB);
      // 1. WebSocket Route to Room Durable Object
      if (url.pathname.startsWith('/api/ws/room/')) {
        const roomId = url.pathname.replace('/api/ws/room/', '');
        if (!roomId) {
          return new Response('Missing room ID', { status: 400, headers: corsHeaders });
        }

        const id = env.ROOM_DO.idFromName(roomId);
        const stub = env.ROOM_DO.get(id);
        const newUrl = new URL(request.url);
        newUrl.pathname = '/websocket';
        newUrl.searchParams.set('roomId', roomId);
        return stub.fetch(new Request(newUrl.toString(), request));
      }

      // 2. Presence Heartbeat Route
      if (url.pathname === '/api/presence/heartbeat' && request.method === 'POST') {
        const body = await request.json() as any;
        const { roomId, userId, username, sessionId } = body;

        if (roomId && sessionId) {
          await env.DB.prepare(
            `INSERT INTO room_presence (session_id, room_id, user_id, username, last_seen)
             VALUES (?, ?, ?, ?, datetime('now'))
             ON CONFLICT(session_id) DO UPDATE SET last_seen = datetime('now')`
          ).bind(sessionId, roomId, userId || 'guest', username || 'Guest').run();
        }

        ctx.waitUntil(
          Promise.all([
            env.DB.prepare(`DELETE FROM room_presence WHERE last_seen < datetime('now', '-45 seconds')`).run(),
            env.DB.prepare(`DELETE FROM chat_messages WHERE created_at < datetime('now', '-2 hours')`).run()
          ])
        );

        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // 3. Rooms API: List Real Live Rooms with Active Presence Viewer Counts
      if (url.pathname === '/api/rooms' && request.method === 'GET') {
        const { results: roomRows } = await env.DB.prepare(
          `SELECT * FROM rooms WHERE is_private = 0 ORDER BY created_at ASC`
        ).all();

        const rooms = await Promise.all(
          (roomRows || []).map(async (r: any) => {
            const countRow: any = await env.DB.prepare(
              `SELECT COUNT(DISTINCT session_id) as viewer_count 
               FROM room_presence 
               WHERE room_id = ? AND last_seen > datetime('now', '-30 seconds')`
            ).bind(r.id).first();

            const realViewers = countRow ? countRow.viewer_count : 0;

            let parsedTags: string[] = [];
            try {
              parsedTags = JSON.parse(r.tags || '[]');
            } catch (e) {
              parsedTags = r.theme ? [r.theme] : [];
            }
            if (parsedTags.length === 0 && r.theme) {
              parsedTags = [r.theme];
            }

            return {
              id: r.id,
              name: r.name,
              theme: r.theme || 'BOLLYWOOD',
              tags: parsedTags,
              category: r.category || 'Music',
              is_private: r.is_private === 1,
              music_enabled: r.music_enabled === 1,
              max_members: r.max_members || 500,
              created_by: r.created_by || 'system',
              active_viewers: Math.max(1, realViewers),
              current_video_id: r.current_video_id || '',
              current_title: r.current_title || '',
              current_artist: r.current_artist || '',
              current_thumbnail: r.current_thumbnail || '',
              play_source_type: r.play_source_type || 'APP_DB',
              source_youtube_url: r.source_youtube_url || '',
              thumbnail_url: r.current_thumbnail || `https://img.youtube.com/vi/${r.current_video_id}/hqdefault.jpg`
            };
          })
        );

        return new Response(JSON.stringify({ rooms }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // 4. Validate and Add Song to Queue
      if (url.pathname === '/api/queue/add' && request.method === 'POST') {
        const body = await request.json() as any;
        const { roomId, videoId, theme } = body;

        if (!videoId || !roomId) {
          return new Response(JSON.stringify({ error: 'Missing videoId or roomId' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const apiKey = env.YOUTUBE_API_KEY || '';
        const meta = await fetchYouTubeMetadata(videoId, apiKey);

        if (!meta) {
          return new Response(JSON.stringify({
            valid: false,
            error: 'Song Rejected: Could not fetch YouTube video details or video is restricted.'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const targetTheme = theme || 'BOLLYWOOD';
        const validation = validateVideoTheme(targetTheme, meta);

        if (!validation.valid) {
          return new Response(JSON.stringify({
            valid: false,
            error: validation.reason || "Song Rejected: This song doesn't match the theme of this live room."
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        return new Response(JSON.stringify({ valid: true, metadata: meta }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // ──────────────────────────────────────────────────────────────
      // 5. SUPER ADMIN: Music Catalog APIs (milansharma942105@gmail.com)
      // ──────────────────────────────────────────────────────────────

      // GET /api/admin/catalog/stats
      if (url.pathname === '/api/admin/catalog/stats' && request.method === 'GET') {
        const auth = await verifySuperAdmin(request, env);
        if (!auth.isSuperAdmin) {
          return new Response(JSON.stringify({ error: auth.error || 'Forbidden: Super Admin only' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        let stats = await getCatalogStats(env.DB);
        if (stats.playable === 0) {
          try {
            await seedFullCatalog(env.DB);
            stats = await getCatalogStats(env.DB);
          } catch (e) {
            console.warn('Auto-seed catalog warning:', e);
          }
        }
        return new Response(JSON.stringify({ success: true, stats }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // GET /api/admin/catalog/songs
      if (url.pathname === '/api/admin/catalog/songs' && request.method === 'GET') {
        const auth = await verifySuperAdmin(request, env);
        if (!auth.isSuperAdmin) {
          return new Response(JSON.stringify({ error: auth.error || 'Forbidden: Super Admin only' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const page = parseInt(url.searchParams.get('page') || '1', 10);
        const limit = parseInt(url.searchParams.get('limit') || '20', 10);
        const search = url.searchParams.get('search') || '';
        const theme = url.searchParams.get('theme') || 'ALL';
        const status = url.searchParams.get('status') || 'ALL';

        const result = await getSongsList(env.DB, { page, limit, search, theme, status });
        return new Response(JSON.stringify({ success: true, ...result }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // POST /api/admin/catalog/discover-preview (Gemini Discovery & Validation Preview)
      if (url.pathname === '/api/admin/catalog/discover-preview' && request.method === 'POST') {
        const auth = await verifySuperAdmin(request, env);
        if (!auth.isSuperAdmin) {
          return new Response(JSON.stringify({ error: auth.error || 'Forbidden: Super Admin only' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const body = await request.json() as any;
        const geminiKey = body.geminiApiKey || env.GEMINI_API_KEY || '';
        if (!geminiKey) {
          return new Response(JSON.stringify({ error: 'Gemini API Key is required for discovery' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const ytKey = env.YOUTUBE_API_KEY || '';
        const preview = await runDiscoveryAndPreview(env.DB, geminiKey, ytKey, body.prompt);

        return new Response(JSON.stringify({ success: true, preview }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // POST /api/admin/catalog/add-batch (Add verified batch)
      if (url.pathname === '/api/admin/catalog/add-batch' && request.method === 'POST') {
        const auth = await verifySuperAdmin(request, env);
        if (!auth.isSuperAdmin) {
          return new Response(JSON.stringify({ error: auth.error || 'Forbidden: Super Admin only' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const { songs } = await request.json() as { songs: any[] };
        if (!Array.isArray(songs) || songs.length === 0) {
          return new Response(JSON.stringify({ error: 'No songs provided' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const result = await addBatchToCatalog(env.DB, songs);
        return new Response(JSON.stringify({ success: true, result }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // POST /api/admin/catalog/add-single (Add / Validate single song manually)
      if (url.pathname === '/api/admin/catalog/add-single' && request.method === 'POST') {
        const auth = await verifySuperAdmin(request, env);
        if (!auth.isSuperAdmin) {
          return new Response(JSON.stringify({ error: auth.error || 'Forbidden: Super Admin only' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const songData = await request.json() as any;
        const ytKey = env.YOUTUBE_API_KEY || '';
        const result = await addSongToCatalog(env.DB, songData, ytKey);

        return new Response(JSON.stringify(result), {
          status: result.success ? 200 : 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // POST /api/admin/catalog/toggle-status
      if (url.pathname === '/api/admin/catalog/toggle-status' && request.method === 'POST') {
        const auth = await verifySuperAdmin(request, env);
        if (!auth.isSuperAdmin) {
          return new Response(JSON.stringify({ error: auth.error || 'Forbidden: Super Admin only' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const { songId, status } = await request.json() as { songId: string; status: 'PLAYABLE' | 'DISABLED' | 'FAILED' };
        if (!songId || !status) {
          return new Response(JSON.stringify({ error: 'Missing songId or status' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        await toggleSongStatus(env.DB, songId, status);
        return new Response(JSON.stringify({ success: true, message: `Song status updated to ${status}` }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // DELETE /api/admin/catalog/songs
      if (url.pathname === '/api/admin/catalog/songs' && request.method === 'DELETE') {
        const auth = await verifySuperAdmin(request, env);
        if (!auth.isSuperAdmin) {
          return new Response(JSON.stringify({ error: auth.error || 'Forbidden: Super Admin only' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const songId = url.searchParams.get('id') || '';
        if (!songId) {
          return new Response(JSON.stringify({ error: 'Missing song id parameter' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        await deleteSong(env.DB, songId);
        return new Response(JSON.stringify({ success: true, message: 'Song removed from catalog' }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // POST /api/admin/catalog/resync (Intelligent non-destructive sync)
      if (url.pathname === '/api/admin/catalog/resync' && request.method === 'POST') {
        const auth = await verifySuperAdmin(request, env);
        if (!auth.isSuperAdmin) {
          return new Response(JSON.stringify({ error: auth.error || 'Forbidden: Super Admin only' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const body = (await request.json().catch(() => ({}))) as any;
        const geminiKey = body.geminiApiKey || env.GEMINI_API_KEY || '';
        const ytKey = env.YOUTUBE_API_KEY || '';

        const result = await resyncCatalog(env.DB, geminiKey, ytKey);
        return new Response(JSON.stringify({ success: true, result }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // POST /api/admin/catalog/seed (Seed 100% verified tracks into D1 database)
      if (url.pathname === '/api/admin/catalog/seed' && (request.method === 'POST' || request.method === 'GET')) {
        const seeded = await seedFullCatalog(env.DB);
        return new Response(JSON.stringify({ success: true, seeded, message: `Successfully seeded ${seeded} verified songs into catalog.` }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // POST /api/admin/catalog/backfill-durations (Backfill real durations via YouTube Data API)
      if (url.pathname === '/api/admin/catalog/backfill-durations' && request.method === 'POST') {
        const auth = await verifySuperAdmin(request, env);
        if (!auth.isSuperAdmin) {
          return new Response(JSON.stringify({ error: auth.error || 'Forbidden: Super Admin only' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const ytKey = env.YOUTUBE_API_KEY || '';
        const result = await backfillCatalogDurations(env.DB, ytKey);
        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // ──────────────────────────────────────────────────────────────
      // 6. PUBLIC CATALOG SEARCH (For In-Room Queue DB Search)
      // ──────────────────────────────────────────────────────────────

      // GET /api/catalog/search?q=...&theme=...
      if (url.pathname === '/api/catalog/search' && request.method === 'GET') {
        const query = url.searchParams.get('q') || '';
        const theme = url.searchParams.get('theme') || 'ALL';
        const limit = parseInt(url.searchParams.get('limit') || '25', 10);

        const songs = await searchCatalog(env.DB, query, theme, limit);
        return new Response(JSON.stringify({ success: true, songs }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // POST /api/song-requests (Users request missing songs)
      if (url.pathname === '/api/song-requests' && request.method === 'POST') {
        const body = (await request.json().catch(() => ({}))) as any;
        const { query, requested_by, user_email } = body;

        if (!query || !query.trim()) {
          return new Response(JSON.stringify({ error: 'Song query cannot be empty' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        try {
          const result = await createSongRequest(env.DB, query, requested_by || 'Anonymous', user_email);
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        } catch (e: any) {
          return new Response(JSON.stringify({ error: e.message || 'Failed to submit song request' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
      }

      // ──────────────────────────────────────────────────────────────
      // KIRA AI LIVE CHAT ENDPOINT (POST /api/chat/kira)
      // ──────────────────────────────────────────────────────────────
      if (url.pathname === '/api/chat/kira' && request.method === 'POST') {
        const body = (await request.json().catch(() => ({}))) as any;
        const { messageId, userId, message, username } = body;

        const effectiveUserId = userId || 'anonymous';
        const rawText = message || '';

        const result = await processKiraMessage({
          messageId: messageId || `kira-http-${Date.now()}`,
          userId: effectiveUserId,
          username: username || 'User',
          rawText,
          env
        });

        if (!result.isKira) {
          return new Response(JSON.stringify({
            success: false,
            reason: 'not_kira_command',
            reply: 'Command must start with !kira'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        return new Response(JSON.stringify({
          success: result.success,
          reply: result.reply,
          reason: result.reason
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // ──────────────────────────────────────────────────────────────
      // 7. SUPER ADMIN: Song Requests Hub
      // ──────────────────────────────────────────────────────────────

      // GET /api/admin/song-requests
      if (url.pathname === '/api/admin/song-requests' && request.method === 'GET') {
        const auth = await verifySuperAdmin(request, env);
        if (!auth.isSuperAdmin) {
          return new Response(JSON.stringify({ error: auth.error || 'Forbidden: Super Admin only' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const status = url.searchParams.get('status') || 'ALL';
        const limit = parseInt(url.searchParams.get('limit') || '50', 10);
        const data = await getSongRequests(env.DB, status, limit);

        return new Response(JSON.stringify({ success: true, ...data }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // POST /api/admin/song-requests/sync (AI / Verification sync for requested song)
      if (url.pathname === '/api/admin/song-requests/sync' && request.method === 'POST') {
        const auth = await verifySuperAdmin(request, env);
        if (!auth.isSuperAdmin) {
          return new Response(JSON.stringify({ error: auth.error || 'Forbidden: Super Admin only' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const body = (await request.json().catch(() => ({}))) as any;
        const { requestId } = body;

        if (!requestId) {
          return new Response(JSON.stringify({ error: 'Missing requestId' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        try {
          const ytKey = env.YOUTUBE_API_KEY || '';
          const geminiKey = env.GEMINI_API_KEY || '';
          const result = await syncRequestedSong(env.DB, requestId, geminiKey, ytKey);

          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        } catch (e: any) {
          return new Response(JSON.stringify({ error: e.message || 'Failed to sync requested song' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
      }

      // POST /api/admin/rooms/create (Super Admin Live Room Creation: App DB vs YouTube URL)
      if (url.pathname === '/api/admin/rooms/create' && request.method === 'POST') {
        const auth = await verifySuperAdmin(request, env);
        if (!auth.isSuperAdmin) {
          return new Response(JSON.stringify({ error: auth.error || 'Forbidden: Super Admin only' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const body = await request.json() as any;
        const { name, theme, play_source_type, source_youtube_url, thumbnail_url, tags } = body;

        if (!name || !name.trim()) {
          return new Response(JSON.stringify({ error: 'Room name is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const roomId = 'room-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
        const sourceType = play_source_type === 'YOUTUBE_URL' ? 'YOUTUBE_URL' : 'APP_DB';
        const targetTheme = (theme || 'BOLLYWOOD').toUpperCase();
        const roomTags = Array.isArray(tags) && tags.length > 0 ? tags : [targetTheme];

        let initialVideoId = 'BddP6PYo2gs';
        let initialTitle = name.trim();
        let initialArtist = 'Hangloop Live';
        let roomThumb = thumbnail_url || `https://img.youtube.com/vi/${initialVideoId}/hqdefault.jpg`;

        if (sourceType === 'YOUTUBE_URL') {
          if (!source_youtube_url || !source_youtube_url.trim()) {
            return new Response(JSON.stringify({ error: 'YouTube URL is required for dedicated stream mode' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          }

          // Extract Video ID
          const rawUrl = source_youtube_url.trim();
          let extractedId = '';
          if (/^[a-zA-Z0-9_-]{11}$/.test(rawUrl)) {
            extractedId = rawUrl;
          } else {
            const match = rawUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/);
            if (match && match[1]) {
              extractedId = match[1];
            }
          }

          if (!extractedId) {
            return new Response(JSON.stringify({ error: 'Invalid YouTube URL or Video ID. Please check the link.' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          }

          initialVideoId = extractedId;
          roomThumb = `https://img.youtube.com/vi/${extractedId}/hqdefault.jpg`;

          // Fetch title & author via oEmbed
          try {
            const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${extractedId}&format=json`);
            if (oembedRes.ok) {
              const oData = await oembedRes.json() as any;
              if (oData && oData.title) {
                initialTitle = oData.title;
                initialArtist = oData.author_name || 'YouTube Stream';
                if (oData.thumbnail_url) roomThumb = oData.thumbnail_url;
              }
            }
          } catch (e) {}
        } else {
          // APP_DB Mode: Pick verified playable song from music_catalog
          try {
            const dbSong: any = await env.DB.prepare(
              `SELECT * FROM music_catalog 
               WHERE theme = ? AND is_active = 1 AND playable_status = 'PLAYABLE'
               ORDER BY RANDOM() LIMIT 1`
            ).bind(targetTheme).first();

            if (dbSong) {
              initialVideoId = dbSong.youtube_video_id;
              initialTitle = dbSong.song_name ? `${dbSong.song_name} — ${dbSong.album_or_movie || dbSong.artist}` : dbSong.title;
              initialArtist = dbSong.artist || 'Hangloop Live';
              roomThumb = dbSong.thumbnail_url || `https://img.youtube.com/vi/${initialVideoId}/hqdefault.jpg`;
            }
          } catch (e) {}
        }

        try {
          await env.DB.prepare(
            `INSERT INTO rooms (
              id, name, theme, category, is_private, music_enabled, max_members,
              current_video_id, current_title, current_artist, current_thumbnail,
              play_source_type, source_youtube_url, tags, created_by
            ) VALUES (?, ?, ?, 'Music', 0, 1, 500, ?, ?, ?, ?, ?, ?, ?, ?)`
          ).bind(
            roomId,
            name.trim(),
            targetTheme,
            initialVideoId,
            initialTitle,
            initialArtist,
            roomThumb,
            sourceType,
            source_youtube_url || '',
            JSON.stringify(roomTags),
            auth.user?.id || 'system'
          ).run();

          return new Response(JSON.stringify({
            success: true,
            message: 'Live room created successfully',
            roomId,
            room: {
              id: roomId,
              name: name.trim(),
              theme: targetTheme,
              tags: roomTags,
              current_video_id: initialVideoId,
              current_title: initialTitle,
              current_artist: initialArtist,
              current_thumbnail: roomThumb,
              play_source_type: sourceType,
            }
          }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        } catch (dbErr: any) {
          console.error('Error inserting room into D1:', dbErr);
          return new Response(JSON.stringify({ error: dbErr.message || 'Database error creating room' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
      }

      // POST /api/admin/rooms/edit (Super Admin Live Room Edit: YouTube URL, Thumbnail, Custom Tags, Name)
      if (url.pathname === '/api/admin/rooms/edit' && request.method === 'POST') {
        const auth = await verifySuperAdmin(request, env);
        if (!auth.isSuperAdmin) {
          return new Response(JSON.stringify({ error: auth.error || 'Forbidden: Super Admin only' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const body = await request.json() as any;
        const { roomId, name, source_youtube_url, thumbnail_url, tags } = body;

        if (!roomId) {
          return new Response(JSON.stringify({ error: 'Room ID is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const existingRoom: any = await env.DB.prepare(
          `SELECT * FROM rooms WHERE id = ?`
        ).bind(roomId).first();

        if (!existingRoom) {
          return new Response(JSON.stringify({ error: 'Room not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        let updatedVideoId = existingRoom.current_video_id;
        let updatedTitle = existingRoom.current_title;
        let updatedArtist = existingRoom.current_artist;
        let updatedThumbnail = thumbnail_url !== undefined && thumbnail_url.trim() ? thumbnail_url.trim() : existingRoom.current_thumbnail;
        let updatedSourceUrl = source_youtube_url !== undefined && source_youtube_url.trim() ? source_youtube_url.trim() : existingRoom.source_youtube_url;
        let updatedName = name !== undefined && name.trim() ? name.trim() : existingRoom.name;
        let updatedTags = Array.isArray(tags) ? JSON.stringify(tags) : existingRoom.tags;

        // If YouTube URL changed, validate and extract new video ID & metadata
        if (source_youtube_url && source_youtube_url.trim() && source_youtube_url.trim() !== existingRoom.source_youtube_url) {
          const rawUrl = source_youtube_url.trim();
          let extractedId = '';
          if (/^[a-zA-Z0-9_-]{11}$/.test(rawUrl)) {
            extractedId = rawUrl;
          } else {
            const match = rawUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/);
            if (match && match[1]) {
              extractedId = match[1];
            }
          }

          if (!extractedId) {
            return new Response(JSON.stringify({ error: 'Invalid YouTube URL or Video ID.' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          }

          updatedVideoId = extractedId;
          updatedSourceUrl = rawUrl;
          if (!thumbnail_url || !thumbnail_url.trim()) {
            updatedThumbnail = `https://img.youtube.com/vi/${extractedId}/hqdefault.jpg`;
          }

          try {
            const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${extractedId}&format=json`);
            if (oembedRes.ok) {
              const oData = await oembedRes.json() as any;
              if (oData && oData.title) {
                updatedTitle = oData.title;
                updatedArtist = oData.author_name || 'YouTube Stream';
                if (!thumbnail_url && oData.thumbnail_url) updatedThumbnail = oData.thumbnail_url;
              }
            }
          } catch (e) {}
        }

        await env.DB.prepare(
          `UPDATE rooms 
           SET name = ?, current_video_id = ?, current_title = ?, current_artist = ?, current_thumbnail = ?, source_youtube_url = ?, tags = ?
           WHERE id = ?`
        ).bind(
          updatedName,
          updatedVideoId,
          updatedTitle,
          updatedArtist,
          updatedThumbnail,
          updatedSourceUrl,
          updatedTags,
          roomId
        ).run();

        // Forward updates to Durable Object so live clients receive instant updates
        try {
          const doId = env.ROOM_DO.idFromName(roomId);
          const stub = env.ROOM_DO.get(doId);
          await stub.fetch(new Request('https://do/update-room', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: updatedName,
              videoId: updatedVideoId,
              title: updatedTitle,
              artist: updatedArtist,
              thumbnail: updatedThumbnail,
              sourceUrl: updatedSourceUrl,
              tags: Array.isArray(tags) ? tags : JSON.parse(updatedTags || '[]')
            })
          }));
        } catch (doErr) {
          console.warn('Error updating Durable Object on room edit:', doErr);
        }

        return new Response(JSON.stringify({
          success: true,
          message: 'Room updated successfully',
          room: {
            id: roomId,
            name: updatedName,
            theme: existingRoom.theme,
            tags: Array.isArray(tags) ? tags : JSON.parse(updatedTags || '[]'),
            current_video_id: updatedVideoId,
            current_title: updatedTitle,
            current_artist: updatedArtist,
            current_thumbnail: updatedThumbnail,
            play_source_type: existingRoom.play_source_type,
            source_youtube_url: updatedSourceUrl
          }
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // POST /api/admin/rooms/delete (Super Admin Delete Live Room)
      if (url.pathname === '/api/admin/rooms/delete' && (request.method === 'POST' || request.method === 'DELETE')) {
        const auth = await verifySuperAdmin(request, env);
        if (!auth.isSuperAdmin) {
          return new Response(JSON.stringify({ error: auth.error || 'Forbidden: Super Admin only' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const body = (await request.json().catch(() => ({}))) as any;
        const roomId = body.roomId || url.searchParams.get('roomId') || url.searchParams.get('id');

        if (!roomId) {
          return new Response(JSON.stringify({ error: 'Room ID is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        // 1. Delete associated data in D1
        try {
          await env.DB.prepare(`DELETE FROM room_queue WHERE room_id = ?`).bind(roomId).run().catch(() => {});
          await env.DB.prepare(`DELETE FROM room_presence WHERE room_id = ?`).bind(roomId).run().catch(() => {});
          await env.DB.prepare(`DELETE FROM chat_messages WHERE room_id = ?`).bind(roomId).run().catch(() => {});
          await env.DB.prepare(`DELETE FROM rooms WHERE id = ?`).bind(roomId).run();
        } catch (dbErr: any) {
          console.error('Error deleting room from D1:', dbErr);
        }

        // 2. Notify Durable Object to close all active connections
        try {
          const doId = env.ROOM_DO.idFromName(roomId);
          const stub = env.ROOM_DO.get(doId);
          await stub.fetch(new Request('https://do/delete-room', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'This live room has been closed by admin.' })
          }));
        } catch (doErr) {
          console.warn('Error notifying Durable Object on room delete:', doErr);
        }

        return new Response(JSON.stringify({
          success: true,
          message: 'Live room deleted successfully',
          roomId
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // ──────────────────────────────────────────────────────────────
      // 6. AUTH: Send Real Gmail Email OTP
      // ──────────────────────────────────────────────────────────────
      if (url.pathname === '/api/auth/send-otp' && request.method === 'POST') {
        const { email } = await request.json() as { email: string };
        if (!email || !email.includes('@')) {
          return new Response(JSON.stringify({ error: 'Valid email address is required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const normalizedEmail = email.trim().toLowerCase();

        // Check if email already registered
        const existingUser = await env.DB.prepare(
          `SELECT id FROM users WHERE email = ?`
        ).bind(normalizedEmail).first();

        if (existingUser) {
          return new Response(JSON.stringify({ error: 'This email address is already registered. Please login.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        // Generate cryptographically secure random 6-digit OTP
        const randomBuffer = new Uint32Array(1);
        crypto.getRandomValues(randomBuffer);
        const otpCode = (100000 + (randomBuffer[0] % 900000)).toString();

        const otpHash = await hashString(otpCode);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 mins
        const verifyId = 'v-' + Date.now();

        // Store hashed OTP in D1
        await env.DB.prepare(
          `INSERT INTO email_verifications (id, email, otp_hash, attempts, expires_at)
           VALUES (?, ?, ?, 0, ?)`
        ).bind(verifyId, normalizedEmail, otpHash, expiresAt).run();

        // Send Real Gmail Email via SMTPS
        const gmailUser = env.GMAIL_EMAIL || '';
        const gmailPass = env.GMAIL_APP_PASSWORD || '';
        const mailRes = await sendGmailOTP(gmailUser, gmailPass, normalizedEmail, otpCode);

        if (!mailRes.success) {
          return new Response(JSON.stringify({ error: mailRes.error || 'Failed to send email verification OTP.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        return new Response(JSON.stringify({
          success: true,
          message: 'Verification code sent to your email address.'
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // 7. AUTH: Verify Email OTP
      if (url.pathname === '/api/auth/verify-otp' && request.method === 'POST') {
        const { email, otp } = await request.json() as { email: string; otp: string };
        if (!email || !otp) {
          return new Response(JSON.stringify({ error: 'Email and OTP are required.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const otpHash = await hashString(otp.trim());

        const record: any = await env.DB.prepare(
          `SELECT * FROM email_verifications 
           WHERE email = ? AND expires_at > datetime('now') AND verified_at IS NULL
           ORDER BY created_at DESC LIMIT 1`
        ).bind(normalizedEmail).first();

        if (!record) {
          return new Response(JSON.stringify({ error: 'Verification code expired or not found. Please request a new code.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        if (record.attempts >= 5) {
          return new Response(JSON.stringify({ error: 'Too many failed attempts. Please request a new code.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        if (record.otp_hash !== otpHash) {
          await env.DB.prepare(
            `UPDATE email_verifications SET attempts = attempts + 1 WHERE id = ?`
          ).bind(record.id).run();

          return new Response(JSON.stringify({ error: 'Incorrect verification code. Please check your email.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        // Mark OTP verified
        await env.DB.prepare(
          `UPDATE email_verifications SET verified_at = datetime('now') WHERE id = ?`
        ).bind(record.id).run();

        return new Response(JSON.stringify({ success: true, message: 'Email verified successfully.' }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // 8. AUTH: Complete User Registration
      if (url.pathname === '/api/auth/register' && request.method === 'POST') {
        const { fullName, username, email } = await request.json() as any;

        if (!fullName || !username || !email) {
          return new Response(JSON.stringify({ error: 'Full Name, Username, and Email are required.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const normalizedUsername = username.trim().toLowerCase();

        // Verify email was verified
        const verifiedRecord = await env.DB.prepare(
          `SELECT id FROM email_verifications WHERE email = ? AND verified_at IS NOT NULL`
        ).bind(normalizedEmail).first();

        if (!verifiedRecord) {
          return new Response(JSON.stringify({ error: 'Email has not been verified. Please verify OTP first.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        // Check Username uniqueness
        const existingUsername = await env.DB.prepare(
          `SELECT id FROM users WHERE LOWER(username) = ?`
        ).bind(normalizedUsername).first();

        if (existingUsername) {
          return new Response(JSON.stringify({ error: 'This username is already taken. Please choose another.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        // Generate Immutable Unique User ID (e.g. ULP8F2K9X7)
        const userId = generateUserId();
        const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${normalizedUsername}`;

        // Insert into D1 users table
        await env.DB.prepare(
          `INSERT INTO users (id, full_name, email, username, bio, avatar_url)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(userId, fullName.trim(), normalizedEmail, normalizedUsername, 'Listening on Hangloop', avatarUrl).run();

        // Record Legal Policy Acceptances
        const policyTypes = ['COMMUNITY_RULES', 'TERMS_SERVICES', 'PRIVACY_POLICY'];
        for (const pt of policyTypes) {
          await env.DB.prepare(
            `INSERT INTO user_policy_acceptances (id, user_id, policy_type, policy_version)
             VALUES (?, ?, ?, ?)`
          ).bind('pol-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4), userId, pt, '1.0').run();
        }

        // Create Session Token (Cryptographically Secure UUID)
        const token = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

        await env.DB.prepare(
          `INSERT INTO user_sessions (token, user_id, expires_at) VALUES (?, ?, ?)`
        ).bind(token, userId, expiresAt).run();

        const user = {
          id: userId,
          full_name: fullName.trim(),
          username: normalizedUsername,
          email: normalizedEmail,
          avatar_url: avatarUrl,
          bio: 'Listening on Hangloop'
        };

        return new Response(JSON.stringify({ success: true, user, token }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }


async function enrichUser(db: D1Database, baseUser: any) {
  const isSuperAdmin = (baseUser.email || '').toLowerCase().trim() === 'milansharma942105@gmail.com';
  let isModerator = isSuperAdmin;
  let moderatorPermissions = {
    can_delete_messages: true,
    can_timeout_users: true,
    can_kick_users: true
  };

  if (!isSuperAdmin && db) {
    try {
      await ensureModerationTables(db);
      const mod: any = await db.prepare(
        `SELECT * FROM moderators WHERE (user_id = ? OR LOWER(user_id) = ? OR LOWER(email) = ? OR LOWER(username) = ?) AND is_active = 1 LIMIT 1`
      ).bind(baseUser.id, (baseUser.id || '').toLowerCase(), (baseUser.email || '').toLowerCase(), (baseUser.username || '').toLowerCase()).first();
      if (mod) {
        isModerator = true;
        moderatorPermissions = {
          can_delete_messages: mod.can_delete_messages === 1,
          can_timeout_users: mod.can_timeout_users === 1,
          can_kick_users: mod.can_kick_users === 1
        };
      }
    } catch (e) {
      console.warn('Error checking moderator status:', e);
    }
  }

  return {
    ...baseUser,
    is_super_admin: isSuperAdmin,
    is_moderator: isModerator,
    moderator_permissions: isModerator ? moderatorPermissions : undefined
  };
}

      // 9. AUTH: Login Endpoint
      if (url.pathname === '/api/auth/login' && request.method === 'POST') {
        const { email } = await request.json() as { email: string };
        if (!email) {
          return new Response(JSON.stringify({ error: 'Email is required.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const rawUser: any = await env.DB.prepare(
          `SELECT id, full_name, username, email, avatar_url, bio FROM users WHERE email = ?`
        ).bind(normalizedEmail).first();

        if (!rawUser) {
          return new Response(JSON.stringify({ error: 'Account not found. Please click Register Today to sign up.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const token = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        await env.DB.prepare(
          `INSERT INTO user_sessions (token, user_id, expires_at) VALUES (?, ?, ?)`
        ).bind(token, rawUser.id, expiresAt).run();

        const user = await enrichUser(env.DB, rawUser);

        return new Response(JSON.stringify({ success: true, user, token }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // 10. AUTH: Session Validation (App Restore)
      if (url.pathname === '/api/auth/session' && request.method === 'GET') {
        const authHeader = request.headers.get('Authorization') || '';
        const token = authHeader.replace('Bearer ', '').trim();

        if (!token) {
          return new Response(JSON.stringify({ error: 'No session token provided' }), { status: 401, headers: corsHeaders });
        }

        const session: any = await env.DB.prepare(
          `SELECT s.token, u.id, u.full_name, u.username, u.email, u.avatar_url, u.bio
           FROM user_sessions s
           JOIN users u ON s.user_id = u.id
           WHERE s.token = ? AND s.expires_at > datetime('now')`
        ).bind(token).first();

        if (!session) {
          return new Response(JSON.stringify({ error: 'Session expired or invalid' }), { status: 401, headers: corsHeaders });
        }

        const user = await enrichUser(env.DB, {
          id: session.id,
          full_name: session.full_name,
          username: session.username,
          email: session.email,
          avatar_url: session.avatar_url,
          bio: session.bio
        });

        return new Response(JSON.stringify({
          success: true,
          user
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // 11. AUTH: Logout
      if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
        const authHeader = request.headers.get('Authorization') || '';
        const token = authHeader.replace('Bearer ', '').trim();
        if (token) {
          await env.DB.prepare(`DELETE FROM user_sessions WHERE token = ?`).bind(token).run();
        }
        return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      // 12. USER: Update Profile (Display Name / Full Name max 15 chars, bio, avatar)
      if (url.pathname === '/api/user/update-profile' && request.method === 'POST') {
        const authHeader = request.headers.get('Authorization') || '';
        const token = authHeader.replace('Bearer ', '').trim();

        if (!token) {
          return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
        }

        const session: any = await env.DB.prepare(
          `SELECT user_id FROM user_sessions WHERE token = ? AND expires_at > datetime('now')`
        ).bind(token).first();

        if (!session) {
          return new Response(JSON.stringify({ error: 'Invalid or expired session' }), { status: 401, headers: corsHeaders });
        }

        const body = await request.json() as any;
        const rawFullName = (body.fullName !== undefined ? body.fullName : body.full_name || '').trim();
        // Limit display name to max 15 characters, allowing all unicode / emoji / fancy characters without other restrictions
        const sanitizedFullName = rawFullName.slice(0, 15);
        const bio = body.bio !== undefined ? body.bio.trim() : '';
        const avatarUrl = body.avatarUrl || body.avatar_url || '';

        await env.DB.prepare(
          `UPDATE users SET full_name = ?, bio = ?, avatar_url = ? WHERE id = ?`
        ).bind(sanitizedFullName, bio, avatarUrl, session.user_id).run();

        const updatedRaw: any = await env.DB.prepare(
          `SELECT id, full_name, username, email, avatar_url, bio FROM users WHERE id = ?`
        ).bind(session.user_id).first();

        const user = await enrichUser(env.DB, updatedRaw);

        return new Response(JSON.stringify({ success: true, message: 'Profile updated successfully', user }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // 13. USER: Search Users
      if (url.pathname === '/api/users/search' && request.method === 'GET') {
        const query = (url.searchParams.get('q') || '').trim().toLowerCase();
        if (!query) {
          return new Response(JSON.stringify({ success: true, users: [] }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        await ensureModerationTables(env.DB);

        const searchPattern = `%${query}%`;
        const { results: userRows } = await env.DB.prepare(
          `SELECT id, full_name, username, email, avatar_url, bio FROM users
           WHERE LOWER(username) LIKE ? OR LOWER(full_name) LIKE ? OR LOWER(email) LIKE ? OR id LIKE ?
           LIMIT 20`
        ).bind(searchPattern, searchPattern, searchPattern, searchPattern).all();

        const users = await Promise.all(
          (userRows || []).map(async (u: any) => {
            const enriched = await enrichUser(env.DB, u);
            return enriched;
          })
        );

        return new Response(JSON.stringify({ success: true, users }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // 14. SUPER ADMIN: Moderator Management
      if (url.pathname === '/api/admin/moderators' && request.method === 'GET') {
        const auth = await verifySuperAdmin(request, env);
        if (!auth.isSuperAdmin) {
          return new Response(JSON.stringify({ error: auth.error || 'Forbidden: Super Admin only' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        await ensureModerationTables(env.DB);

        const { results: modRows } = await env.DB.prepare(
          `SELECT m.*, u.full_name, u.avatar_url
           FROM moderators m
           LEFT JOIN users u ON m.user_id = u.id
           ORDER BY m.created_at DESC`
        ).all();

        const moderators = (modRows || []).map((m: any) => ({
          id: m.id,
          user_id: m.user_id,
          username: m.username,
          full_name: m.full_name || m.username,
          email: m.email,
          avatar_url: m.avatar_url || '',
          can_delete_messages: m.can_delete_messages === 1,
          can_timeout_users: m.can_timeout_users === 1,
          can_kick_users: m.can_kick_users === 1,
          is_active: m.is_active === 1,
          created_at: m.created_at,
          updated_at: m.updated_at
        }));

        return new Response(JSON.stringify({ success: true, moderators }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // POST /api/admin/moderators (Add Moderator)
      if (url.pathname === '/api/admin/moderators' && request.method === 'POST') {
        const auth = await verifySuperAdmin(request, env);
        if (!auth.isSuperAdmin) {
          return new Response(JSON.stringify({ error: auth.error || 'Forbidden: Super Admin only' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        await ensureModerationTables(env.DB);
        const body = await request.json() as any;
        const rawSearch = (body.emailOrUsername || body.userId || body.username || body.email || '').trim();
        const targetSearch = rawSearch.replace(/^@/, '').toLowerCase();
        const rawUpper = rawSearch.toUpperCase();

        if (!targetSearch) {
          return new Response(JSON.stringify({ error: 'Please enter a username, email, or user ID to assign as moderator.' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        // 1. Find user in D1 users table (case-insensitive across ID, username, email, full_name)
        let targetUser: any = await env.DB.prepare(
          `SELECT id, full_name, username, email, avatar_url FROM users
           WHERE LOWER(email) = ? OR LOWER(username) = ? OR LOWER(id) = ? OR id = ? OR id = ? OR LOWER(full_name) = ? LIMIT 1`
        ).bind(targetSearch, targetSearch, targetSearch, rawSearch, rawUpper, targetSearch).first();

        // 2. If not found, search in chat_messages or room_presence
        if (!targetUser) {
          const chatSender: any = await env.DB.prepare(
            `SELECT sender_id, sender_name, sender_avatar FROM chat_messages
             WHERE LOWER(sender_id) = ? OR sender_id = ? OR sender_id = ? OR LOWER(sender_name) = ? LIMIT 1`
          ).bind(targetSearch, rawSearch, rawUpper, targetSearch).first();

          if (chatSender) {
            targetUser = {
              id: chatSender.sender_id,
              full_name: chatSender.sender_name,
              username: (chatSender.sender_name || 'user').toLowerCase().replace(/[^a-z0-9]/g, '') || `user_${chatSender.sender_id.slice(-4)}`,
              email: `${chatSender.sender_id.toLowerCase()}@hangloop.app`,
              avatar_url: chatSender.sender_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${chatSender.sender_id}`
            };

            // Auto-upsert into users table
            await env.DB.prepare(
              `INSERT INTO users (id, full_name, email, username, bio, avatar_url)
               VALUES (?, ?, ?, ?, 'Hangloop Member', ?)
               ON CONFLICT(id) DO NOTHING`
            ).bind(targetUser.id, targetUser.full_name, targetUser.email, targetUser.username, targetUser.avatar_url).run().catch(() => {});
          }
        }

        // 3. If still not found, build user from provided request details
        if (!targetUser && (body.username || body.userId || rawSearch)) {
          const uId = body.userId || rawSearch;
          const uName = body.full_name || body.username || rawSearch;
          const uUsername = (body.username || uName).toLowerCase().replace(/[^a-z0-9]/g, '') || `user_${uId.slice(-4)}`;
          const uEmail = body.email || `${uId.toLowerCase()}@hangloop.app`;
          const uAvatar = body.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uId}`;

          targetUser = {
            id: uId,
            full_name: uName,
            username: uUsername,
            email: uEmail,
            avatar_url: uAvatar
          };

          // Auto-upsert into users table
          await env.DB.prepare(
            `INSERT INTO users (id, full_name, email, username, bio, avatar_url)
             VALUES (?, ?, ?, ?, 'Hangloop Member', ?)
             ON CONFLICT(id) DO NOTHING`
          ).bind(targetUser.id, targetUser.full_name, targetUser.email, targetUser.username, targetUser.avatar_url).run().catch(() => {});
        }

        if (!targetUser) {
          return new Response(JSON.stringify({ error: `User "${rawSearch}" was not found. Make sure they have registered on Hangloop.` }), {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const canDelete = body.can_delete_messages !== undefined ? (body.can_delete_messages ? 1 : 0) : 1;
        const canTimeout = body.can_timeout_users !== undefined ? (body.can_timeout_users ? 1 : 0) : 1;
        const canKick = body.can_kick_users !== undefined ? (body.can_kick_users ? 1 : 0) : 1;

        // Check if already exists in moderators table
        const existingMod: any = await env.DB.prepare(
          `SELECT id FROM moderators WHERE user_id = ? OR email = ?`
        ).bind(targetUser.id, targetUser.email).first();

        if (existingMod) {
          await env.DB.prepare(
            `UPDATE moderators
             SET can_delete_messages = ?, can_timeout_users = ?, can_kick_users = ?, is_active = 1, updated_at = datetime('now')
             WHERE id = ?`
          ).bind(canDelete, canTimeout, canKick, existingMod.id).run();
        } else {
          const modId = 'mod-' + Date.now() + '-' + Math.random().toString(36).substring(7);
          await env.DB.prepare(
            `INSERT INTO moderators (id, user_id, username, email, can_delete_messages, can_timeout_users, can_kick_users, is_active)
             VALUES (?, ?, ?, ?, ?, ?, ?, 1)`
          ).bind(modId, targetUser.id, targetUser.username, targetUser.email, canDelete, canTimeout, canKick).run();
        }

        return new Response(JSON.stringify({
          success: true,
          message: `${targetUser.full_name || targetUser.username} is now assigned as a Moderator!`,
          moderator: {
            user_id: targetUser.id,
            username: targetUser.username,
            full_name: targetUser.full_name || targetUser.username,
            email: targetUser.email,
            avatar_url: targetUser.avatar_url,
            can_delete_messages: canDelete === 1,
            can_timeout_users: canTimeout === 1,
            can_kick_users: canKick === 1,
            is_active: true
          }
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // PUT /api/admin/moderators (Update Moderator Permissions / Toggle Active)
      if (url.pathname === '/api/admin/moderators' && request.method === 'PUT') {
        const auth = await verifySuperAdmin(request, env);
        if (!auth.isSuperAdmin) {
          return new Response(JSON.stringify({ error: auth.error || 'Forbidden: Super Admin only' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        await ensureModerationTables(env.DB);
        const body = await request.json() as any;
        const modId = body.id || body.moderatorId;

        if (!modId) {
          return new Response(JSON.stringify({ error: 'Missing moderator ID' }), { status: 400, headers: corsHeaders });
        }

        const canDelete = body.can_delete_messages !== undefined ? (body.can_delete_messages ? 1 : 0) : 1;
        const canTimeout = body.can_timeout_users !== undefined ? (body.can_timeout_users ? 1 : 0) : 1;
        const canKick = body.can_kick_users !== undefined ? (body.can_kick_users ? 1 : 0) : 1;
        const isActive = body.is_active !== undefined ? (body.is_active ? 1 : 0) : 1;

        await env.DB.prepare(
          `UPDATE moderators
           SET can_delete_messages = ?, can_timeout_users = ?, can_kick_users = ?, is_active = ?, updated_at = datetime('now')
           WHERE id = ? OR user_id = ?`
        ).bind(canDelete, canTimeout, canKick, isActive, modId, modId).run();

        return new Response(JSON.stringify({ success: true, message: 'Moderator permissions updated' }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // DELETE /api/admin/moderators (Remove Moderator)
      if (url.pathname === '/api/admin/moderators' && request.method === 'DELETE') {
        const auth = await verifySuperAdmin(request, env);
        if (!auth.isSuperAdmin) {
          return new Response(JSON.stringify({ error: auth.error || 'Forbidden: Super Admin only' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        await ensureModerationTables(env.DB);
        const modId = url.searchParams.get('id') || '';

        if (!modId) {
          return new Response(JSON.stringify({ error: 'Missing moderator ID' }), { status: 400, headers: corsHeaders });
        }

        await env.DB.prepare(`DELETE FROM moderators WHERE id = ? OR user_id = ?`).bind(modId, modId).run();

        return new Response(JSON.stringify({ success: true, message: 'Moderator removed successfully' }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // 15. User Moderation: Report & Block
      if (url.pathname === '/api/user/report' && request.method === 'POST') {
        const body = await request.json() as any;
        const reportId = 'rep-' + Date.now();
        await env.DB.prepare(
          `INSERT INTO user_reports (id, reporter_id, target_id, reason, details)
           VALUES (?, ?, ?, ?, ?)`
        ).bind(reportId, body.reporter_id || 'anonymous', body.target_id, body.reason, body.details || '').run();

        return new Response(JSON.stringify({ success: true, message: 'Report submitted' }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      if (url.pathname === '/api/user/block' && request.method === 'POST') {
        const body = await request.json() as any;
        const { blocker_id, blocked_id } = body;
        if (blocker_id && blocked_id) {
          await env.DB.prepare(
            `INSERT OR IGNORE INTO user_blocks (blocker_id, blocked_id) VALUES (?, ?)`
          ).bind(blocker_id, blocked_id).run();
        }
        return new Response(JSON.stringify({ success: true, message: 'User blocked' }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      return new Response('API endpoint not found', { status: 404, headers: corsHeaders });
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
    }
  }
};
