# Hangloop — Complete Music Catalog, YouTube Validation, Super Admin & Live Room System

## 1. Objective

Build a reliable music system for Hangloop where:

* YouTube is used as the playback source.
* The app maintains its own validated music catalog in D1.
* The initial catalog contains **1,000+ Hindi/Bollywood songs**.
* Songs from **2000 onward** should be prioritized.
* Only songs that successfully pass playback/embed validation are added to the active catalog.
* If a song becomes unplayable later, the system automatically detects the failure and removes it from the active playable pool.
* Super Admin can manually manage, resync, add, remove, and control songs.
* Live rooms can either play from the app's validated DB catalog or directly from a YouTube URL.
* There are **only 2 roles: Super Admin and User**.

---

# 2. Roles

The entire application has only:

### Super Admin

Super Admin account:

`milansharma942105@gmail.com`

Only this account has access to:

* Music Catalog
* Catalog Resync
* Add Songs
* Manage Songs
* Create Live
* Manage Live Rooms
* Music Settings

### User

Normal users can:

* Browse live rooms
* Join live rooms
* Listen/watch current playback
* Chat
* See queue where available

Users must not have access to Super Admin controls.

There are no other roles such as Admin, Staff, Moderator, Manager, etc.

---

# 3. Music Catalog Architecture

Create a central D1 table:

`theme_catalog`

This database becomes the **single source of truth** for Hangloop's music catalog.

Do not hardcode the music list in the frontend or backend.

The live-room system must always fetch playable songs from the database.

---

# 4. Required Song Database Fields

The script must save complete song information.

Do NOT save only the YouTube URL.

Each record should contain:

### Identity

```text
id
youtube_video_id
youtube_url
canonical_url
```

### Song Information

```text
title
song_name
artist
album_or_movie
release_year
language
theme
thumbnail_url
```

### YouTube Information

```text
channel_name
channel_id
duration_seconds
published_at
youtube_status
is_embeddable
```

### Playback Validation

```text
playable_status
last_checked_at
last_played_at
failure_count
last_failure_reason
validation_version
```

### Catalog Information

```text
source
added_by
created_at
updated_at
is_active
```

---

# 5. Example Database Record

```json
{
  "id": "song_8f92a1",
  "youtube_video_id": "abc123XYZ",
  "youtube_url": "https://www.youtube.com/watch?v=abc123XYZ",
  "canonical_url": "https://www.youtube.com/watch?v=abc123XYZ",

  "title": "Tera Hua | Video",
  "song_name": "Tera Hua",
  "artist": "Artist Name",
  "album_or_movie": "Movie Name",
  "release_year": 2018,
  "language": "Hindi",
  "theme": "BOLLYWOOD",
  "thumbnail_url": "...",

  "channel_name": "Channel Name",
  "channel_id": "...",
  "duration_seconds": 215,
  "published_at": "...",
  "youtube_status": "AVAILABLE",
  "is_embeddable": true,

  "playable_status": "PLAYABLE",
  "last_checked_at": "...",
  "last_played_at": null,
  "failure_count": 0,
  "last_failure_reason": null,
  "validation_version": "v1",

  "source": "GEMINI",
  "added_by": "SUPER_ADMIN",
  "is_active": true,

  "created_at": "...",
  "updated_at": "..."
}
```

---

# 6. YouTube Video ID & Duplicate Protection

Use `youtube_video_id` as the primary unique reference for YouTube videos.

Create a unique database constraint/index.

The same YouTube video must never be inserted twice.

Normalize different YouTube URL formats.

These must resolve to the same video:

```text
https://youtube.com/watch?v=abc123

https://www.youtube.com/watch?v=abc123

https://youtu.be/abc123
```

All must produce:

```text
youtube_video_id = abc123
```

Therefore duplicate detection should be based on `youtube_video_id`, not raw URL strings.

---

# 7. Initial Bollywood Catalog

Create an automated discovery + validation script.

Target:

**1,000+ playable Hindi/Bollywood songs.**

Priority:

**Songs released from 2000 onward.**

The system should search for significantly more than 1,000 candidates because many YouTube results may fail validation.

Example:

```text
Discover 2,000–5,000 candidates
          ↓
Deduplicate
          ↓
Validate
          ↓
Keep playable songs
          ↓
Target 1,000+ valid songs
```

Do not assume that finding 1,000 YouTube search results means there will be 1,000 playable songs.

---

# 8. Gemini API Integration

The catalog discovery script will use a Gemini API key.

Gemini should help identify:

* Hindi/Bollywood songs
* Songs released from 2000 onward
* Song names
* Artists
* Movies/albums
* Relevant search candidates
* Latest/relevant songs within the requested year range

Gemini is only used for **discovery and metadata intelligence**.

Gemini must NOT be treated as proof that a YouTube video is playable.

