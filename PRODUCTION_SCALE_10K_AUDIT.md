# 10K+ USER PRODUCTION READINESS AUDIT

## 1. Overall Verdict

### 🔴 NOT READY (for 10,000 Concurrent Users / 10,000 Users in a Single Live Room)

#### Plain-English Summary
While the Hangloop architecture is built on top of high-performance Cloudflare primitives (Workers, Durable Objects, D1, R2), the **current implementation contains 5 severe architectural bottlenecks** that will cause system degradation and failure under 10,000 concurrent users:

1. **D1 SQLite Write Serialization Bottleneck**: Every single chat message, connection presence, and heartbeat executes immediate, synchronous D1 SQL `INSERT`/`UPDATE` operations. At 10k users, presence heartbeats alone generate **2,000 writes/sec**, while D1 SQLite can reliably sustain ~50–100 writes/sec before queue saturation, 504 timeouts, and database locking.
2. **Single-Threaded DO Broadcast & O(N²) Join Fan-Out**: A single Durable Object manages all connections for a room. Broadcasting every join/leave and high-frequency chat message to 10,000 WebSockets on a single V8 thread will exhaust the CPU budget and introduce high message lag.
3. **Massive `INIT_STATE` Payload (2.5 MB – 5 MB per join)**: `INIT_STATE` serializes the full `members` array of all 10,000 users. A reconnect storm of 1,000 users would trigger 2.5 GB – 5 GB of JSON serialization and egress within seconds.
4. **Heartbeat Duplication**: The mobile client concurrently sends heartbeats over HTTP (`/api/presence/heartbeat`) and WebSocket (`HEARTBEAT`), doubling D1 write load.
5. **Worker Cold-Start DDL Query Storm**: Every new Worker isolate executes 20 D1 DDL/migration queries (`CREATE TABLE IF NOT EXISTS`, `PRAGMA table_info`) on its first request.

---

## 2. Current Architecture

```
                                  ┌────────────────────────────────────────────────────────┐
                                  │                      MOBILE APP                        │
                                  │    (React Native / Expo / YouTube IFrame Player)       │
                                  └───────────────────────────┬────────────────────────────┘
                                                              │
                                     ┌────────────────────────┴────────────────────────┐
                                     │                                                 │
                                 HTTP REST                                         WebSocket
                              (Auth, Catalog,                                 (Live Room Streaming,
                               Presence, Admin)                               Chat, Queue, Playback)
                                     │                                                 │
                                     ▼                                                 ▼
               ┌──────────────────────────────────────────────┐     ┌────────────────────────────────────┐
               │          CLOUDFLARE WORKER ROUTER            │     │    ROOM DURABLE OBJECT (DO)        │
               │             (`src/index.ts`)                 │────▶│    (`RoomDurableObject.ts`)        │
               └──────────────────────┬───────────────────────┘     └─────────────────┬──────────────────┘
                                      │                                               │
               ┌──────────────────────┴───────────────────────┐                       │
               │                                              │                       │
               ▼                                              ▼                       ▼
    ┌──────────────────────┐                       ┌──────────────────────────────────────────────┐
    │     EXTERNAL APIS    │                       │             CLOUDFLARE D1 (SQLITE)           │
    │ - YouTube Data API   │                       │  Tables:                                     │
    │ - YouTube oEmbed     │                       │  - users, user_sessions, moderators          │
    │ - Gmail SMTPS (OTP)  │                       │  - rooms, room_presence, room_queue          │
    │ - Workers AI (Kira)  │                       │  - chat_messages, music_catalog              │
    └──────────────────────┘                       │  - song_requests, user_reports, user_blocks  │
                                                   └──────────────────────────────────────────────┘
                                                              │
                                                   ┌──────────┴──────────┐
                                                   │ CLOUDFLARE R2 BUCKET│
                                                   │  (Unused Binding)   │
                                                   └─────────────────────┘
```

### Data Flow Paths

