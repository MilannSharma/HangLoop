import { validateVideoPlayable, searchYouTubeCandidates, isYouTubeEmbeddable, parseISO8601Duration } from './themeValidator';
import { SEED_CATALOG_TRACKS } from './catalogSeedData';

export interface CatalogSong {
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
  channel_id: string;
  duration_seconds: number;
  published_at?: string;
  embed_url?: string;
  is_embeddable: number;
  youtube_status: string;
  playable_status: 'PLAYABLE' | 'FAILED' | 'DISABLED';
  last_checked_at: string;
  last_played_at?: string;
  failure_count: number;
  last_failure_reason?: string | null;
  validation_version: string;
  source: 'GEMINI' | 'YOUTUBE_SEARCH' | 'MANUAL';
  added_by: string;
  is_active: number;
  created_at?: string;
  updated_at?: string;
}

// ──────────────────────────────────────────────────────────────
// Helper: Extract & Normalize YouTube Video ID & URLs
// ──────────────────────────────────────────────────────────────
export function extractYouTubeVideoId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|live\/|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/i
  );
  return match ? match[1] : null;
}

export function normalizeYouTubeUrls(videoId: string) {
  return {
    videoId,
    youtubeUrl: `https://www.youtube.com/watch?v=${videoId}`,
    canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`,
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
  };
}

// ──────────────────────────────────────────────────────────────
// Catalog Statistics (Refined for 3 Core Themes)
// ──────────────────────────────────────────────────────────────
export async function getCatalogStats(db: any) {
  try {
    const totalRow = await db.prepare(`SELECT COUNT(*) as count FROM music_catalog`).first();
    const playableRow = await db.prepare(`SELECT COUNT(*) as count FROM music_catalog WHERE is_active = 1 AND playable_status = 'PLAYABLE'`).first();
    const failedRow = await db.prepare(`SELECT COUNT(*) as count FROM music_catalog WHERE playable_status IN ('FAILED', 'DISABLED') OR is_active = 0`).first();
    const bollywoodRow = await db.prepare(`SELECT COUNT(*) as count FROM music_catalog WHERE theme = 'BOLLYWOOD' AND is_active = 1 AND playable_status = 'PLAYABLE'`).first();
    const punjabiRow = await db.prepare(`SELECT COUNT(*) as count FROM music_catalog WHERE theme = 'PUNJABI' AND is_active = 1 AND playable_status = 'PLAYABLE'`).first();
    const trendingRow = await db.prepare(`SELECT COUNT(*) as count FROM music_catalog WHERE theme = 'TRENDING' AND is_active = 1 AND playable_status = 'PLAYABLE'`).first();
    const recentRow = await db.prepare(`SELECT COUNT(*) as count FROM music_catalog WHERE created_at >= datetime('now', '-7 days')`).first();
    const lastResyncRow = await db.prepare(`SELECT MAX(last_checked_at) as last_resync FROM music_catalog`).first();

    return {
      totalSongs: totalRow?.count || 0,
      playable: playableRow?.count || 0,
      failedOrDisabled: failedRow?.count || 0,
      bollywood: bollywoodRow?.count || 0,
      punjabi: punjabiRow?.count || 0,
      trending: trendingRow?.count || 0,
      addedRecently: recentRow?.count || 0,
      lastResync: lastResyncRow?.last_resync || new Date().toISOString(),
    };
  } catch (err) {
    console.error('Error fetching catalog stats:', err);
    return {
      totalSongs: 0,
      playable: 0,
      failedOrDisabled: 0,
      bollywood: 0,
      punjabi: 0,
      trending: 0,
      addedRecently: 0,
      lastResync: new Date().toISOString(),
    };
  }
}

// ──────────────────────────────────────────────────────────────
// Fetch Songs List (with search, filter, pagination)
// ──────────────────────────────────────────────────────────────
export async function getSongsList(
  db: any,
  options: {
    page?: number;
    limit?: number;
    search?: string;
    theme?: string;
    status?: string;
  }
) {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));
  const offset = (page - 1) * limit;

  let whereClauses: string[] = [];
  let params: any[] = [];

  if (options.search && options.search.trim()) {
    const term = `%${options.search.trim()}%`;
    whereClauses.push(
      `(song_name LIKE ? OR artist LIKE ? OR album_or_movie LIKE ? OR title LIKE ? OR youtube_video_id LIKE ?)`
    );
    params.push(term, term, term, term, term);
  }

  if (options.theme && options.theme !== 'ALL') {
    whereClauses.push(`theme = ?`);
    params.push(options.theme);
  }

  if (options.status && options.status !== 'ALL') {
    whereClauses.push(`playable_status = ?`);
    params.push(options.status);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countQuery = `SELECT COUNT(*) as count FROM music_catalog ${whereSql}`;
  const totalCountRow = await db.prepare(countQuery).bind(...params).first();
  const total = totalCountRow?.count || 0;

  const dataQuery = `
    SELECT * FROM music_catalog
    ${whereSql}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;
  const { results } = await db.prepare(dataQuery).bind(...params, limit, offset).all();

  return {
    songs: results || [],
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ──────────────────────────────────────────────────────────────
// Record Song Playback Failure (Runtime Auto-Disable)
// ──────────────────────────────────────────────────────────────
export async function recordSongFailure(db: any, videoId: string, reason: string) {
  try {
    await db.prepare(
      `UPDATE music_catalog 
       SET failure_count = failure_count + 1,
           last_failure_reason = ?,
           playable_status = 'FAILED',
           is_active = 0,
           last_checked_at = datetime('now'),
           updated_at = datetime('now')
       WHERE youtube_video_id = ?`
    ).bind(reason || 'YouTube Playback Error', videoId).run();
    console.log(`[CatalogService] Marked song ${videoId} as FAILED: ${reason}`);
  } catch (err) {
    console.warn(`Failed recording song failure in D1 for ${videoId}:`, err);
  }
}

// ──────────────────────────────────────────────────────────────
// Toggle / Update Song Status
// ──────────────────────────────────────────────────────────────
export async function toggleSongStatus(
  db: any,
  videoIdOrId: string,
  newStatus: 'PLAYABLE' | 'DISABLED' | 'FAILED'
) {
  const isActive = newStatus === 'PLAYABLE' ? 1 : 0;
  await db.prepare(
    `UPDATE music_catalog
     SET playable_status = ?,
         is_active = ?,
         failure_count = CASE WHEN ? = 'PLAYABLE' THEN 0 ELSE failure_count END,
         last_checked_at = datetime('now'),
         updated_at = datetime('now')
     WHERE id = ? OR youtube_video_id = ?`
  ).bind(newStatus, isActive, newStatus, videoIdOrId, videoIdOrId).run();
}

// ──────────────────────────────────────────────────────────────
// Delete Song
// ──────────────────────────────────────────────────────────────
export async function deleteSong(db: any, videoIdOrId: string) {
  await db.prepare(
    `DELETE FROM music_catalog WHERE id = ? OR youtube_video_id = ?`
  ).bind(videoIdOrId, videoIdOrId).run();
}

// ──────────────────────────────────────────────────────────────
// Add Single Song To Catalog
// ──────────────────────────────────────────────────────────────
export async function addSongToCatalog(
  db: any,
  songData: Partial<CatalogSong>,
  ytApiKey: string = ''
): Promise<{ success: boolean; message: string; song?: CatalogSong }> {
  const videoId = extractYouTubeVideoId(songData.youtube_video_id || songData.youtube_url || '');
  if (!videoId) {
    return { success: false, message: 'Invalid YouTube Video ID or URL' };
  }

  // Validate playback / embeddability
  const check = await validateVideoPlayable(videoId, ytApiKey);
  if (!check.playable) {
    return { success: false, message: 'Song rejected: YouTube video is not embeddable, private, or unavailable' };
  }

  const normalized = normalizeYouTubeUrls(videoId);
  const songId = songData.id || `song_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const title = songData.title || check.meta?.title || songData.song_name || 'Bollywood Song';
  const songName = songData.song_name || title;
  const artist = songData.artist || check.meta?.channelTitle || 'Artist';
  const albumOrMovie = songData.album_or_movie || '';
  const releaseYear = Number(songData.release_year) || 2020;
  const language = songData.language || 'Hindi';
  const theme = (songData.theme || 'BOLLYWOOD').toUpperCase();
  const channelName = check.meta?.channelTitle || songData.channel_name || 'Official';
  const duration = Number(songData.duration_seconds) || check.meta?.durationSeconds || 240;

  try {
    await db.prepare(
      `INSERT INTO music_catalog (
        id, youtube_video_id, youtube_url, canonical_url, title, song_name, artist,
        album_or_movie, release_year, language, theme, thumbnail_url, channel_name,
        duration_seconds, embed_url, is_embeddable, youtube_status, playable_status,
        last_checked_at, source, added_by, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, 1)
      ON CONFLICT(youtube_video_id) DO UPDATE SET
        title = excluded.title,
        song_name = excluded.song_name,
        artist = excluded.artist,
        album_or_movie = excluded.album_or_movie,
        release_year = excluded.release_year,
        playable_status = 'PLAYABLE',
        is_active = 1,
        failure_count = 0,
        last_failure_reason = NULL,
        last_checked_at = datetime('now'),
        updated_at = datetime('now')`
    ).bind(
      songId,
      videoId,
      normalized.youtubeUrl,
      normalized.canonicalUrl,
      title,
      songName,
      artist,
      albumOrMovie,
      releaseYear,
      language,
      theme,
      normalized.thumbnailUrl,
      channelName,
      duration,
      normalized.embedUrl,
      1,
      'AVAILABLE',
      'PLAYABLE',
      songData.source || 'MANUAL',
      songData.added_by || 'SUPER_ADMIN'
    ).run();

    return {
      success: true,
      message: 'Song added and validated successfully',
      song: {
        id: songId,
        youtube_video_id: videoId,
        youtube_url: normalized.youtubeUrl,
        canonical_url: normalized.canonicalUrl,
        title,
        song_name: songName,
        artist,
        album_or_movie: albumOrMovie,
        release_year: releaseYear,
        language,
        theme,
        thumbnail_url: normalized.thumbnailUrl,
        channel_name: channelName,
        channel_id: '',
        duration_seconds: duration,
        is_embeddable: 1,
        youtube_status: 'AVAILABLE',
        playable_status: 'PLAYABLE',
        last_checked_at: new Date().toISOString(),
        failure_count: 0,
        validation_version: '1.0',
        source: songData.source || 'MANUAL',
        added_by: songData.added_by || 'SUPER_ADMIN',
        is_active: 1,
      },
    };
  } catch (err: any) {
    console.error('Error inserting song into music_catalog:', err);
    return { success: false, message: err.message || 'Database insert error' };
  }
}

// ──────────────────────────────────────────────────────────────
// Gemini AI Song Discovery
// ──────────────────────────────────────────────────────────────
export async function discoverBollywoodWithGemini(
  geminiApiKey: string,
  promptOverride?: string,
  startYear: number = 2000,
  count: number = 50
): Promise<Array<{ song_name: string; artist: string; album_or_movie: string; release_year: number; theme: string }>> {
  if (!geminiApiKey) {
    throw new Error('Gemini API key is required for AI song discovery');
  }

  const defaultPrompt = `
Generate a curated JSON list of ${count} authentic, iconic, and popular Hindi/Bollywood songs released between year ${startYear} and 2026.
Focus on blockbuster tracks from Arijit Singh, Pritam, A.R. Rahman, Shreya Ghoshal, Atif Aslam, Mohit Chauhan, Jubin Nautiyal, Vishal-Shekhar, Sachin-Jigar, KK, Sonu Nigam, Shankar-Ehsaan-Loy, etc.

Return ONLY a valid JSON array of objects with these exact keys:
[
  {
    "song_name": "Kesariya",
    "artist": "Arijit Singh, Pritam",
    "album_or_movie": "Brahmastra",
    "release_year": 2022,
    "theme": "BOLLYWOOD"
  }
]
No markdown code fences, no extra commentary, strictly a raw JSON array.
  `;

  const finalPrompt = promptOverride ? `${promptOverride}\nReturn strictly a JSON array of objects with keys: song_name, artist, album_or_movie, release_year, theme.` : defaultPrompt;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: finalPrompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 8192,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API Error (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as any;
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
  const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

  try {
    const parsed = JSON.parse(cleanJson);
    if (Array.isArray(parsed)) {
      return parsed.map((item: any) => ({
        song_name: item.song_name || item.title || 'Unknown Song',
        artist: item.artist || item.singer || 'Unknown Artist',
        album_or_movie: item.album_or_movie || item.movie || '',
        release_year: Number(item.release_year) || 2020,
        theme: (item.theme || 'BOLLYWOOD').toUpperCase(),
      }));
    }
    return [];
  } catch (err) {
    console.error('Failed to parse Gemini response as JSON:', rawText);
    return [];
  }
}

// ──────────────────────────────────────────────────────────────
// Discovery + YouTube Candidate Validation Preview (Used by "Add Songs" flow)
// ──────────────────────────────────────────────────────────────
export async function runDiscoveryAndPreview(
  db: any,
  geminiApiKey: string,
  ytApiKey: string = '',
  promptOverride?: string
) {
  // 1. Discover songs with Gemini
  const discovered = await discoverBollywoodWithGemini(geminiApiKey, promptOverride, 2000, 40);

  const results = {
    totalFound: discovered.length,
    playable: [] as any[],
    alreadyExisting: [] as any[],
    failed: [] as any[],
  };

  // 2. Fetch existing video IDs from D1
  const { results: existingRows } = await db.prepare(`SELECT youtube_video_id FROM music_catalog`).all();
  const existingSet = new Set((existingRows || []).map((r: any) => r.youtube_video_id));

  // 3. For each discovered song, search YouTube candidate and validate
  for (const song of discovered) {
    const query = `${song.song_name} ${song.artist} ${song.album_or_movie} official song`;
    const candidates = await searchYouTubeCandidates(query, ytApiKey, 3);

    let matchedPlayable = false;
    for (const candidate of candidates) {
      if (existingSet.has(candidate.videoId)) {
        results.alreadyExisting.push({
          ...song,
          youtube_video_id: candidate.videoId,
          title: candidate.title,
        });
        matchedPlayable = true;
        break;
      }

      const check = await validateVideoPlayable(candidate.videoId, ytApiKey);
      if (check.playable) {
        results.playable.push({
          ...song,
          youtube_video_id: candidate.videoId,
          title: candidate.title || song.song_name,
          thumbnail_url: `https://img.youtube.com/vi/${candidate.videoId}/hqdefault.jpg`,
          channel_name: candidate.channelTitle || 'Official',
          duration_seconds: check.meta?.durationSeconds || 240,
        });
        matchedPlayable = true;
        break;
      }
    }

    if (!matchedPlayable) {
      results.failed.push({
        ...song,
        reason: 'No playable/embeddable YouTube candidate found',
      });
    }
  }

  return results;
}

