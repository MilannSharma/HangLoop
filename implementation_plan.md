# Cloudflare D1 + R2 Live Music Platform — Implementation Plan

Transform the existing Hangloop UI into a real, serverless live music platform using **Cloudflare D1**, **Cloudflare R2**, **Cloudflare Workers**, and **Durable Objects**.

---

## Infrastructure Overview

```text
Frontend / Mobile App (Expo Web / React Native)
               │
               ▼ HTTP REST & WebSocket Connections
Cloudflare Worker API Layer (`backend/src/index.ts`)
               │
      ┌────────┴────────────────────────┬────────────────────────┐
      ▼                                 ▼                        ▼
Cloudflare D1 DB              Room Durable Object           Cloudflare R2
(Rooms, Presence, Queue,     (Real-Time Sync, Chat,         (Avatars, Thumbnails,
 Chat, Users, Catalog)        Presence Heartbeats)           Persistent Assets)
```

---

## Phase 1: Cloudflare D1 Database Schema & Theme Catalog Seeding

### 1.1 Cloudflare D1 Database Schema (`backend/schema.sql`)
- `rooms`: Stores 5 persistent real live rooms with theme configurations, category rules, and playback status.
- `room_presence`: Heartbeat-based session tracking (`room_id`, `user_id`, `session_id`, `last_seen`).
- `room_queue`: Queue entries per room (`room_id`, `video_id`, `title`, `artist`, `thumbnail`, `added_by`, `order_index`).
- `chat_messages`: Retention-bounded chat log (`room_id`, `sender_id`, `text`, `timestamp`).
- `theme_catalog`: Curated fallback catalog of pre-validated YouTube videos per theme category.
- `user_blocks` & `reports`: Persistent moderation data.

### 1.2 Seed 5 Initial Real Live Rooms
1. **Bollywood Hindi Music Live** (`room-bollywood-hindi`) — Theme: Bollywood / Hindi Movie Songs
2. **Hollywood Music Live** (`room-hollywood-music`) — Theme: English / Hollywood Hits
3. **Old Hindi Songs Live** (`room-old-hindi`) — Theme: Classic / Retro Hindi Melodies
4. **Punjabi Hits Live** (`room-punjabi-hits`) — Theme: Punjabi Pop & Party Beats
5. **Lo-Fi / Chill Music Live** (`room-lofi-chill`) — Theme: Lo-Fi, Chillhop & Instrumental Study Beats

---

## Phase 2: Worker Presence, Heartbeat & D1 API Endpoints

### 2.1 Presence & Heartbeat Engine
- Client sends periodic heartbeat (`POST /api/presence/heartbeat`) every 10 seconds with `roomId` and `sessionId`.
- Active viewer count calculation: `SELECT COUNT(DISTINCT session_id) FROM room_presence WHERE last_seen > datetime('now', '-30 seconds') AND room_id = ?`.
- Stale session auto-expiration.

### 2.2 Real D1 Room APIs (`backend/src/index.ts`)
- `GET /api/rooms`: Fetches all 5 live rooms directly from D1 with real viewer counts, current song title, artist, thumbnail, and live status.
- Remove all mock/demo room fallbacks.

---

## Phase 3: Theme Validation & Continuous Non-Stop Playback Engine

### 3.1 Strict Theme Validator Module (`backend/src/themeValidator.ts`)
- Validation rules for each room theme based on YouTube metadata (title, channel, keywords, language, category).
- User queue validation: User song requests must pass validation; rejected songs trigger `Song Rejected` response.
- Auto-selected song validation: Auto-selected catalog tracks must also pass validation.

### 3.2 Non-Stop Playback Engine (Durable Object)
- **Continuous Loop**: `Current Song Ends -> Check Queue -> If Queue Valid: Play -> Else: Auto-Select Theme Song -> Theme Validation -> Play Next Track`.
- **Playback Failure Recovery**: Automatically skip deleted, unavailable, or region-restricted YouTube videos.

---

## Phase 4: Authoritative Timestamp Sync & LIVE Re-Sync Button

### 4.1 Timestamp-Based Position Calculation
- D1 / Durable Object stores authoritative state: `started_at`, `current_video_id`, `seekPosition`, `isPlaying`.
- Joining users calculate exact live position: `current_position = seekPosition + (currentTime - started_at)`.

### 4.2 LIVE Button & Local Pause Isolation
- Manual pause by a user pauses ONLY local YouTube iframe; global room playback remains uninterrupted.
- **🔴 LIVE** button on player overlay: Tapping fetches latest room state and seeks local player directly to current live position.

---

## Phase 5: Real-Time Chat & Retention Policy (Max 20 Messages)

### 5.1 Chat Retention & Max 20 Initial Load
- New users joining a room receive a maximum of the **20 most recent messages**.
- Top indicator when scrolling up: *"Older messages are no longer available"*.
- Automatic cleanup routine expiring messages older than retention window to keep D1 storage lean.

---

## Phase 6: Frontend Integration & End-to-End Verification

### 6.1 Data Binding on Frontend (`mobile/src/`)
- Update `api.ts`, `DashboardScreen.tsx`, and `RoomScreen.tsx` to bind directly to Cloudflare Worker API.
- Display real viewer counts, live badges, and room themes on Home screen cards.
- Test multi-session joining, queueing, theme rejection, local pause, LIVE button re-sync, and chat.