1. **Authentication & Session**:
   - `Mobile` ──`POST /api/auth/send-otp`──▶ `Worker` ──`SMTPS`──▶ `Gmail` ──`INSERT`──▶ `D1 (email_verifications)`
   - `Mobile` ──`POST /api/auth/login`──▶ `Worker` ──`SELECT users`──▶ `INSERT user_sessions`──▶ `D1`
2. **Live Room WebSocket Connection**:
   - `Mobile` ──`WSS /api/ws/room/:id`──▶ `Worker` ──`ROOM_DO.get(id)`──▶ `RoomDurableObject`
   - `RoomDurableObject` ──`SELECT users, moderators`──▶ `D1`
   - `RoomDurableObject` ──`INSERT room_presence`──▶ `D1`
   - `RoomDurableObject` ──`INIT_STATE (all members + 50 msgs)`──▶ `Connecting Socket`
   - `RoomDurableObject` ──`MEMBER_JOINED`──▶ `Broadcast to ALL connected sockets in room`
3. **Live Chat Messaging**:
   - `Mobile` ──`CHAT_SEND`──▶ `RoomDurableObject`
   - `RoomDurableObject` ──`INSERT chat_messages` (Synchronous)──▶ `D1`
   - `RoomDurableObject` ──`CHAT_RECEIVE`──▶ `Broadcast to ALL connected sockets in room`
4. **Presence & Heartbeat**:
   - `Mobile` ──`POST /api/presence/heartbeat` (every 10s)──▶ `Worker` ──`UPDATE room_presence`──▶ `D1`
   - `Mobile` ──`WS HEARTBEAT` (every 10s)──▶ `RoomDurableObject` ──`UPDATE room_presence`──▶ `D1`
5. **Playback Synchronization**:
   - `RoomDurableObject Alarm / Heartbeat Watchdog` ──`advanceQueue()`──▶ `SELECT music_catalog`──▶ `UPDATE rooms`──▶ `D1`
   - `RoomDurableObject` ──`PLAYBACK_SYNC`──▶ `Broadcast to ALL connected sockets in room`

---

## 3. Component-by-Component Score

| Component | Status | 10k Users Capability | Main Risk |
|---|:---:|:---:|---|
| **Cloudflare Workers** | 🟡 | Ready after minor fix | Cold-start `ensureAllTables` DDL storm; N+1 queries on `/api/rooms`. |
| **Cloudflare D1 Database** | 🔴 | **Cannot handle target** | Synchronous writes on every chat message and 2,000 heartbeat writes/sec will cause SQLite write lock contention and 504 timeouts. |
| **Cloudflare R2** | 🟢 | Safe (Not Utilized) | Currently an unused binding; zero performance impact. |
| **Durable Objects (Single Room)** | 🔴 | **Cannot handle target** | Single-threaded V8 loop broadcasting to 10,000 WebSockets creates CPU starvation and message delivery delays. |
| **WebSockets** | 🟡 | Ready after optimization | Full member list in `INIT_STATE` (2.5MB+) and `MEMBER_JOINED` O(N²) broadcasts cause reconnect storms. |
| **Live Chat Engine** | 🔴 | **Cannot handle target** | Synchronous D1 write per message blocks DO event loop; lack of write batching and message throttling. |
| **Mobile Client (React Native)** | 🟡 | Ready after optimization | FlatList re-rendering on 100+ broadcasts/sec will drop UI thread frame rate without message batching. |
| **YouTube Integration** | 🟢 | Safe | Metadata is cached in D1/DO state; joining users do NOT trigger redundant YouTube Data API calls. |
| **Authentication & Sessions** | 🟡 | Ready after optimization | Unindexed `LOWER(username)` / `LOWER(email)` table scans; missing rate limiter on `/api/auth/send-otp`. |
| **Database Schema & Indexes** | 🟡 | Ready after optimization | Missing composite index on `chat_messages(room_id, timestamp_ms DESC)` and `ORDER BY RANDOM()` on catalog. |

---

## 4. Biggest 10 Bottlenecks (Ranked by Severity)