// ──────────────────────────────────────────────────────────────
// Add Batch Of Verified Songs (Used after Super Admin confirms preview)
// ──────────────────────────────────────────────────────────────
export async function addBatchToCatalog(db: any, songs: any[]) {
  let addedCount = 0;
  let skippedCount = 0;

  for (const song of songs) {
    const videoId = extractYouTubeVideoId(song.youtube_video_id || '');
    if (!videoId) {
      skippedCount++;
      continue;
    }

    const normalized = normalizeYouTubeUrls(videoId);
    const songId = `song_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    try {
      await db.prepare(
        `INSERT INTO music_catalog (
          id, youtube_video_id, youtube_url, canonical_url, title, song_name, artist,
          album_or_movie, release_year, language, theme, thumbnail_url, channel_name,
          duration_seconds, embed_url, is_embeddable, youtube_status, playable_status,
          last_checked_at, source, added_by, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PLAYABLE', datetime('now'), 'GEMINI', 'SUPER_ADMIN', 1)
        ON CONFLICT(youtube_video_id) DO UPDATE SET
          playable_status = 'PLAYABLE',
          is_active = 1,
          failure_count = 0,
          last_failure_reason = NULL,
          last_checked_at = datetime('now'),
          updated_at = datetime('now')`
      ).bind(
        songId,
        videoId,
        normalized.youtubeUrl,
        normalized.canonicalUrl,
        song.title || song.song_name,
        song.song_name || song.title,
        song.artist || 'Official',
        song.album_or_movie || '',
        Number(song.release_year) || 2020,
        song.language || 'Hindi',
        (song.theme || 'BOLLYWOOD').toUpperCase(),
        song.thumbnail_url || normalized.thumbnailUrl,
        song.channel_name || 'Official',
        Number(song.duration_seconds) || 240,
        normalized.embedUrl,
        1,
        'AVAILABLE'
      ).run();
      addedCount++;
    } catch (e) {
      console.warn(`Error inserting batch song ${videoId}:`, e);
      skippedCount++;
    }
  }

  return { addedCount, skippedCount, total: songs.length };
}

// ──────────────────────────────────────────────────────────────
// Seed Curated 3 Core Live Themes Catalog (BOLLYWOOD, PUNJABI, TRENDING)
// ──────────────────────────────────────────────────────────────
export async function seedFullCatalog(db: any) {
  let seededCount = 0;
  for (const track of SEED_CATALOG_TRACKS) {
    const videoId = track.videoId;
    const normalized = normalizeYouTubeUrls(videoId);
    const songId = `song_seed_${videoId}`;

    try {
      await db.prepare(
        `INSERT INTO music_catalog (
          id, youtube_video_id, youtube_url, canonical_url, title, song_name, artist,
          album_or_movie, release_year, language, theme, thumbnail_url, channel_name,
          duration_seconds, embed_url, is_embeddable, youtube_status, playable_status,
          last_checked_at, source, added_by, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PLAYABLE', datetime('now'), 'MANUAL', 'SUPER_ADMIN', 1)
        ON CONFLICT(youtube_video_id) DO UPDATE SET
          playable_status = 'PLAYABLE',
          is_active = 1,
          theme = excluded.theme,
          song_name = excluded.song_name,
          artist = excluded.artist,
          album_or_movie = excluded.album_or_movie,
          failure_count = 0,
          last_failure_reason = NULL,
          last_checked_at = datetime('now'),
          updated_at = datetime('now')`
      ).bind(
        songId,
        videoId,
        normalized.youtubeUrl,
        normalized.canonicalUrl,
        track.title || `${track.song_name} — ${track.album_or_movie || track.artist}`,
        track.song_name,
        track.artist,
        track.album_or_movie,
        track.release_year,
        track.theme === 'PUNJABI' ? 'Punjabi' : (track.theme === 'TRENDING' ? 'English/Hindi' : 'Hindi'),
        track.theme,
        normalized.thumbnailUrl,
        'Official Music',
        track.duration_seconds,
        normalized.embedUrl,
        1,
        'AVAILABLE'
      ).run();

      await db.prepare(
        `INSERT OR REPLACE INTO theme_catalog (id, theme, video_id, title, artist, thumbnail, duration_seconds)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        `tc-${videoId}`,
        track.theme,
        videoId,
        track.title || `${track.song_name} — ${track.album_or_movie || track.artist}`,
        track.artist,
        normalized.thumbnailUrl,
        track.duration_seconds
      ).run();

      seededCount++;
    } catch (e) {
      console.warn(`Error seeding track ${videoId}:`, e);
    }
  }

  // Reset & Seed the 4 Dedicated Live Rooms
  try {
    // Delete any old rooms that are not part of the 4 official live streams
    await db.prepare(
      `DELETE FROM rooms WHERE id NOT IN (
        'room-bollywood-hindi',
        'room-punjabi-hits',
        'room-lofi-chill',
        'room-instagram-trending'
      )`
    ).run();

    // Insert or update the 4 Official 24/7 Live Rooms
    const officialRooms = [
      {
        id: 'room-bollywood-hindi',
        name: 'Bollywood Hindi Music Live',
        theme: 'BOLLYWOOD',
        category: 'Bollywood',
        current_video_id: 'BddP6PYo2gs',
        current_title: 'Kesariya — Brahmāstra',
        current_artist: 'Arijit Singh, Pritam',
        current_thumbnail: 'assets/room_bollywood_3d.jpg'
      },
      {
        id: 'room-punjabi-hits',
        name: 'Punjabi Hits Live',
        theme: 'PUNJABI',
        category: 'Punjabi',
        current_video_id: 'vX2cDW8LUWk',
        current_title: 'Excuses — AP Dhillon',
        current_artist: 'AP Dhillon, Gurinder Gill',
        current_thumbnail: 'assets/room_punjabi_3d.jpg'
      },
      {
        id: 'room-lofi-chill',
        name: 'Lo-Fi Chill Beats Live',
        theme: 'LOFI_CHILL',
        category: 'Lo-Fi & Chill',
        current_video_id: 'jfKfPfyJRdk',
        current_title: 'Lofi Hip Hop Radio — Beats to Relax/Study to',
        current_artist: 'Lofi Girl',
        current_thumbnail: 'assets/room_lofi_3d.jpg'
      },
      {
        id: 'room-instagram-trending',
        name: 'Instagram Trending Songs Live',
        theme: 'TRENDING',
        category: 'Instagram Viral & Trending',
        current_video_id: 'hOHKltAiKXQ',
        current_title: 'Big Dawgs — Hanumankind',
        current_artist: 'Hanumankind, Kalmi',
        current_thumbnail: 'assets/room_trending_3d.jpg'
      }
    ];

    for (const r of officialRooms) {
      await db.prepare(
        `INSERT INTO rooms (
          id, name, theme, category, is_private, music_enabled, max_members,
          current_video_id, current_title, current_artist, current_thumbnail,
          play_source_type, created_by
        ) VALUES (?, ?, ?, ?, 0, 1, 500, ?, ?, ?, ?, 'APP_DB', 'system')
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          theme = excluded.theme,
          category = excluded.category,
          current_thumbnail = excluded.current_thumbnail`
      ).bind(
        r.id, r.name, r.theme, r.category,
        r.current_video_id, r.current_title, r.current_artist, r.current_thumbnail
      ).run();
    }

    // Clean up old theme references in catalog
    await db.prepare(`DELETE FROM theme_catalog WHERE theme NOT IN ('BOLLYWOOD', 'PUNJABI', 'LOFI_CHILL', 'TRENDING')`).run();
    await db.prepare(`UPDATE music_catalog SET playable_status = 'PLAYABLE', is_active = 1, failure_count = 0 WHERE is_embeddable = 1`).run();
  } catch (e) {
    console.warn('Error syncing official rooms in D1:', e);
  }

  return seededCount;
}

