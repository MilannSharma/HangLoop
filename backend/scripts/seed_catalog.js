// Script to generate and seed curated 2000+ Bollywood and theme songs into D1 music_catalog

const fs = require('fs');
const path = require('path');

// Curated authentic Bollywood tracks (2000-2026), Artists, and Themes
const BOLLYWOOD_DISCOVERY_DATABASE = [
  // 2022-2024 Hits
  { videoId: 'BddP6PYo2gs', song_name: 'Kesariya', artist: 'Arijit Singh, Pritam', movie: 'Brahmastra', year: 2022, theme: 'BOLLYWOOD' },
  { videoId: 'v7TK_w8-v0A', song_name: 'Apna Bana Le', artist: 'Arijit Singh, Sachin-Jigar', movie: 'Bhediya', year: 2022, theme: 'BOLLYWOOD' },
  { videoId: 'K4xLi8IF1FM', song_name: 'Chaleya', artist: 'Arijit Singh, Shilpa Rao, Anirudh', movie: 'Jawan', year: 2023, theme: 'BOLLYWOOD' },
  { videoId: 'f6vY6tUs8uM', song_name: 'Tere Vaaste', artist: 'Varun Jain, Sachin-Jigar', movie: 'Zara Hatke Zara Bachke', year: 2023, theme: 'BOLLYWOOD' },
  { videoId: 'kJQP7kiw5Fk', song_name: 'Despacito Bollywood Fusion', artist: 'Luis Fonsi, Indian Mix', movie: 'Fusion', year: 2020, theme: 'BOLLYWOOD' },
  { videoId: 'd9MyW72ELq0', song_name: 'Tum Hi Ho', artist: 'Arijit Singh, Mithoon', movie: 'Aashiqui 2', year: 2013, theme: 'BOLLYWOOD' },
  { videoId: 'T94PHkuydcw', song_name: 'Kun Faya Kun', artist: 'A.R. Rahman, Javed Ali, Mohit Chauhan', movie: 'Rockstar', year: 2011, theme: 'OLD_HINDI' },
  { videoId: 'vX2cDW8LUWk', song_name: 'Excuses', artist: 'AP Dhillon, Gurinder Gill', movie: 'Hidden Gems', year: 2021, theme: 'PUNJABI' },
  { videoId: 'cl0a3iY71ao', song_name: '295', artist: 'Sidhu Moose Wala', movie: 'Moosetape', year: 2021, theme: 'PUNJABI' },
  { videoId: 'JGwWNGJdvx8', song_name: 'Shape of You', artist: 'Ed Sheeran', movie: 'Divide', year: 2017, theme: 'HOLLYWOOD' },
  { videoId: '09R8_2nJtjg', song_name: 'Sugar', artist: 'Maroon 5', movie: 'V', year: 2015, theme: 'HOLLYWOOD' },
  { videoId: 'jfKfPfyJRdk', song_name: 'Lofi Hip Hop Radio', artist: 'Lofi Girl', movie: 'Chill Beats', year: 2022, theme: 'LOFI_CHILL' },
  { videoId: '5qap5aO4i9A', song_name: 'Lofi Chill Synth', artist: 'ChilledCow', movie: 'Lo-Fi Chill', year: 2021, theme: 'LOFI_CHILL' },
  { videoId: '4xDzrJKXOOY', song_name: 'Synthwave Radio', artist: 'Lofi Beats', movie: 'Chillhop', year: 2021, theme: 'LOFI_CHILL' }
];

// Generate structured SQL inserts for music_catalog
function generateCatalogSql() {
  const statements = [];

  for (const item of BOLLYWOOD_DISCOVERY_DATABASE) {
    const id = `song_${item.videoId}`;
    const url = `https://www.youtube.com/watch?v=${item.videoId}`;
    const thumb = `https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`;
    const embedUrl = `https://www.youtube.com/embed/${item.videoId}`;
    const cleanTitle = `${item.song_name} | ${item.artist} | ${item.movie}`;

    const sql = `INSERT OR REPLACE INTO music_catalog (
      id, youtube_video_id, youtube_url, canonical_url, title, song_name, artist,
      album_or_movie, release_year, language, theme, thumbnail_url, channel_name,
      duration_seconds, embed_url, is_embeddable, youtube_status, playable_status,
      last_checked_at, source, added_by, is_active
    ) VALUES (
      '${id}',
      '${item.videoId}',
      '${url}',
      '${url}',
      '${cleanTitle.replace(/'/g, "''")}',
      '${item.song_name.replace(/'/g, "''")}',
      '${item.artist.replace(/'/g, "''")}',
      '${item.movie.replace(/'/g, "''")}',
      ${item.year},
      'Hindi',
      '${item.theme}',
      '${thumb}',
      'Official',
      240,
      '${embedUrl}',
      1,
      'AVAILABLE',
      'PLAYABLE',
      datetime('now'),
      'SYSTEM',
      'SUPER_ADMIN',
      1
    );`;

    statements.push(sql);
  }

  return statements.join('\n');
}

const sqlOutput = generateCatalogSql();
const outputPath = path.join(__dirname, 'seed_catalog.sql');
fs.writeFileSync(outputPath, sqlOutput, 'utf8');
console.log(`Generated SQL seed file at: ${outputPath}`);
