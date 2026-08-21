// Script to discover, validate and populate 100+ playable songs with 10, 20, 30, 40... milestone updates

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Extended list of top Bollywood/Hindi hits with their search queries
const SEARCH_QUERIES = [
  'Arijit Singh hits official',
  'Pritam songs official',
  'Atif Aslam romantic songs official',
  'Shreya Ghoshal hindi songs official',
  'KK hit songs official',
  'Mohit Chauhan songs official',
  'Sonu Nigam romantic songs official',
  'A.R. Rahman hindi hits official',
  'Jubin Nautiyal hit songs official',
  'Vishal Mishra hindi songs official',
  'Darshan Raval official songs',
  'Sachin Jigar songs official',
  'Bollywood 2000s superhit songs',
  'Bollywood romantic songs 2023 2024',
  'Lofi hindi songs official',
  'Coke studio hindi songs official'
];

async function isEmbeddable(videoId) {
  try {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.title && data.author_name) {
      return {
        title: data.title,
        author: data.author_name,
        thumbnail: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      };
    }
    return null;
  } catch (e) {
    return null;
  }
}

async function getSearchVideoIds(query) {
  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%253D%253D`; // sp=filter for videos only
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });
    if (!res.ok) return [];
    const html = await res.text();
    
    // Extract video IDs
    const regex = /\/watch\?v=([a-zA-Z0-9_-]{11})/g;
    const ids = [];
    let match;
    while ((match = regex.exec(html)) !== null) {
      if (!ids.includes(match[1])) {
        ids.push(match[1]);
      }
    }
    return ids;
  } catch (e) {
    return [];
  }
}

async function getDatabaseCount() {
  try {
    const res = execSync(`npx wrangler d1 execute musiclive --remote --command="SELECT COUNT(*) as c FROM music_catalog WHERE playable_status = 'PLAYABLE';" -y`, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    });
    const match = res.match(/"total_playable":\s*(\d+)/) || res.match(/"c":\s*(\d+)/);
    if (match) return parseInt(match[1], 10);
  } catch (e) {}
  return 0;
}

async function main() {
  console.log('Fetching current playable song count from Cloudflare D1...');
  let currentCount = await getDatabaseCount();
  console.log(`Current Playable Count in D1: ${currentCount}`);

  let lastMilestone = Math.floor(currentCount / 10) * 10;
  console.log(`Initial milestone: ${lastMilestone}\n`);

  const seenIds = new Set();
  const validBatch = [];

  for (const query of SEARCH_QUERIES) {
    if (currentCount >= 105) {
      console.log('🎯 Target of 100+ strictly playable songs already reached!');
      break;
    }

    console.log(`\n🔍 Searching: "${query}"...`);
    const videoIds = await getSearchVideoIds(query);
    console.log(`Found ${videoIds.length} candidate videos. Validating playback...`);

    for (const vid of videoIds) {
      if (seenIds.has(vid)) continue;
      seenIds.add(vid);

      const metadata = await isEmbeddable(vid);
      if (metadata) {
        // Clean title
        const cleanTitle = metadata.title.replace(/'/g, "''");
        const cleanAuthor = metadata.author.replace(/'/g, "''");
        const url = `https://www.youtube.com/watch?v=${vid}`;
        const embedUrl = `https://www.youtube.com/embed/${vid}`;
        const id = `song_${vid}`;

        const sql = `INSERT OR IGNORE INTO music_catalog (id, youtube_video_id, youtube_url, canonical_url, title, song_name, artist, album_or_movie, release_year, language, theme, thumbnail_url, channel_name, duration_seconds, embed_url, is_embeddable, youtube_status, playable_status, last_checked_at, source, added_by, is_active) VALUES ('${id}', '${vid}', '${url}', '${url}', '${cleanTitle}', '${cleanTitle.substring(0, 50)}', '${cleanAuthor}', 'Bollywood Hit', 2022, 'Hindi', 'BOLLYWOOD', '${metadata.thumbnail}', '${cleanAuthor}', 240, '${embedUrl}', 1, 'AVAILABLE', 'PLAYABLE', datetime('now'), 'SYSTEM', 'SUPER_ADMIN', 1);`;

        try {
          execSync(`npx wrangler d1 execute musiclive --remote --command="${sql}" -y`, {
            cwd: path.join(__dirname, '..'),
            stdio: 'pipe'
          });
          currentCount++;

          // Report progress milestones: 10, 20, 30, 40, 50, 60, 70, 80, 90, 100+
          if (currentCount >= lastMilestone + 10) {
            lastMilestone = Math.floor(currentCount / 10) * 10;
            console.log(`\n========================================`);
            console.log(`🎵 [PLAYABLE ADDED: ${lastMilestone} SONGS]`);
            console.log(`========================================\n`);
          } else {
            process.stdout.write(`+ [${currentCount}] ${metadata.title.substring(0, 40)}...\n`);
          }

          if (currentCount >= 105) break;
        } catch (err) {
          // ignore duplicate
        }
      }
    }
  }

  console.log(`\n🎉 Final Playable Songs Count in Database: ${currentCount}`);
}

main();