// ──────────────────────────────────────────────────────────────
// Resync Catalog (Non-destructive smart sync & repair)
// ──────────────────────────────────────────────────────────────
export async function resyncCatalog(db: any, geminiApiKey?: string, ytApiKey: string = '') {
  let recheckedCount = 0;
  let markedFailedCount = 0;
  let restoredCount = 0;

  // 1. Ensure full verified seed catalog is in place
  await seedFullCatalog(db);

  // 2. Validate and restore songs in catalog
  const { results: existingSongs } = await db.prepare(`SELECT * FROM music_catalog`).all();

  if (existingSongs && existingSongs.length > 0) {
    for (const song of existingSongs as any[]) {
      recheckedCount++;
      const check = await validateVideoPlayable(song.youtube_video_id, ytApiKey);
      if (!check.playable) {
        markedFailedCount++;
        await recordSongFailure(db, song.youtube_video_id, 'Video is not embeddable or unavailable on YouTube');
      } else {
        restoredCount++;
        await db.prepare(
          `UPDATE music_catalog 
           SET last_checked_at = datetime('now'),
               playable_status = 'PLAYABLE',
               is_active = 1,
               failure_count = 0,
               last_failure_reason = NULL,
               updated_at = datetime('now')
           WHERE youtube_video_id = ?`
        ).bind(song.youtube_video_id).run();
      }
    }
  }

  const updatedStats = await getCatalogStats(db);

  return {
    recheckedCount,
    markedFailedCount,
    restoredCount,
    stats: updatedStats,
  };
}