Actual YouTube validation must happen separately.

---

# 9. Gemini API Key Security

The Gemini API key must never be exposed in:

* React code
* Mobile app code
* JavaScript bundle
* Public API responses
* Browser local storage

The key must be handled securely by the backend.

If the Add Songs flow requires a key, Super Admin can provide it through the UI and it should be sent securely to the backend.

---

# 10. Song Validation System

Every discovered YouTube candidate must go through validation.

Validation should check as much as technically possible:

* Video exists
* Video is not deleted
* Video is not private
* Video is available
* Embedding is allowed
* Player can initialize
* Playback can start
* Player does not immediately return an error
* Duration is valid
* Video is suitable for the Hangloop playback flow

Only successfully validated videos become:

```text
PLAYABLE
```

and:

```text
is_active = true
```

---

# 11. Song Status

Use clear statuses.

### PLAYABLE

Song successfully passed validation.

```text
playable_status = PLAYABLE
is_active = true
```

### FAILED

Song failed playback validation or failed during actual playback.

```text
playable_status = FAILED
is_active = false
```

### DISABLED

Super Admin manually disabled the song.

```text
playable_status = DISABLED
is_active = false
```

---

# 12. Validation Flow

```text
DISCOVERED
    ↓
VALIDATING
    ↓
 ┌───────────────┐
 │               │
 ↓               ↓
PLAYABLE        FAILED
 │               │
 ↓               ↓
ACTIVE          INACTIVE
CATALOG
```

Failed videos should not enter the active playable pool.

---

# 13. Runtime Failure Handling

A song can be playable today and become unavailable later.

Example:

```text
Song A
   ↓
Validated previously
   ↓
Added to catalog
   ↓
Played in Live Room
   ↓
YouTube playback error
```

The app must automatically:

1. Detect the playback failure.
2. Increment `failure_count`.
3. Save `last_failure_reason`.
4. Save `last_checked_at`.
5. Change status to `FAILED`.
6. Set `is_active = false`.
7. Remove it from future automatic selection.
8. Immediately move to the next playable song.

Example:

```text
Song A ❌
   ↓
Song B ❌
   ↓
Song C ✅
   ↓
Continue Live
```

The room must never become stuck because of one failed video.

---

# 14. Manual Revalidation

Do **not** automatically re-enable failed songs.

If a song becomes playable again in the future, the Super Admin can manually run:

**Resync Catalog**

The resync process can test the failed songs again.

If the song passes:

```text
FAILED
   ↓
RESYNC
   ↓
VALIDATION SUCCESS
   ↓
PLAYABLE
   ↓
ACTIVE
```

If it still fails:

```text
FAILED
   ↓
RESYNC
   ↓
FAILED
```

---

# 15. Super Admin → Settings → Music Catalog

Inside Settings, create:

## Music Catalog

Visible only to Super Admin.

Display:

```text
Total Songs
Playable Songs
Failed Songs
Disabled Songs
Bollywood Songs
Recently Added Songs
Last Resync Date/Time
```

Example:

```text
Music Catalog

Total Songs             1,124
Playable Songs          1,087
Failed Songs               25
Disabled Songs             12
Bollywood Songs         1,087

Last Resync:
18 Aug 2026, 10:30 AM

[ Resync Catalog ]

[ Add Songs ]

[ Manage Songs ]
```

---

# 16. Resync Catalog

Add:

**[ Resync Catalog ]**

Only Super Admin can see/use this button.

When clicked, run the catalog discovery and validation script again.

The process:

```text
Start Resync
    ↓
Discover new songs
    ↓
Prioritize 2000+ Bollywood
    ↓
Gemini processing
    ↓
YouTube candidate search
    ↓
Deduplicate
    ↓
Validate
    ↓
Compare with existing DB
    ↓
Insert new playable songs
    ↓
Update existing songs
    ↓
Revalidate failed songs
    ↓
Update statistics
```

---

# 17. Resync Must Be Non-Destructive

Do NOT delete the entire catalog and rebuild it from zero.

Existing valid songs must be preserved.

Use:

```text
youtube_video_id
```

to identify existing records.

If the video already exists:

```text
UPDATE
```

not:

```text
INSERT
```

If the video is new and playable:

```text
INSERT
```

If the video already exists and is still valid:

```text
KEEP ACTIVE
```

If the video now fails:

```text
MARK FAILED
```

---

# 18. Add Songs

Add:

**[ Add Songs ]**

Flow:

```text
Add Songs
    ↓
Enter Gemini API Key
    ↓
Discover Songs
    ↓
Generate YouTube Candidates
    ↓
Validate Candidates
    ↓
Deduplicate
    ↓
Show Results
    ↓
Super Admin Confirmation
    ↓
Add Valid Songs
```