### 1. 🔴 Synchronous D1 Write on Every Single Chat Message
- **Location**: `backend/src/RoomDurableObject.ts` (lines 574–594)
- **Problem**: When a user sends a chat message, the Durable Object executes an `await this.env.DB.prepare("INSERT INTO chat_messages ...").run()`.
- **Impact at 10k Users**: At 100–500 messages/sec, D1 SQLite write serialization queues up. If D1 takes 30–80ms per write, the single-threaded DO event loop freezes, blocking all WebSocket message processing.

### 2. 🔴 Presence Heartbeat D1 Flooding (2,000 writes/sec)
- **Location**: `mobile/src/screens/RoomScreen.tsx` (lines 374–386) & `backend/src/RoomDurableObject.ts` (lines 461–465) & `backend/src/index.ts` (lines 237–255)
- **Problem**: Both HTTP (`/api/presence/heartbeat`) and WebSocket (`HEARTBEAT`) write to `room_presence` every 10 seconds per user.
- **Impact at 10k Users**: `10,000 users / 10s * 2 = 2,000 D1 writes/sec`. D1 cannot sustain 2,000 writes/sec. The database will become completely unresponsive.

### 3. 🔴 Full Member List Serialization in `INIT_STATE` (2.5 MB – 5 MB payload)
- **Location**: `backend/src/RoomDurableObject.ts` (line 432)
- **Problem**: `INIT_STATE` sends `members: Array.from(this.members.values()).map(m => m.user)`.
- **Impact at 10k Users**: When 10,000 users are in the room, the `members` array contains 10,000 objects (~250–500 bytes each = 2.5 MB to 5 MB per payload). A surge of 500 joining users requires generating and transferring 1.25 GB to 2.5 GB of JSON data over WebSockets from one DO.

### 4. 🔴 O(N²) Fan-Out on `MEMBER_JOINED` & `MEMBER_LEFT`
- **Location**: `backend/src/RoomDurableObject.ts` (lines 445–450, 1019–1025)
- **Problem**: Every user join broadcasts a `MEMBER_JOINED` message to all existing room members.
- **Impact at 10k Users**: If 1,000 users join over 30 seconds, `1,000 * 10,000 = 10,000,000` broadcast frames are dispatched. The DO event loop will experience severe CPU lag.

### 5. 🔴 Single-Threaded Durable Object WebSocket Broadcast Ceiling
- **Location**: `backend/src/RoomDurableObject.ts` (lines 1285–1297)
- **Problem**: `broadcast()` loops over `for (const ws of this.members.keys()) ws.send(jsonStr)`.
- **Impact at 10k Users**: Sending to 10,000 sockets takes ~10–20ms of synchronous CPU time per broadcast. At 20 messages/sec, total broadcast time is `20 * 15ms = 300ms/sec` (30–50% of total DO CPU time), leaving insufficient CPU for message handling and parsing.

### 6. 🔴 D1 Table Initialization & PRAGMA Migration on Every Cold Start
- **Location**: `backend/src/index.ts` (lines 55–198, 220)
- **Problem**: `ensureAllTables(env.DB)` runs on every new Worker isolate, executing 20 DDL/PRAGMA queries sequentially.
- **Impact at 10k Users**: Traffic spikes spawn hundreds of Worker isolates concurrently, causing hundreds of simultaneous DDL statements against D1, leading to database contention.

### 7. 🔴 N+1 Queries on `GET /api/rooms`
- **Location**: `backend/src/index.ts` (lines 267–275)
- **Problem**: `GET /api/rooms` fetches all rooms and executes a separate `SELECT COUNT(DISTINCT session_id) FROM room_presence ...` query for each room.
- **Impact at 10k Users**: If 1,000 users open the dashboard simultaneously, D1 receives thousands of unindexed count queries.

### 8. 🔴 Unindexed `LOWER()` Table Scans on User Connection
- **Location**: `backend/src/RoomDurableObject.ts` (lines 362–376)
- **Problem**: On every WebSocket handshake, the DO queries `SELECT * FROM moderators WHERE LOWER(user_id) = ? OR LOWER(username) = ?` and `SELECT * FROM users WHERE LOWER(id) = ? OR LOWER(username) = ?`.
- **Impact at 10k Users**: Neither `LOWER(username)` nor `LOWER(user_id)` are indexed. Each connection triggers full table scans on `users` and `moderators`.