// ──────────────────────────────────────────────────────────────
// Search Active Playable Catalog (For In-Room Database Queue Search)
// ──────────────────────────────────────────────────────────────
export async function searchCatalog(db: any, query: string, theme?: string, limit: number = 25) {
  const cleanQ = (query || '').trim().toLowerCase();

  // Auto-seed if database is currently empty
  try {
    const countRow = await db.prepare(`SELECT COUNT(*) as cnt FROM music_catalog`).first();
    if (!countRow || countRow.cnt === 0) {
      await seedFullCatalog(db);
    }
  } catch (e) {}

  if (!cleanQ) {
    let sql = `SELECT * FROM music_catalog WHERE is_active = 1 AND playable_status = 'PLAYABLE'`;
    const params: any[] = [];
    if (theme && theme !== 'ALL') {
      sql += ` AND theme = ?`;
      params.push(theme.toUpperCase());
    }
    sql += ` ORDER BY last_played_at ASC, created_at DESC LIMIT ?`;
    params.push(limit);
    const { results } = await db.prepare(sql).bind(...params).all();
    return results || [];
  }

  // 1. Primary: Search in requested theme
  let sql = `SELECT * FROM music_catalog 
             WHERE is_active = 1 AND playable_status = 'PLAYABLE'
             AND (LOWER(title) LIKE ? OR LOWER(song_name) LIKE ? OR LOWER(artist) LIKE ? OR LOWER(album_or_movie) LIKE ?)`;
  const param = `%${cleanQ}%`;
  const params: any[] = [param, param, param, param];
  
  if (theme && theme !== 'ALL') {
    sql += ` AND theme = ?`;
    params.push(theme.toUpperCase());
  }
  sql += ` ORDER BY created_at DESC LIMIT ?`;
  params.push(limit);

  const { results } = await db.prepare(sql).bind(...params).all();
  if (results && results.length > 0) {
    return results;
  }

  // 2. Secondary fallback: Search across ALL themes if theme filter yielded no results
  const fallbackSql = `SELECT * FROM music_catalog 
                       WHERE is_active = 1 AND playable_status = 'PLAYABLE'
                       AND (LOWER(title) LIKE ? OR LOWER(song_name) LIKE ? OR LOWER(artist) LIKE ? OR LOWER(album_or_movie) LIKE ?)
                       ORDER BY created_at DESC LIMIT ?`;
  const { results: fallbackResults } = await db.prepare(fallbackSql).bind(param, param, param, param, limit).all();
  return fallbackResults || [];
}

