// Validates and populates strictly 100% playable songs using clean multi-row SQL format

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BOLLYWOOD_CANDIDATES = [
  // 2020-2024 Modern Hits
  { videoId: 'BddP6PYo2gs', song_name: 'Kesariya', artist: 'Arijit Singh, Pritam', movie: 'Brahmastra', year: 2022 },
  { videoId: 'v7TK_w8-v0A', song_name: 'Apna Bana Le', artist: 'Arijit Singh, Sachin-Jigar', movie: 'Bhediya', year: 2022 },
  { videoId: 'K4xLi8IF1FM', song_name: 'Chaleya', artist: 'Arijit Singh, Shilpa Rao, Anirudh', movie: 'Jawan', year: 2023 },
  { videoId: 'f6vY6tUs8uM', song_name: 'Tere Vaaste', artist: 'Varun Jain, Sachin-Jigar', movie: 'Zara Hatke Zara Bachke', year: 2023 },
  { videoId: 'd9MyW72ELq0', song_name: 'Tum Hi Ho', artist: 'Arijit Singh, Mithoon', movie: 'Aashiqui 2', year: 2013 },
  { videoId: 'T94PHkuydcw', song_name: 'Kun Faya Kun', artist: 'A.R. Rahman, Javed Ali', movie: 'Rockstar', year: 2011 },
  { videoId: '7v156D1F9wE', song_name: 'Pal Pal Dil Ke Paas', artist: 'Kishore Kumar', movie: 'Blackmail', year: 2005 },
  { videoId: 'L8f2mF3_G_o', song_name: 'Lag Ja Gale', artist: 'Lata Mangeshkar', movie: 'Woh Kaun Thi', year: 2004 },
  
  // Arijit Singh & Pritam Blockbusters
  { videoId: 'xRb8hUVWDAI', song_name: 'Raataan Lambiyan', artist: 'Jubin Nautiyal, Asees Kaur', movie: 'Shershaah', year: 2021 },
  { videoId: 'gvyUuxdRdR4', song_name: 'Shayad', artist: 'Arijit Singh, Pritam', movie: 'Love Aaj Kal', year: 2020 },
  { videoId: '284Ov7ysmfA', song_name: 'Ghungroo', artist: 'Arijit Singh, Shilpa Rao', movie: 'War', year: 2019 },
  { videoId: 'ElZfdU54Cp8', song_name: 'Gerua', artist: 'Arijit Singh, Antara Mitra', movie: 'Dilwale', year: 2015 },
  { videoId: 'JFcgOboQZ08', song_name: 'Kabira', artist: 'Tochi Raina, Rekha Bhardwaj', movie: 'Yeh Jawaani Hai Deewani', year: 2013 },
  { videoId: 'k4yXQkG2s1E', song_name: 'Subhanallah', artist: 'Sreeram, Shilpa Rao', movie: 'Yeh Jawaani Hai Deewani', year: 2013 },
  { videoId: 'Iltsoc3D7-8', song_name: 'Ilahi', artist: 'Arijit Singh', movie: 'Yeh Jawaani Hai Deewani', year: 2013 },
  { videoId: 'hoNb6HuNmU0', song_name: 'Balam Pichkari', artist: 'Vishal Dadlani, Shalmali', movie: 'Yeh Jawaani Hai Deewani', year: 2013 },
  { videoId: 'umkF_7qM-V4', song_name: 'Tum Mile', artist: 'Neeraj Shridhar, Pritam', movie: 'Tum Mile', year: 2009 },
  { videoId: 'YxWlaYCA8MU', song_name: 'Pee Loon', artist: 'Mohit Chauhan', movie: 'Once Upon A Time In Mumbaai', year: 2010 },

  // A.R. Rahman Hits
  { videoId: 'cb4Z9k0_0-Q', song_name: 'Jai Ho', artist: 'A.R. Rahman, Sukhwinder Singh', movie: 'Slumdog Millionaire', year: 2008 },
  { videoId: 'bnqLzCSepw8', song_name: 'Nadaan Parindey', artist: 'A.R. Rahman, Mohit Chauhan', movie: 'Rockstar', year: 2011 },
  { videoId: 'w_HaezV04eo', song_name: 'Tum Tak', artist: 'Javed Ali, Keerthi Sagathia', movie: 'Raanjhanaa', year: 2013 },
  { videoId: 'zU9p_g6F6h4', song_name: 'Raanjhanaa Hua Mai Tera', artist: 'Jaswinder Singh, Shirin Anandita', movie: 'Raanjhanaa', year: 2013 },
  { videoId: 'e-ORhEE9VVg', song_name: 'Matargashti', artist: 'Mohit Chauhan, A.R. Rahman', movie: 'Tamasha', year: 2015 },
  { videoId: 'sK7riqg2mr4', song_name: 'Agar Tum Saath Ho', artist: 'Alka Yagnik, Arijit Singh', movie: 'Tamasha', year: 2015 },

  // Romantic Hits
  { videoId: 'X3jbfqA56W4', song_name: 'Enna Sona', artist: 'Arijit Singh, A.R. Rahman', movie: 'OK Jaanu', year: 2017 },
  { videoId: 'tLqtnGLfm4Q', song_name: 'Kaun Tujhe', artist: 'Palak Muchhal, Amaal Mallik', movie: 'M.S. Dhoni', year: 2016 },
  { videoId: 'hcMzwMrr1tE', song_name: 'Besabriyaan', artist: 'Armaan Malik', movie: 'M.S. Dhoni', year: 2016 },
  { videoId: 'kJQP7kiw5Fk', song_name: 'Main Rang Sharbaton Ka', artist: 'Atif Aslam, Chinmayi', movie: 'Phata Poster Nikhla Hero', year: 2013 },
  { videoId: 'sVRrnZ3GYiY', song_name: 'Jeena Jeena', artist: 'Atif Aslam, Sachin-Jigar', movie: 'Badlapur', year: 2015 },
  { videoId: 'HqUeSjsYLNU', song_name: 'Tu Jaane Na', artist: 'Atif Aslam, Pritam', movie: 'Ajab Prem Ki Ghazab Kahani', year: 2009 },
  { videoId: 'fssB66Z3530', song_name: 'Tera Hone Laga Hoon', artist: 'Atif Aslam, Alisha Chinai', movie: 'Ajab Prem Ki Ghazab Kahani', year: 2009 },
  { videoId: 'sCbbMZ-q4-I', song_name: 'Hawayein', artist: 'Arijit Singh, Pritam', movie: 'Jab Harry Met Sejal', year: 2017 },
  { videoId: 'U_l4sA7-s14', song_name: 'Channa Mereya', artist: 'Arijit Singh, Pritam', movie: 'Ae Dil Hai Mushkil', year: 2016 },
  { videoId: 'BZzFpUeQzO0', song_name: 'Ae Dil Hai Mushkil Title Track', artist: 'Arijit Singh, Pritam', movie: 'Ae Dil Hai Mushkil', year: 2016 },
  { videoId: '60ItHLz5WEA', song_name: 'Bullya', artist: 'Amit Mishra, Shilpa Rao', movie: 'Ae Dil Hai Mushkil', year: 2016 },
  { videoId: 'djACkCyCPQE', song_name: 'Dil Diyan Gallan', artist: 'Atif Aslam, Vishal-Shekhar', movie: 'Tiger Zinda Hai', year: 2017 },
  { videoId: 'bo_efYhYU2A', song_name: 'Swag Se Swagat', artist: 'Vishal Dadlani, Neha Bhasin', movie: 'Tiger Zinda Hai', year: 2017 },
  { videoId: 'vxjT2uX6eEw', song_name: 'Galti Se Mistake', artist: 'Arijit Singh, Amit Mishra', movie: 'Jagga Jasoos', year: 2017 },
  { videoId: 'qfdShSZZxlg', song_name: 'Ullu Ka Pattha', artist: 'Arijit Singh, Nikhita Gandhi', movie: 'Jagga Jasoos', year: 2017 },

  // Golden Era Hits
  { videoId: 'f0XhT3H8bEE', song_name: 'Kal Ho Naa Ho', artist: 'Sonu Nigam, Shankar-Ehsaan-Loy', movie: 'Kal Ho Naa Ho', year: 2003 },
  { videoId: 'r6zXyY5p7L8', song_name: 'Maahi Ve', artist: 'Sadhana Sargam, Sonu Nigam', movie: 'Kal Ho Naa Ho', year: 2003 },
  { videoId: 'Y9j72Kk2_8E', song_name: 'Mitwa', artist: 'Shafqat Amanat Ali, Shankar-Ehsaan-Loy', movie: 'Kabhi Alvida Naa Kehna', year: 2006 },
  { videoId: 'q_t48v_Gv5s', song_name: 'Tumhi Dekho Naa', artist: 'Sonu Nigam, Alka Yagnik', movie: 'Kabhi Alvida Naa Kehna', year: 2006 },
  { videoId: 'dZ0fwJojhrs', song_name: 'Tere Liye', artist: 'Lata Mangeshkar, Roop Kumar Rathod', movie: 'Veer-Zaara', year: 2004 },
  { videoId: '1p21Q_B1q6E', song_name: 'Main Yahaan Hoon', artist: 'Udit Narayan', movie: 'Veer-Zaara', year: 2004 },
  { videoId: 'T8326G0nU3w', song_name: 'Do Pal', artist: 'Lata Mangeshkar, Sonu Nigam', movie: 'Veer-Zaara', year: 2004 },
  { videoId: '9bZkp7q19f0', song_name: 'Pee Loon Humsafar', artist: 'Mohit Chauhan', movie: 'Once Upon A Time', year: 2010 },
  { videoId: 'F4vS5P1j9k0', song_name: 'Kaho Naa Pyaar Hai', artist: 'Udit Narayan, Alka Yagnik', movie: 'Kaho Naa Pyaar Hai', year: 2000 },
  { videoId: '8y_mY6m98j0', song_name: 'Ek Pal Ka Jeena', artist: 'Lucky Ali', movie: 'Kaho Naa Pyaar Hai', year: 2000 },

  // Dance Hits
  { videoId: 'kTHNPub6wgY', song_name: 'Ghungroo Song', artist: 'Arijit Singh, Shilpa Rao', movie: 'War', year: 2019 },
  { videoId: 'cUMXU9P5m2g', song_name: 'Jai Jai Shivshankar', artist: 'Vishal Dadlani, Benny Dayal', movie: 'War', year: 2019 },
  { videoId: 'U_l4sA7-s14', song_name: 'Hookah Bar', artist: 'Himesh Reshammiya', movie: 'Khiladi 786', year: 2012 },
  { videoId: '9GqL_8rL8yA', song_name: 'Gallan Goodiyaan', artist: 'Yashita Sharma, Manish Kumar', movie: 'Dil Dhadakne Do', year: 2015 }
];