Show a summary before inserting.

Example:

```text
Songs Found          150
Playable              98
Already Existing      37
Failed                15

[ Add 98 Songs ]
```

Only valid/new songs should be inserted.

---

# 19. Catalog Management

Super Admin can manage the complete catalog.

Features:

* Search song
* Search artist
* Search movie
* Search YouTube Video ID
* Filter by theme
* Filter by status
* View YouTube URL
* View thumbnail
* View release year
* View duration
* View channel
* View validation date
* View failure reason
* Remove song
* Disable song
* Re-enable song
* Add song manually

Super Admin can both **add and remove any song** from the live catalog.

---

# 20. Live Room Creation

Super Admin can create Live Rooms.

Fields:

### Thumbnail

Upload room thumbnail.

### Live Name

Example:

```text
2000s Bollywood Hits
```

### Song Play From

Exactly 2 options:

```text
APP DB
YOUTUBE URL
```

---

# 21. Live Room — App DB Mode

If:

```text
Song Play From = APP DB
```

then songs come from the validated Hangloop catalog.

Queue functionality is:

**ENABLED**

Flow:

```text
Create Live
   ↓
Upload Thumbnail
   ↓
Live Name
   ↓
Select APP DB
   ↓
Select Songs
   ↓
Create Queue
   ↓
Start Live
```

Super Admin can select songs from the validated catalog and arrange the queue.

---

# 22. Live Room — YouTube URL Mode

If:

```text
Song Play From = YOUTUBE URL
```

then Super Admin provides a direct YouTube URL.

Queue functionality must be:

**DISABLED**

Flow:

```text
Create Live
   ↓
Upload Thumbnail
   ↓
Live Name
   ↓
Select YOUTUBE URL
   ↓
Enter YouTube URL
   ↓
Start Live
```

Do not display an active Queue button for this mode.

---

# 23. Queue Rules — App DB

For App DB rooms:

```text
Current Song
     ↓
Song Ends
     ↓
Next Queue Song
     ↓
If Queue Empty
     ↓
Select Random PLAYABLE Catalog Song
     ↓
Continue
```

Never select:

* FAILED songs
* DISABLED songs
* Inactive songs
* Deleted videos
* Unavailable videos

Also avoid immediate song repetition.

Maintain a recent playback history so the same song is not repeatedly selected.

---

# 24. Queue Rules — YouTube URL

For direct YouTube URL rooms:

* Queue button disabled.
* No catalog queue.
* Play provided YouTube URL.
* If the direct URL fails, show an appropriate playback error to Super Admin.
* Do not silently replace it with an unrelated catalog song.

---

# 25. Server-Side Playback Synchronization

The Durable Object/server must be the source of truth for live-room playback.

Do not depend only on the mobile client sending:

```text
TRACK_ENDED
```

Implement server-side timing/alarm logic.

The server should know:

```text
current_video_id
track_started_at
duration
current_position
playback_state
```

When the track duration is reached:

```text
Server Alarm
    ↓
Advance Track
    ↓
Update Current Song
    ↓
Broadcast PLAYBACK_SYNC
    ↓
All Connected Users Update
```

---

# 26. Late User Joining

If a user joins a room while a song is already playing:

The backend should send:

```text
current_song
current_video_id
current_position
duration
playback_state
```

The new user should start at the correct current position.

Example:

```text
Song started 2:30 ago
User joins now
        ↓
Player starts around 2:30
```

Do not start the song from 0:00.

---

# 27. Seamless Song Switching

When the next song starts, the mobile player should switch videos without refreshing the entire room screen.

Use the existing YouTube player mechanism such as:

```text
loadVideoById()
```

or the appropriate player API method.

Do not reload the complete React Native screen.

---

# 28. Live Room Failure Protection

If a catalog song fails during playback:

```text
Current Song
    ↓
Player Error
    ↓
Report failure to backend
    ↓
Update Song Record
    ↓
Mark FAILED
    ↓
Remove from active selection
    ↓
Select next playable song
    ↓
Broadcast new playback state
```

All connected users should automatically move to the replacement song.

No manual refresh.

---

# 29. User Experience

Normal Users should only see the user-facing experience.

Users can:

* Browse live rooms
* Open a live room
* Watch/listen to current music
* Chat
* View upcoming queue when the room uses App DB mode

Users must never see:

* Gemini API key
* Music catalog administration
* Resync
* Add Songs
* Delete Songs
* Disable Songs
* Super Admin controls
* Create Live controls

---

# 30. Backend Security

Frontend hiding is not enough.

Every Super Admin API must have backend authorization.

Verify the authenticated user.

Only:

```text
milansharma942105@gmail.com
```

can access Super Admin endpoints.

Protect:

* Music catalog APIs
* Resync API
* Add Songs API
* Delete/disable APIs
* Create Live API
* Live management APIs
* Music Settings APIs