### 9. 🔴 Short WebSocket Reconnect Backoff (Thundering Herd)
- **Location**: `mobile/src/services/websocket.ts` (lines 117–125)
- **Problem**: Reconnect delay is capped at `Math.min(5000, 1000 * Math.pow(1.5, attempts))`.
- **Impact at 10k Users**: If a network glitch or Worker deployment disconnects clients, all 10,000 clients will reconnect within 5 seconds simultaneously, triggering a catastrophic thundering herd.

### 10. 🔴 Client-Side UI Thread Freezing on Unbatched High-Rate Chat
- **Location**: `mobile/src/screens/RoomScreen.tsx` (lines 226–255)
- **Problem**: Every incoming `CHAT_RECEIVE` message triggers a React state update `setRoomState(...)` and `flatListRef.current?.scrollToEnd()`.
- **Impact at 10k Users**: At 30–50 messages/sec, React Native cannot process 50 state updates and layout passes per second, causing UI stutter and unresponsive touch inputs.

---

## 5. 10K User Capacity Calculation

### Metrics Model for 10,000 Concurrent Users

| Metric | Normal Traffic (100 msgs/min) | High Traffic (1,000 msgs/min) | Extreme Traffic (10,000 msgs/min) |
|---|:---:|:---:|:---:|
| **Concurrent WebSocket Connections** | 10,000 | 10,000 | 10,000 |
| **Incoming Chat Messages / sec** | 1.67 msg/s | 16.67 msg/s | 166.67 msg/s |
| **D1 Chat Writes / sec (Current Implementation)** | 1.67 writes/s | 16.67 writes/s | 166.67 writes/s (💥 **Fails D1**) |
| **D1 Presence Writes / sec (Current Implementation)** | **2,000 writes/s** (💥 **Fails D1**) | **2,000 writes/s** (💥 **Fails D1**) | **2,000 writes/s** (💥 **Fails D1**) |
| **DO WebSocket Broadcasts / sec (1 Room)** | **16,700 msgs/s** | **166,700 msgs/s** (💥 **Fails DO**) | **1,666,700 msgs/s** (💥 **Fails DO**) |
| **DO Outbound Network Bandwidth (1 Room)** | ~3.3 MB/s (26.4 Mbps) | ~33.3 MB/s (266 Mbps) | ~333 MB/s (2.66 Gbps) |
| **Worker HTTP Requests / sec** | ~1,050 req/s | ~1,200 req/s | ~2,500 req/s |
| **YouTube Data API Quota / day** | ~100 units/day (🟢 Safe) | ~100 units/day (🟢 Safe) | ~100 units/day (🟢 Safe) |

### What Breaks First?
1. **At T + 10 seconds**: **D1 Database crashes / returns 504 Gateway Timeout** due to 2,000 heartbeat writes per second from presence loops.
2. **At T + 30 seconds**: **Durable Object CPU throttles / disconnects WebSockets** due to O(N²) `MEMBER_JOINED` broadcasts and massive 2.5 MB `INIT_STATE` generation.
3. **At T + 60 seconds**: **Mobile App UI freezes** as client FlatList attempts to re-render dozens of unbatched messages per second.

---

## 6. Critical 🔴 Issues (Must Fix for Stability)

### CRIT-1: Synchronous D1 Write in `CHAT_SEND`
- **Root Cause**: Direct `await env.DB.prepare("INSERT INTO chat_messages ...").run()` inside `RoomDurableObject.ts` `webSocketMessage`.
- **Failure Mode**: D1 write queue builds up; DO event loop blocks; all connected users experience multi-second message delays.
- **Fix**: Decouple D1 writes from the DO real-time broadcast loop. Buffer chat messages in memory in the DO and flush to D1 in batches (e.g. every 2 seconds or every 50 messages) using `ctx.waitUntil()` or DO Alarm.

