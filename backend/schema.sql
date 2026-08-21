-- Cloudflare D1 Database Schema for Hangloop Live Music Platform

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, -- Immutable User ID (e.g. ULP8F2K9X7)
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    bio TEXT DEFAULT 'Listening on Hangloop',
    avatar_url TEXT DEFAULT '',
    is_subscribed INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS email_verifications (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    otp_hash TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    expires_at DATETIME NOT NULL,
    verified_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_policy_acceptances (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    policy_type TEXT NOT NULL, -- COMMUNITY_RULES, TERMS_SERVICES, PRIVACY_POLICY
    policy_version TEXT NOT NULL DEFAULT '1.0',
    accepted_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    theme TEXT NOT NULL, -- BOLLYWOOD, HOLLYWOOD, OLD_HINDI, PUNJABI, LOFI_CHILL
    category TEXT DEFAULT 'Music',
    is_private INTEGER DEFAULT 0,
    password TEXT DEFAULT '',
    music_enabled INTEGER DEFAULT 1,
    max_members INTEGER DEFAULT 100,
    current_video_id TEXT DEFAULT '',
    current_title TEXT DEFAULT '',
    current_artist TEXT DEFAULT '',
    current_thumbnail TEXT DEFAULT '',
    play_source_type TEXT DEFAULT 'APP_DB', -- APP_DB (Queue Enabled), YOUTUBE_URL (Queue Disabled)
    source_youtube_url TEXT DEFAULT '',
    tags TEXT DEFAULT '[]',
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_playing INTEGER DEFAULT 1,
    seek_position REAL DEFAULT 0,
    created_by TEXT NOT NULL DEFAULT 'system',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS room_presence (
    session_id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    username TEXT DEFAULT 'Guest',
    avatar_url TEXT DEFAULT '',
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS room_queue (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    video_id TEXT NOT NULL,
    title TEXT NOT NULL,
    artist TEXT DEFAULT 'Unknown',
    thumbnail TEXT DEFAULT '',
    duration_seconds INTEGER DEFAULT 0,
    added_by TEXT NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    client_message_id TEXT DEFAULT '',
    room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
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
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room_time ON chat_messages(room_id, created_at DESC);

-- CENTRAL MUSIC CATALOG TABLE
CREATE TABLE IF NOT EXISTS music_catalog (
    id TEXT PRIMARY KEY,
    youtube_video_id TEXT UNIQUE NOT NULL,
    youtube_url TEXT NOT NULL,
    canonical_url TEXT NOT NULL,
    title TEXT NOT NULL,
    song_name TEXT NOT NULL,
    artist TEXT NOT NULL,
    album_or_movie TEXT DEFAULT '',
    release_year INTEGER DEFAULT 2020,
    language TEXT DEFAULT 'Hindi',
    theme TEXT NOT NULL, -- BOLLYWOOD, OLD_HINDI, PUNJABI, HOLLYWOOD, LOFI_CHILL
    thumbnail_url TEXT DEFAULT '',
    channel_name TEXT DEFAULT '',
    channel_id TEXT DEFAULT '',
    duration_seconds INTEGER DEFAULT 240,
    published_at TEXT DEFAULT '',
    embed_url TEXT DEFAULT '',
    is_embeddable INTEGER DEFAULT 1,
    youtube_status TEXT DEFAULT 'AVAILABLE',
    playable_status TEXT DEFAULT 'PLAYABLE', -- PLAYABLE, FAILED, DISABLED
    last_checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_played_at DATETIME,
    failure_count INTEGER DEFAULT 0,
    last_failure_reason TEXT,
    validation_version TEXT DEFAULT '1.0',
    source TEXT DEFAULT 'GEMINI', -- GEMINI, YOUTUBE_SEARCH, MANUAL
    added_by TEXT DEFAULT 'SUPER_ADMIN',
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_music_catalog_video_id ON music_catalog(youtube_video_id);
CREATE INDEX IF NOT EXISTS idx_music_catalog_theme_status ON music_catalog(theme, is_active, playable_status);
CREATE INDEX IF NOT EXISTS idx_music_catalog_playable ON music_catalog(is_active, playable_status);

CREATE INDEX IF NOT EXISTS idx_room_queue_room ON room_queue(room_id, order_index);
CREATE INDEX IF NOT EXISTS idx_room_presence_room ON room_presence(room_id, last_seen);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room_id, created_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token, expires_at);

CREATE TABLE IF NOT EXISTS song_requests (
    id TEXT PRIMARY KEY,
    query TEXT NOT NULL,
    clean_title TEXT,
    requested_by TEXT NOT NULL,
    user_email TEXT,
    status TEXT DEFAULT 'PENDING', -- PENDING, COMPLETED, REJECTED
    synced_song_id TEXT,
    failure_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_song_requests_status ON song_requests(status);
CREATE INDEX IF NOT EXISTS idx_song_requests_query ON song_requests(query);

CREATE TABLE IF NOT EXISTS theme_catalog (
    id TEXT PRIMARY KEY,
    theme TEXT NOT NULL,
    video_id TEXT NOT NULL,
    title TEXT NOT NULL,
    artist TEXT DEFAULT 'Official',
    thumbnail TEXT DEFAULT '',
    duration_seconds INTEGER DEFAULT 240
);

CREATE TABLE IF NOT EXISTS user_blocks (
    blocker_id TEXT NOT NULL,
    blocked_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (blocker_id, blocked_id)
);

CREATE TABLE IF NOT EXISTS user_reports (
    id TEXT PRIMARY KEY,
    reporter_id TEXT NOT NULL,
    target_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    details TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS otps (
    email TEXT PRIMARY KEY,
    otp_code TEXT NOT NULL,
    expires_at DATETIME NOT NULL
);

-- PRE-SEED THE 4 OFFICIAL 24/7 LIVE ROOMS
INSERT OR REPLACE INTO rooms (id, name, theme, category, is_private, music_enabled, max_members, current_video_id, current_title, current_artist, current_thumbnail, play_source_type, created_by)
VALUES 
  (
    'room-bollywood-hindi', 
    'Bollywood Hindi Music Live', 
    'BOLLYWOOD', 
    'Bollywood', 
    0, 1, 500, 
    'BddP6PYo2gs', 
    'Kesariya — Brahmāstra', 
    'Arijit Singh / Pritam', 
    'assets/room_bollywood_3d.jpg', 
    'APP_DB',
    'system'
  ),
  (
    'room-punjabi-hits', 
    'Punjabi Hits Live', 
    'PUNJABI', 
    'Punjabi', 
    0, 1, 500, 
    'vX2cDW8LUWk', 
    'Excuses — AP Dhillon', 
    'AP Dhillon', 
    'assets/room_punjabi_3d.jpg', 
    'APP_DB',
    'system'
  ),
  (
    'room-lofi-chill', 
    'Lo-Fi Chill Beats Live', 
    'LOFI_CHILL', 
    'Lo-Fi & Chill', 
    0, 1, 500, 
    'jfKfPfyJRdk', 
    'Lofi Hip Hop Radio — Beats to Relax/Study to', 
    'Lofi Girl', 
    'assets/room_lofi_3d.jpg', 
    'APP_DB',
    'system'
  ),
  (
    'room-instagram-trending', 
    'Instagram Trending Songs Live', 
    'TRENDING', 
    'Instagram Viral & Trending', 
    0, 1, 500, 
    'hOHKltAiKXQ', 
    'Big Dawgs — Hanumankind', 
    'Hanumankind, Kalmi', 
    'assets/room_trending_3d.jpg', 
    'APP_DB',
    'system'
  );