// ──────────────────────────────────────────────────────────────
// Song Requests System (User requests missing songs)
// ──────────────────────────────────────────────────────────────
export async function createSongRequest(db: any, query: string, requestedBy: string, userEmail?: string) {
  const cleanQ = (query || '').trim();
  if (!cleanQ) throw new Error('Song query cannot be empty');

  // Check if song already exists in catalog
  const existingSong = await db.prepare(
    `SELECT * FROM music_catalog WHERE is_active = 1 AND (LOWER(song_name) LIKE ? OR LOWER(title) LIKE ?) LIMIT 1`
  ).bind(`%${cleanQ.toLowerCase()}%`, `%${cleanQ.toLowerCase()}%`).first();

  if (existingSong) {
    return {
      alreadyExists: true,
      song: existingSong,
      message: 'This song is already available in the database!'
    };
  }

  // Check if pending request exists
  const existingReq = await db.prepare(
    `SELECT * FROM song_requests WHERE status = 'PENDING' AND LOWER(query) = ? LIMIT 1`
  ).bind(cleanQ.toLowerCase()).first();

  if (existingReq) {
    return {
      alreadyRequested: true,
      requestId: existingReq.id,
      message: 'This song has already been requested and is currently being verified by Super Admin!'
    };
  }

  const id = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  await db.prepare(
    `INSERT INTO song_requests (id, query, clean_title, requested_by, user_email, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'PENDING', datetime('now'))`
  ).bind(id, cleanQ, cleanQ, requestedBy, userEmail || '').run();

  return {
    success: true,
    requestId: id,
    message: 'Song request submitted! Super Admin will verify and sync it shortly.'
  };
}