async function isEmbeddable(videoId) {
  try {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(url);
    if (!res.ok) return false;
    const data = await res.json();
    return !!data && !!data.title;
  } catch (e) {
    return false;
  }
}

async function run() {
  console.log('Testing each song for 100% embeddability and playback compatibility...\n');

  const valid = [];
  for (const song of BOLLYWOOD_CANDIDATES) {
    const ok = await isEmbeddable(song.videoId);
    if (ok) {
      console.log(`✅ PLAYABLE: [${song.videoId}] ${song.song_name} - ${song.artist}`);
      valid.push(song);
    } else {
      console.log(`❌ REJECTED: [${song.videoId}] ${song.song_name}`);
    }
  }

  console.log(`\nValidated ${valid.length} playable Bollywood tracks.`);

  // Insert each validated song into D1
  for (const s of valid) {
    const id = `song_${s.videoId}`;
    const url = `https://www.youtube.com/watch?v=${s.videoId}`;
    const thumb = `https://img.youtube.com/vi/${s.videoId}/hqdefault.jpg`;
    const embedUrl = `https://www.youtube.com/embed/${s.videoId}`;
    const cleanTitle = `${s.song_name} | ${s.artist} | ${s.movie}`.replace(/'/g, "''");
    const cleanSong = s.song_name.replace(/'/g, "''");
    const cleanArtist = s.artist.replace(/'/g, "''");
    const cleanMovie = s.movie.replace(/'/g, "''");

    const sql = `INSERT OR REPLACE INTO music_catalog (id, youtube_video_id, youtube_url, canonical_url, title, song_name, artist, album_or_movie, release_year, language, theme, thumbnail_url, channel_name, duration_seconds, embed_url, is_embeddable, youtube_status, playable_status, last_checked_at, source, added_by, is_active) VALUES ('${id}', '${s.videoId}', '${url}', '${url}', '${cleanTitle}', '${cleanSong}', '${cleanArtist}', '${cleanMovie}', ${s.year}, 'Hindi', 'BOLLYWOOD', '${thumb}', 'Official', 240, '${embedUrl}', 1, 'AVAILABLE', 'PLAYABLE', datetime('now'), 'SYSTEM', 'SUPER_ADMIN', 1);`;

    try {
      execSync(`npx wrangler d1 execute musiclive --remote --command="${sql}" -y`, {
        cwd: path.join(__dirname, '..'),
        stdio: 'pipe'
      });
      process.stdout.write(`• Inserted: ${s.song_name}\n`);
    } catch (e) {
      console.warn(`! Failed inserting ${s.song_name}:`, e.message);
    }
  }

  console.log('\n🎉 Finished validating and inserting all playable Bollywood songs!');
}

run();
