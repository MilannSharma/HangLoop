# Phase-Wise Task Breakdown — Cloudflare D1 + R2 Live Music Platform

Below is the detailed task-by-task checklist broken down phase by phase.

---

## Phase 1: Database Schema & Theme Catalog Migration
- [x] **Task 1.1**: Update Cloudflare D1 database schema (`backend/schema.sql`) to add `room_presence`, `room_queue`, `chat_messages`, `theme_catalog`, `user_blocks`, and `reports` tables.
- [x] **Task 1.2**: Write D1 migration script to pre-seed the 5 real live rooms (`Bollywood Hindi`, `Hollywood Music`, `Old Hindi Songs`, `Punjabi Hits`, `Lo-Fi / Chill Music`).
- [x] **Task 1.3**: Populate initial `theme_catalog` table with pre-validated YouTube video IDs per theme category.

---

## Phase 2: Cloudflare Worker API & Presence Engine
- [x] **Task 2.1**: Implement heartbeats & session presence tracking endpoint (`POST /api/presence/heartbeat`) in Worker.
- [x] **Task 2.2**: Implement real D1 active viewer count calculation (`SELECT COUNT(DISTINCT session_id)... WHERE last_seen > 30s ago`).
- [x] **Task 2.3**: Update `GET /api/rooms` Worker endpoint to fetch real rooms, current now-playing tracks, and active viewer counts from D1.
- [x] **Task 2.4**: Add D1-backed endpoints for User Profiles, User Blocking, and User Reports.

---

## Phase 3: Theme Validation & Continuous Playback Engine
- [x] **Task 3.1**: Create Theme Validation module (`backend/src/themeValidator.ts`) with metadata rules per room theme.
- [x] **Task 3.2**: Implement song submission validation for user queue requests (reject invalid songs with *"Song Rejected"* message).
- [x] **Task 3.3**: Implement continuous non-stop playback loop in Durable Object: `Song End -> Check Queue -> Auto Select Theme Song if empty -> Play`.
- [x] **Task 3.4**: Add automatic recovery to skip deleted, region-restricted, or broken YouTube videos.

---

## Phase 4: Authoritative Synchronization & LIVE Button
- [x] **Task 4.1**: Implement timestamp-based position calculation in Durable Object (`started_at`, `seekPosition`, `isPlaying`).
- [x] **Task 4.2**: Add position sync on join so new users join at the exact current live playback timestamp.
- [x] **Task 4.3**: Add prominent **🔴 LIVE** button to player overlay to re-sync player to current live position when tapped.
- [x] **Task 4.4**: Ensure local pause by a user does NOT interrupt room playback for other listeners.

---

## Phase 5: Real-Time Chat & History Retention (Max 20 Messages)
- [x] **Task 5.1**: Update WebSocket / Worker chat handler to limit initial message load on join to maximum **20 previous messages**.
- [x] **Task 5.2**: Add indicator in chat feed when scrolling up (*"Older messages are no longer available"*).
- [x] **Task 5.3**: Add scheduled retention cleanup routine in Cloudflare Worker to expire old chat messages from D1.

---

## Phase 6: Frontend Integration & End-to-End Verification
- [x] **Task 6.1**: Update `mobile/src/services/api.ts` to consume real Cloudflare D1/Worker endpoints for rooms, queue, and presence.
- [x] **Task 6.2**: Bind `DashboardScreen.tsx` live cards to display real D1 viewer counts, now playing tracks, and room themes (removing all demo data).
- [x] **Task 6.3**: Implement periodic heartbeat sender in `RoomScreen.tsx`.
- [x] **Task 6.4**: Perform multi-session end-to-end testing (Joining, Queueing, Theme Rejection, LIVE button sync, Local Pause, Chat retention, and Disconnect presence cleanup).