### CRIT-2: Dual Heartbeat Flooding D1 with 2,000 writes/sec
- **Root Cause**: `RoomScreen.tsx` calls `api.sendPresenceHeartbeat` (HTTP) and `wsClient.sendHeartbeat()` (WS), both executing D1 writes.
- **Failure Mode**: SQLite database lock contention.
- **Fix**: Remove HTTP presence heartbeat entirely when WebSocket is connected. In the DO, track presence purely in memory (`this.members.size`). Update D1 room viewer counts periodically (e.g. once every 30 seconds per room, NOT per user).

### CRIT-3: Full Member List in `INIT_STATE` & `MEMBER_JOINED` Broadcasts
- **Root Cause**: DO sends `members: Array.from(this.members.values()).map(m => m.user)` on connect and broadcasts `MEMBER_JOINED` to all users.
- **Failure Mode**: 2.5 MB+ payload per join; O(N²) message explosion during room joins or reconnect storms.
- **Fix**: YouTube Live model: Do NOT broadcast individual user joins/leaves in large rooms. Send only `viewerCount: number` and recent chat messages. Only maintain host/moderator list in `INIT_STATE`.

### CRIT-4: DO Fan-Out Saturation for 10,000 Connections in One Room
- **Root Cause**: 1 room = 1 single-threaded DO instance broadcasting to 10,000 sockets.
- **Failure Mode**: DO CPU limit (500ms / request) exceeded; WebSocket frame buffer overflow.
- **Fix**: Edge Fan-Out Architecture: Use a **Tree / Edge Fan-Out pattern** where 1 Primary Room DO manages authoritative playback & chat state and fans out messages to 5–10 Edge Worker Sub-Broadcasters (or use Cloudflare Pub/Sub / Durable Object Edge Sharding) for rooms with >1,000 concurrent listeners.

---

## 7. Medium 🟡 Issues

1. **`ensureAllTables` DDL on Worker Startup**:
   - `index.ts` runs 20 table/index creation queries on cold start. Should be migrated to Wrangler D1 migration files (`wrangler d1 migrations apply`).
2. **Missing Composite Index on `chat_messages`**:
   - `SELECT ... FROM chat_messages WHERE room_id = ? ORDER BY timestamp_ms DESC, created_at DESC LIMIT 50` requires an index on `(room_id, timestamp_ms DESC)`.
3. **`ORDER BY RANDOM()` in Music Catalog**:
   - `SELECT * FROM music_catalog WHERE theme = ? ... ORDER BY RANDOM() LIMIT 25` performs a full table scan. Should select by indexed random row offset or pre-indexed IDs.
4. **Reconnect Storm Exponential Backoff Cap**:
   - Mobile `websocket.ts` max delay is 5s. Should use full jitter with exponential backoff up to 30s (`min(30000, (2^attempts * 1000) + random_jitter)`).
5. **Missing Rate Limiter on OTP and Auth Endpoints**:
   - `/api/auth/send-otp` and `/api/auth/login` lack IP-based rate limiting, leaving the service vulnerable to email quota exhaustion.

---

## 8. Good 🟢 Parts (Well-Designed Decisions)

1. **Durable Object WebSocket Hibernation API**:
   - `this.state.acceptWebSocket(webSocket)` is properly used, allowing idle WebSocket connections to hibernate with negligible memory overhead when not actively receiving messages.
2. **YouTube Video Locking Architecture**:
   - Custom live stream rooms (`play_source_type === 'YOUTUBE_URL'`) are completely locked against auto-advancing, catalog fallback, and transient iframe error skips.
3. **D1 Chat Message Hydration on Cold Start**:
   - DO properly hydrates recent 50 messages from D1 on wake-up, ensuring rejoining users never see a blank chat.
4. **Client-Side Message Deduplication & Optimistic UI**:
   - `clientMessageId` and authoritative server `id` reconciliation in `RoomScreen.tsx` prevents duplicate messages on mobile.
5. **Zero Redundant YouTube API Calls on User Join**:
   - User connections consume zero YouTube Data API quota because playback state and metadata are served directly from DO memory.
6. **Kira AI Budget & Abuse Protection**:
   - Kira AI service in `kiraService.ts` implements strict input clamping (300 chars), per-user daily limits (20/day), user cooldowns (15s), and global daily limits (500/day).