// Get song requests for Super Admin Hub
export async function getSongRequests(db: any, statusFilter: string = 'ALL', limit: number = 50) {
  let sql = `SELECT * FROM song_requests`;
  const params: any[] = [];
  if (statusFilter && statusFilter !== 'ALL') {
    sql += ` WHERE status = ?`;
    params.push(statusFilter.toUpperCase());
  }
  sql += ` ORDER BY created_at DESC LIMIT ?`;
  params.push(limit);

  const { results } = await db.prepare(sql).bind(...params).all();
  
  const pendingCountRow = await db.prepare(`SELECT COUNT(*) as c FROM song_requests WHERE status = 'PENDING'`).first() as any;
  const completedCountRow = await db.prepare(`SELECT COUNT(*) as c FROM song_requests WHERE status = 'COMPLETED'`).first() as any;

  return {
    requests: results || [],
    pendingCount: pendingCountRow ? pendingCountRow.c : 0,
    completedCount: completedCountRow ? completedCountRow.c : 0
  };
}

// Super Admin: Re-sync / Add requested song
export async function syncRequestedSong(db: any, requestId: string, geminiKey?: string, ytKey: string = '') {
  const req = await db.prepare(`SELECT * FROM song_requests WHERE id = ?`).bind(requestId).first() as any;
  if (!req) throw new Error('Request not found');

  const query = req.query;

  // Search YouTube candidates
  const candidates: string[] = [];
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' official bollywood song')}&sp=EgIQAQ%253D%253D`;
  try {
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      }
    });
    if (res.ok) {
      const html = await res.text();
      const regex = /\/watch\?v=([a-zA-Z0-9_-]{11})/g;
      let match;
      while ((match = regex.exec(html)) !== null) {
        if (!candidates.includes(match[1])) candidates.push(match[1]);
        if (candidates.length >= 6) break;
      }
    }
  } catch (e) {}

  if (candidates.length === 0) {
    throw new Error('Could not find candidate YouTube video for this song');
  }

  // Strictly validate embeddability via oEmbed
  let verifiedSong: any = null;
  for (const vid of candidates) {
    try {
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${vid}&format=json`);
      if (oembedRes.ok) {
        const data = await oembedRes.json() as any;
        if (data && data.title) {
          verifiedSong = {
            videoId: vid,
            title: data.title,
            author: data.author_name || 'Official',
            thumbnail: data.thumbnail_url || `https://img.youtube.com/vi/${vid}/hqdefault.jpg`
          };
          break;
        }
      }
    } catch (e) {}
  }

  if (!verifiedSong) {
    await db.prepare(`UPDATE song_requests SET failure_reason = 'No embeddable YouTube source found' WHERE id = ?`).bind(requestId).run();
    throw new Error('No playable/embeddable YouTube source found for this song');
  }

  // Add to music_catalog
  const songId = `song_${verifiedSong.videoId}`;
  const url = `https://www.youtube.com/watch?v=${verifiedSong.videoId}`;
  const embedUrl = `https://www.youtube.com/embed/${verifiedSong.videoId}`;
  const cleanTitle = verifiedSong.title.replace(/'/g, "''");
  const cleanAuthor = verifiedSong.author.replace(/'/g, "''");

  await db.prepare(
    `INSERT OR REPLACE INTO music_catalog (
      id, youtube_video_id, youtube_url, canonical_url, title, song_name, artist,
      album_or_movie, release_year, language, theme, thumbnail_url, channel_name,
      duration_seconds, embed_url, is_embeddable, youtube_status, playable_status,
      last_checked_at, source, added_by, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Bollywood', 2023, 'Hindi', 'BOLLYWOOD', ?, ?, 240, ?, 1, 'AVAILABLE', 'PLAYABLE', datetime('now'), 'MANUAL', 'SUPER_ADMIN', 1)`
  ).bind(
    songId, verifiedSong.videoId, url, url, cleanTitle,
    query.substring(0, 60), cleanAuthor,
    verifiedSong.thumbnail, cleanAuthor, embedUrl
  ).run();

  // Mark request as COMPLETED
  await db.prepare(
    `UPDATE song_requests 
     SET status = 'COMPLETED', synced_song_id = ?, completed_at = datetime('now')
     WHERE id = ?`
  ).bind(songId, requestId).run();

  return {
    success: true,
    songId,
    songTitle: verifiedSong.title,
    artist: verifiedSong.author
  };
}

// ──────────────────────────────────────────────────────────────
// Backfill Real Durations For Existing Catalog Songs
// ──────────────────────────────────────────────────────────────
export async function backfillCatalogDurations(db: any, ytApiKey: string) {
  if (!ytApiKey) {
    return { success: false, message: 'YouTube API key is required to backfill durations' };
  }

  const { results } = await db.prepare(
    `SELECT youtube_video_id FROM music_catalog WHERE is_active = 1`
  ).all();

  if (!results || results.length === 0) {
    return { success: true, updatedCount: 0, total: 0 };
  }

  const videoIds = (results as any[]).map((r: any) => r.youtube_video_id).filter(Boolean);
  let updatedCount = 0;

  // YouTube API allows up to 50 video IDs per request in comma-separated list
  for (let i = 0; i < videoIds.length; i += 50) {
    const chunk = videoIds.slice(i, i + 50);
    try {
      const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${chunk.join(',')}&key=${ytApiKey}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = (await res.json()) as any;
        if (data.items) {
          for (const item of data.items) {
            const vId = item.id;
            const durationStr = item.contentDetails?.duration;
            const durSec = parseISO8601Duration(durationStr);
            if (durSec > 0) {
              await db.prepare(
                `UPDATE music_catalog SET duration_seconds = ?, updated_at = datetime('now') WHERE youtube_video_id = ?`
              ).bind(durSec, vId).run();
              updatedCount++;
            }
          }
        }
      }
    } catch (err) {
      console.warn('Error in backfillCatalogDurations chunk:', err);
    }
  }

  return { success: true, updatedCount, total: videoIds.length };
}