If a normal User manually calls these endpoints:

```text
403 Forbidden
```

must be returned.

---

# 31. Database as Single Source of Truth

Do not maintain separate hardcoded song lists.

The frontend and Live Room system should query the database.

For automatic playback, only select:

```sql
WHERE is_active = 1
AND playable_status = 'PLAYABLE'
```

This guarantees that failed/disabled songs are not automatically selected.

---

# 32. Complete Catalog Lifecycle

The final system should work like this:

```text
             DISCOVER
                ↓
              GEMINI
                ↓
        YouTube Candidates
                ↓
           DEDUPLICATE
                ↓
             VALIDATE
                ↓
       ┌────────┴────────┐
       ↓                 ↓
   PLAYABLE            FAILED
       ↓                 ↓
   D1 CATALOG         Ignore/Store
       ↓
    ACTIVE
       ↓
   LIVE ROOM
       ↓
     PLAY
       ↓
   Runtime Error?
       ↓
      YES
       ↓
     FAILED
       ↓
 Remove From Active Pool
       ↓
 Next Playable Song
```

---

# 33. Monthly Resync

Super Admin can manually run:

**Resync Catalog**

once every month or whenever required.

Resync should:

* Discover new songs
* Prioritize 2000+ Bollywood
* Use Gemini
* Find YouTube candidates
* Validate playback
* Add new playable songs
* Remove duplicates
* Revalidate failed songs
* Update existing metadata
* Update statistics
* Preserve existing valid records

No automatic reactivation outside the Super Admin-triggered resync.

---

# 34. Important Technical Requirements

### Do not:

* Hardcode songs.
* Store only raw URLs.
* Trust Gemini's result as proof of playback.
* Assume every YouTube search result is embeddable.
* Duplicate the same YouTube video.
* Let failed songs remain in the active pool.
* Depend only on client `TRACK_ENDED`.
* Refresh the complete room screen when changing songs.
* Expose Gemini API keys in the frontend.
* Allow normal Users to call Super Admin APIs.

### Must:

* Store exact YouTube URL.
* Store exact YouTube Video ID.
* Store canonical URL.
* Store complete song metadata.
* Validate playback.
* Track song health.
* Track failure reason.
* Track validation time.
* Automatically disable runtime-failed songs.
* Use D1 as the source of truth.
* Use server-side playback timing.
* Support seamless queue advancement.
* Prevent duplicates.
* Protect all Super Admin APIs.
* Support manual monthly resync.

---

# 35. Acceptance Testing

Before marking this feature complete, test the following:

### Catalog

* [ ] 1,000+ playable Bollywood/Hindi songs can be populated.
* [ ] Songs from 2000 onward are prioritized.
* [ ] Every song has a YouTube Video ID.
* [ ] Every song has the exact playback URL.
* [ ] Every song has required metadata.
* [ ] Duplicate Video IDs cannot be inserted.
* [ ] Failed videos do not enter the active catalog.

### Resync

* [ ] Super Admin can run Resync.
* [ ] Existing songs are preserved.
* [ ] New songs are added.
* [ ] Duplicate songs are ignored.
* [ ] Failed songs can be revalidated during resync.
* [ ] Statistics update correctly.

### Runtime

* [ ] Playable song starts.
* [ ] Song finishes automatically.
* [ ] Next song starts.
* [ ] Queue works.
* [ ] Empty queue automatically selects another playable song.
* [ ] Failed song is automatically disabled.
* [ ] Failed song is skipped.
* [ ] Room never gets stuck because of one failed video.
* [ ] No immediate song repetition.

### Live Room

* [ ] App DB mode enables Queue.
* [ ] YouTube URL mode disables Queue.
* [ ] Direct YouTube URL plays correctly.
* [ ] App DB songs play correctly.
* [ ] Next song loads without screen refresh.
* [ ] Multiple users remain synchronized.
* [ ] Late joiner receives correct song and position.

### Security

* [ ] Only `milansharma942105@gmail.com` can access Super Admin APIs.
* [ ] Normal User cannot access catalog management.
* [ ] Normal User cannot trigger Resync.
* [ ] Normal User cannot add/remove songs.
* [ ] Gemini API key is never exposed to clients.

---

# Final Expected System

Hangloop should ultimately have a **self-maintaining validated YouTube music catalog**:

**Discover → Gemini → Search → Validate → Deduplicate → Save to D1 → Play → Monitor → Fail → Disable → Skip → Continue**

And the Super Admin should have complete control:

**Settings → Music Catalog → Resync / Add Songs / Manage Songs**

plus:

**Create Live → App DB OR YouTube URL**

with queue enabled only for **App DB** rooms.

The entire platform must contain exactly **2 roles: Super Admin and User**.