---

## 9. Required Changes Before 10K Users

| # | Exact File | Function / Component | Current Problem | Recommended Solution | Priority |
|---|---|---|---|---|:---:|
| 1 | `backend/src/RoomDurableObject.ts` | `webSocketMessage` (`CHAT_SEND`) | Synchronous D1 write blocks DO event loop. | Buffer chat messages in memory and flush to D1 in batch via `ctx.waitUntil()` or periodic timer. | 🔴 P0 |
| 2 | `mobile/src/screens/RoomScreen.tsx` & `backend/src/index.ts` | Heartbeat & Presence loops | 2,000 HTTP + WS D1 writes/sec. | Remove HTTP heartbeat. Track active presence in DO memory and write room viewer count to D1 once every 30s. | 🔴 P0 |
| 3 | `backend/src/RoomDurableObject.ts` | `handleWebSocket` (`INIT_STATE`, `MEMBER_JOINED`) | 2.5MB payload per join + O(N²) join broadcasts. | Remove `members` array from `INIT_STATE` and stop broadcasting `MEMBER_JOINED` for standard viewers. Send only `viewerCount`. | 🔴 P0 |
| 4 | `backend/src/index.ts` | `ensureAllTables` | 20 DDL queries on cold start. | Move DDL to `migrations/` and apply via Wrangler CLI; remove runtime `CREATE TABLE` from Worker request path. | 🟡 P1 |
| 5 | `backend/schema.sql` | Table Indexes | Missing index for `timestamp_ms` and case-insensitive user lookups. | Add `idx_chat_room_ts ON chat_messages(room_id, timestamp_ms DESC)` and `idx_users_lower_uname ON users(LOWER(username))`. | 🟡 P1 |
| 6 | `mobile/src/services/websocket.ts` | `connect` & `onclose` | Reconnect backoff capped at 5s causes thundering herd. | Implement exponential backoff with full jitter up to 30s. | 🟡 P1 |
| 7 | `mobile/src/screens/RoomScreen.tsx` | `CHAT_RECEIVE` handler | Re-rendering on every message drops UI FPS under high chat traffic. | Buffer incoming chat messages and flush to React state in 100ms batches (10 UI updates/sec max). | 🟡 P1 |
| 8 | `backend/src/index.ts` | `GET /api/rooms` | N+1 D1 queries for room viewer counts. | Query room viewer counts in a single aggregated `GROUP BY room_id` query or read from DO state. | 🟡 P2 |

---

## 10. Recommended Production Architecture

### Scaling Roadmap: 10k ➔ 50k ➔ 100k Users

```
                                      ┌───────────────────────────────────────┐
                                      │              CLIENTS                  │
                                      │         (10k - 100k Users)            │
                                      └──────────────────┬────────────────────┘
                                                         │
                                               WebSocket / HTTPS
                                                         │
                                                         ▼
                                      ┌───────────────────────────────────────┐
                                      │      CLOUDFLARE EDGE WORKERS          │
                                      │  (Rate Limiting, Auth, Caching)       │
                                      └──────────────────┬────────────────────┘
                                                         │
                                ┌────────────────────────┴────────────────────────┐
                                │                                                 │
                                ▼                                                 ▼
             ┌────────────────────────────────────┐             ┌───────────────────────────────────┐
             │       PRIMARY ROOM DO              │             │      EDGE FAN-OUT BROADCASTERS    │
             │   - Authoritative Playback Clock   │────────────▶│  - 1 DO per 1,000 Subscribers     │
             │   - Chat Ordering & Moderation     │  Pub/Sub /  │  - Zero D1 Writes                 │
             │   - Batched D1 Persistence Queue   │  WebSocket  │  - Low Memory / Fast Delivery     │
             └─────────────────┬──────────────────┘             └─────────────────┬─────────────────┘
                               │                                                  │
                               ▼                                                  ▼
             ┌────────────────────────────────────┐                     ┌───────────────────┐
             │      CLOUDFLARE D1 (BATCHED)       │                     │    ALL VIEWERS    │
             │  - Batched Writes (every 2s)       │                     │  (Smooth Streams) │
             │  - Read Replicas                   │                     └───────────────────┘
             └────────────────────────────────────┘
```

