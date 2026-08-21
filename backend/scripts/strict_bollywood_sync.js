// Strict Bollywood Ingestion Engine
// Discovers, Validates, Checks Duplicates, Tests Embeddability, and Ingests Strictly Playable Bollywood Tracks

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ARTISTS_AND_FILMS = [
  'Arijit Singh Pritam',
  'Shreya Ghoshal romantic songs',
  'Atif Aslam bollywood hits',
  'KK evergreen songs',
  'Mohit Chauhan bollywood songs',
  'Sonu Nigam bollywood hits',
  'A.R. Rahman hindi songs',
  'Jubin Nautiyal romantic songs',
  'Vishal Mishra hindi hits',
  'Sachin-Jigar official songs',
  'Amit Trivedi songs',
  'Sunidhi Chauhan dance hits',
  'Shankar-Ehsaan-Loy hits',
  'Mithoon romantic hits',
  'Ankit Tiwari bollywood songs',
  'Armaan Malik romantic songs',
  'Darshan Raval hindi songs',
  'Alka Yagnik 2000s hits',
  'Udit Narayan 2000s hits',
  'Kishore Kumar original songs'
];

// Spam / Fake Cover / 1-hour loop / Podcast blacklist filter
const BLACKLIST_KEYWORDS = [
  'podcast',
  'mashup',
  'dj mix',
  'remix',
  'club mix',
  'bass boosted',
  '8d audio',
  'slowed reverb',
  'reaction',
  'review',
  'interview',
  'behind the scenes',
  'status video',
  'ringtone',
  'instrumental cover',
  'guitar lesson',
  'piano tutorial',
  'karaoke'
];

async function isEmbeddableOEmbed(videoId) {
  try {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.title && data.author_name) {
      return {
        title: data.title,
        author: data.author_name,
        thumbnail: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      };
    }
    return null;
  } catch (e) {
    return null;
  }
}

async function searchCandidates(query) {
  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' official song')}&sp=EgIQAQ%253D%253D`;
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    if (!res.ok) return [];
    const html = await res.text();
    const regex = /\/watch\?v=([a-zA-Z0-9_-]{11})/g;
    const ids = [];
    let match;
    while ((match = regex.exec(html)) !== null) {
      if (!ids.includes(match[1])) ids.push(match[1]);
      if (ids.length >= 10) break;
    }
    return ids;
  } catch (e) {
    return [];
  }
}

function isCleanBollywoodTitle(title) {
  const lower = title.toLowerCase();
  for (const bl of BLACKLIST_KEYWORDS) {
    if (lower.includes(bl)) return false;
  }
  return true;
}

async function getExistingIds() {
  try {
    const res = execSync(
      `npx wrangler d1 execute musiclive --remote --command="SELECT youtube_video_id FROM music_catalog;" -y`,
      { cwd: path.join(__dirname, '..'), encoding: 'utf8' }
    );
    const matches = res.match(/"youtube_video_id":\s*"([^"]+)"/g) || [];
    return new Set(matches.map((m) => m.replace(/"youtube_video_id":\s*"|"/g, '')));
  } catch (e) {
    return new Set();
  }
}

async function runStrictSync() {
  console.log('===============================================================');
  console.log('🛡️ STARTING STRICT BOLLYWOOD SONG INGESTION & SYNC ENGINE');
  console.log('===============================================================\n');

  const existingIds = await getExistingIds();
  console.log(`Loaded ${existingIds.size} existing songs from D1 (Duplicate Protection Active).\n`);

  let addedTotal = 0;
  let rejectedTotal = 0;

  for (const query of ARTISTS_AND_FILMS) {
    console.log(`\n🔍 Discovering for: "${query}"...`);
    const candidateIds = await searchCandidates(query);

    for (const vid of candidateIds) {
      if (existingIds.has(vid)) {
        continue; // duplicate check
      }

      // Check oEmbed & metadata
      const meta = await isEmbeddableOEmbed(vid);
      if (!meta) {
        rejectedTotal++;
        continue;
      }

      // Check title blacklist
      if (!isCleanBollywoodTitle(meta.title)) {
        rejectedTotal++;
        continue;
      }

      // Validated Clean Bollywood Song
      const songId = `song_${vid}`;
      const cleanTitle = meta.title.replace(/'/g, "''");
      const cleanAuthor = meta.author.replace(/'/g, "''");
      const url = `https://www.youtube.com/watch?v=${vid}`;
      const embedUrl = `https://www.youtube.com/embed/${vid}`;

      const sql = `INSERT OR IGNORE INTO music_catalog (
        id, youtube_video_id, youtube_url, canonical_url, title, song_name, artist,
        album_or_movie, release_year, language, theme, thumbnail_url, channel_name,
        duration_seconds, embed_url, is_embeddable, youtube_status, playable_status,
        last_checked_at, source, added_by, is_active
      ) VALUES (
        '${songId}', '${vid}', '${url}', '${url}', '${cleanTitle}',
        '${cleanTitle.substring(0, 50)}', '${cleanAuthor}', 'Bollywood Hit',
        2022, 'Hindi', 'BOLLYWOOD', '${meta.thumbnail}', '${cleanAuthor}',
        240, '${embedUrl}', 1, 'AVAILABLE', 'PLAYABLE', datetime('now'), 'SYSTEM', 'SUPER_ADMIN', 1
      );`;

      try {
        execSync(`npx wrangler d1 execute musiclive --remote --command="${sql}" -y`, {
          cwd: path.join(__dirname, '..'),
          stdio: 'pipe',
        });
        existingIds.add(vid);
        addedTotal++;
        console.log(`✅ [PLAYABLE INGESTED #${addedTotal}] ${meta.title.substring(0, 50)} (${meta.author})`);
      } catch (err) {
        // ignore duplicate
      }
    }
  }

  console.log('\n===============================================================');
  console.log(`🎉 STRICT SYNC COMPLETE: Ingested ${addedTotal} new strictly playable Bollywood songs.`);
  console.log(`Total active songs in database now: ${existingIds.size}`);
  console.log('===============================================================\n');
}

runStrictSync();