1. **10,000 Users (Immediate Architecture)**:
   - 1 Primary Room DO per room.
   - Batch D1 chat writes (flush every 2s).
   - In-memory presence (0 D1 writes per user heartbeat).
   - Lightweight `INIT_STATE` (only send `viewerCount`, not member list).
   - Client-side 100ms chat batching.

2. **50,000 Users (Tier 2)**:
   - Primary Room DO + Edge Broadcaster DOs (Fan-out tree: 1 Primary DO fans out to 10 Broadcaster DOs, each serving 5,000 sockets).
   - D1 Read Replication enabled for `/api/rooms` and catalog search.

3. **100,000 Users (Tier 3)**:
   - Cloudflare Pub/Sub (WebSockets over MQTT/Anycast) for global chat distribution.
   - Primary DO acts strictly as the room conductor (authoritative state machine).

---

## 11. Load Testing Plan

Before deploying to 10,000 production users, execute the following load testing suite using a distributed testing tool (e.g. `k6` or `Artillery` on distributed VMs):

### Test 1: Baseline Concurrent Connections (1,000 Users)
- **Goal**: Verify DO memory and WebSocket stability.
- **Action**: Connect 1,000 WebSocket clients over 60 seconds; send 10 chat messages/sec.
- **Success Criteria**: 0 dropped connections, D1 CPU < 20%, DO latency < 50ms.

### Test 2: Room Join Storm (5,000 Users in 30 Seconds)
- **Goal**: Test `INIT_STATE` payload size and handshake throughput.
- **Action**: Connect 5,000 WebSocket clients in 30 seconds to a single room.
- **Success Criteria**: No 101 handshake timeouts, `INIT_STATE` payload < 50 KB, 0 Worker crashes.

### Test 3: Chat Spike & D1 Batching (10,000 Users)
- **Goal**: Test chat broadcast fan-out and D1 write queue.
- **Action**: 10,000 connected clients; 100 messages/sec sent across the room.
- **Success Criteria**: End-to-end message delivery latency < 200ms; D1 write queue depth = 0; 0 dropped frames.

### Test 4: Disconnect & Reconnect Storm (Thundering Herd)
- **Goal**: Test client exponential backoff and server resilience.
- **Action**: Force-kill 10,000 WebSocket connections simultaneously; observe reconnect rate over 60 seconds.
- **Success Criteria**: Reconnects distributed smoothly over 30s with jitter; no 504 Gateway Timeouts.

---

## 12. FINAL GO / NO-GO VERDICT

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FINAL SYSTEM READINESS                          │
├───────────────────────────────────┬────────────────────────────────────┤
│ Scenario                          │ Verdict                            │
├───────────────────────────────────┼────────────────────────────────────┤
│ CURRENT SYSTEM (As-Is)            │ 🟡 GO (for up to 300 - 500 users)  │
│ 10K CONCURRENT USERS              │ 🔴 NO-GO (Requires P0 Changes 1-3) │
│ 10K USERS IN ONE LIVE ROOM        │ 🔴 NO-GO (Requires P0 Changes 1-3) │
│ 50K CONCURRENT USERS              │ 🔴 NO-GO (Requires Fan-Out Tree)   │
│ 100K CONCURRENT USERS             │ 🔴 NO-GO (Requires Pub/Sub Tier)   │
└───────────────────────────────────┴────────────────────────────────────┘
```

### Mandatory Requirements Before 10K Production Launch:
1. **P0-1**: Implement batched D1 writes for chat messages in `RoomDurableObject.ts`.
2. **P0-2**: Eliminate individual D1 presence heartbeat writes; maintain presence in DO memory.
3. **P0-3**: Strip the `members` array from `INIT_STATE` and disable `MEMBER_JOINED` broadcasts for regular viewers.
4. **P1-1**: Add composite indexes on `chat_messages(room_id, timestamp_ms DESC)`.
5. **P1-2**: Move `ensureAllTables` DDL out of the Worker runtime request path.
