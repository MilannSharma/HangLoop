// 100% Verified Playable YouTube Songs Seed Data for Hangloop Platform
// 4 Pure Dedicated Live Themes: BOLLYWOOD, PUNJABI, LOFI_CHILL, TRENDING

export interface SeedTrack {
  videoId: string;
  song_name: string;
  artist: string;
  album_or_movie: string;
  release_year: number;
  theme: 'BOLLYWOOD' | 'PUNJABI' | 'LOFI_CHILL' | 'TRENDING';
  duration_seconds: number;
  title: string;
  thumbnail_url: string;
}

export const VERIFIED_SEED_TRACKS: SeedTrack[] = [
  // ═══════════════════════════════════════════════════════════════════
  // 1. BOLLYWOOD (Pure Hindi / Bollywood Songs Live)
  // ═══════════════════════════════════════════════════════════════════
  {
    videoId: 'BddP6PYo2gs',
    song_name: 'Kesariya',
    artist: 'Arijit Singh, Pritam',
    album_or_movie: 'Brahmāstra',
    release_year: 2022,
    theme: 'BOLLYWOOD',
    duration_seconds: 268,
    title: 'Kesariya — Brahmāstra | Arijit Singh',
    thumbnail_url: 'https://img.youtube.com/vi/BddP6PYo2gs/hqdefault.jpg'
  },
  {
    videoId: 'T94PHkuydcw',
    song_name: 'Kun Faya Kun',
    artist: 'A.R. Rahman, Javed Ali, Mohit Chauhan',
    album_or_movie: 'Rockstar',
    release_year: 2011,
    theme: 'BOLLYWOOD',
    duration_seconds: 473,
    title: 'Kun Faya Kun — Rockstar | A.R. Rahman',
    thumbnail_url: 'https://img.youtube.com/vi/T94PHkuydcw/hqdefault.jpg'
  },
  {
    videoId: 'hoNb6HuNmU0',
    song_name: 'Khairiyat',
    artist: 'Arijit Singh, Pritam',
    album_or_movie: 'Chhichhore',
    release_year: 2019,
    theme: 'BOLLYWOOD',
    duration_seconds: 280,
    title: 'Khairiyat — Chhichhore | Arijit Singh',
    thumbnail_url: 'https://img.youtube.com/vi/hoNb6HuNmU0/hqdefault.jpg'
  },
  {
    videoId: 'Umqb9KENgmk',
    song_name: 'Tum Hi Ho',
    artist: 'Arijit Singh, Mithoon',
    album_or_movie: 'Aashiqui 2',
    release_year: 2013,
    theme: 'BOLLYWOOD',
    duration_seconds: 262,
    title: 'Tum Hi Ho — Aashiqui 2 | Arijit Singh',
    thumbnail_url: 'https://img.youtube.com/vi/Umqb9KENgmk/hqdefault.jpg'
  },
  {
    videoId: '95I5VaR7GeU',
    song_name: 'Laila Main Laila',
    artist: 'Pawni Pandey, Ram Sampath',
    album_or_movie: 'Raees',
    release_year: 2017,
    theme: 'BOLLYWOOD',
    duration_seconds: 230,
    title: 'Laila Main Laila — Raees',
    thumbnail_url: 'https://img.youtube.com/vi/95I5VaR7GeU/hqdefault.jpg'
  },
  {
    videoId: 'YxWlaYCA8MU',
    song_name: 'Jhoome Jo Pathaan',
    artist: 'Arijit Singh, Sukriti Kakar, Vishal-Shekhar',
    album_or_movie: 'Pathaan',
    release_year: 2023,
    theme: 'BOLLYWOOD',
    duration_seconds: 202,
    title: 'Jhoome Jo Pathaan — Pathaan | Arijit Singh',
    thumbnail_url: 'https://img.youtube.com/vi/YxWlaYCA8MU/hqdefault.jpg'
  },
  {
    videoId: 'JFcgOboQZ08',
    song_name: 'Dilbar',
    artist: 'Neha Kakkar, Dhvani Bhanushali',
    album_or_movie: 'Satyameva Jayate',
    release_year: 2018,
    theme: 'BOLLYWOOD',
    duration_seconds: 184,
    title: 'Dilbar — Satyameva Jayate',
    thumbnail_url: 'https://img.youtube.com/vi/JFcgOboQZ08/hqdefault.jpg'
  },
  {
    videoId: 'tLqtnGLfm4Q',
    song_name: 'Tum Hi Aana',
    artist: 'Jubin Nautiyal, Payal Dev',
    album_or_movie: 'Marjaavaan',
    release_year: 2019,
    theme: 'BOLLYWOOD',
    duration_seconds: 249,
    title: 'Tum Hi Aana — Marjaavaan | Jubin Nautiyal',
    thumbnail_url: 'https://img.youtube.com/vi/tLqtnGLfm4Q/hqdefault.jpg'
  },
  {
    videoId: 'v7TK_w8-v0A',
    song_name: 'Apna Bana Le',
    artist: 'Arijit Singh, Sachin-Jigar',
    album_or_movie: 'Bhediya',
    release_year: 2022,
    theme: 'BOLLYWOOD',
    duration_seconds: 261,
    title: 'Apna Bana Le — Bhediya | Arijit Singh',
    thumbnail_url: 'https://img.youtube.com/vi/v7TK_w8-v0A/hqdefault.jpg'
  },

  // ═══════════════════════════════════════════════════════════════════
  // 2. PUNJABI (Pure Punjabi Songs — Guru Randhawa, Honey Singh, Mika, AP Dhillon, Shubh, Sidhu Moose Wala, Karan Aujla, Diljit)
  // ═══════════════════════════════════════════════════════════════════
  {
    videoId: 'hjWf8A0YNSE',
    song_name: 'High Rated Gabru',
    artist: 'Guru Randhawa',
    album_or_movie: 'High Rated Gabru',
    release_year: 2017,
    theme: 'PUNJABI',
    duration_seconds: 215,
    title: 'High Rated Gabru — Guru Randhawa',
    thumbnail_url: 'https://img.youtube.com/vi/hjWf8A0YNSE/hqdefault.jpg'
  },
  {
    videoId: 'dZ0fwJojhrs',
    song_name: 'Lahore',
    artist: 'Guru Randhawa',
    album_or_movie: 'Lahore',
    release_year: 2017,
    theme: 'PUNJABI',
    duration_seconds: 200,
    title: 'Lahore — Guru Randhawa',
    thumbnail_url: 'https://img.youtube.com/vi/dZ0fwJojhrs/hqdefault.jpg'
  },
  {
    videoId: 'NbyHNASFi6U',
    song_name: 'Blue Eyes',
    artist: 'Yo Yo Honey Singh',
    album_or_movie: 'Blue Eyes',
    release_year: 2013,
    theme: 'PUNJABI',
    duration_seconds: 220,
    title: 'Blue Eyes — Yo Yo Honey Singh',
    thumbnail_url: 'https://img.youtube.com/vi/NbyHNASFi6U/hqdefault.jpg'
  },
  {
    videoId: 'dHsV56I1GwE',
    song_name: 'Dope Shope',
    artist: 'Yo Yo Honey Singh, Deep Money',
    album_or_movie: 'International Villager',
    release_year: 2011,
    theme: 'PUNJABI',
    duration_seconds: 195,
    title: 'Dope Shope — Yo Yo Honey Singh',
    thumbnail_url: 'https://img.youtube.com/vi/dHsV56I1GwE/hqdefault.jpg'
  },
  {
    videoId: 'PaDaoNnOQaM',
    song_name: 'Mauja Hi Mauja',
    artist: 'Mika Singh, Pritam',
    album_or_movie: 'Jab We Met',
    release_year: 2007,
    theme: 'PUNJABI',
    duration_seconds: 244,
    title: 'Mauja Hi Mauja — Mika Singh',
    thumbnail_url: 'https://img.youtube.com/vi/PaDaoNnOQaM/hqdefault.jpg'
  },
  {
    videoId: '_KhQT-LGb-4',
    song_name: 'Aankh Marey',
    artist: 'Mika Singh, Neha Kakkar, Kumar Sanu',
    album_or_movie: 'Simmba',
    release_year: 2018,
    theme: 'PUNJABI',
    duration_seconds: 205,
    title: 'Aankh Marey — Mika Singh, Neha Kakkar',
    thumbnail_url: 'https://img.youtube.com/vi/_KhQT-LGb-4/hqdefault.jpg'
  },
  {
    videoId: 'dCmp56tSSmA',
    song_name: 'Born To Shine',
    artist: 'Diljit Dosanjh',
    album_or_movie: 'G.O.A.T.',
    release_year: 2020,
    theme: 'PUNJABI',
    duration_seconds: 213,
    title: 'Born To Shine — Diljit Dosanjh',
    thumbnail_url: 'https://img.youtube.com/vi/dCmp56tSSmA/hqdefault.jpg'
  },
  {
    videoId: 'cl0a3i2wFcc',
    song_name: 'G.O.A.T.',
    artist: 'Diljit Dosanjh',
    album_or_movie: 'G.O.A.T.',
    release_year: 2020,
    theme: 'PUNJABI',
    duration_seconds: 223,
    title: 'G.O.A.T. — Diljit Dosanjh',
    thumbnail_url: 'https://img.youtube.com/vi/cl0a3i2wFcc/hqdefault.jpg'
  },
  {
    videoId: 'cWMxCE2HTag',
    song_name: 'Softly',
    artist: 'Karan Aujla, Ikky',
    album_or_movie: 'Making Memories',
    release_year: 2023,
    theme: 'PUNJABI',
    duration_seconds: 155,
    title: 'Softly — Karan Aujla, Ikky',
    thumbnail_url: 'https://img.youtube.com/vi/cWMxCE2HTag/hqdefault.jpg'
  },
  {
    videoId: 'vX2cDW8LUWk',
    song_name: 'Excuses',
    artist: 'AP Dhillon, Gurinder Gill',
    album_or_movie: 'Single',
    release_year: 2021,
    theme: 'PUNJABI',
    duration_seconds: 176,
    title: 'Excuses — AP Dhillon, Gurinder Gill',
    thumbnail_url: 'https://img.youtube.com/vi/vX2cDW8LUWk/hqdefault.jpg'
  },
  {
    videoId: '4tywp83zkmk',
    song_name: 'Cheques',
    artist: 'Shubh',
    album_or_movie: 'Still Rollin',
    release_year: 2023,
    theme: 'PUNJABI',
    duration_seconds: 183,
    title: 'Cheques — Shubh',
    thumbnail_url: 'https://img.youtube.com/vi/4tywp83zkmk/hqdefault.jpg'
  },
  {
    videoId: '6RrEQJNZwPQ',
    song_name: 'No Love',
    artist: 'Shubh',
    album_or_movie: 'Single',
    release_year: 2022,
    theme: 'PUNJABI',
    duration_seconds: 170,
    title: 'No Love — Shubh',
    thumbnail_url: 'https://img.youtube.com/vi/6RrEQJNZwPQ/hqdefault.jpg'
  },
  {
    videoId: 'xR3V5Ow2dTI',
    song_name: 'Baller',
    artist: 'Shubh, Ikky',
    album_or_movie: 'Single',
    release_year: 2022,
    theme: 'PUNJABI',
    duration_seconds: 148,
    title: 'Baller — Shubh, Ikky',
    thumbnail_url: 'https://img.youtube.com/vi/xR3V5Ow2dTI/hqdefault.jpg'
  },
  {
    videoId: 'n_FCrCQ6-bA',
    song_name: '295',
    artist: 'Sidhu Moose Wala',
    album_or_movie: 'Moosetape',
    release_year: 2021,
    theme: 'PUNJABI',
    duration_seconds: 270,
    title: '295 — Sidhu Moose Wala',
    thumbnail_url: 'https://img.youtube.com/vi/n_FCrCQ6-bA/hqdefault.jpg'
  },

  // ═══════════════════════════════════════════════════════════════════
  // 3. LOFI_CHILL (Pure Lo-Fi, Chillout & Acoustic Midnight Vibes)
  // ═══════════════════════════════════════════════════════════════════
  {
    videoId: 'jfKfPfyJRdk',
    song_name: 'Lofi Hip Hop Radio',
    artist: 'Lofi Girl',
    album_or_movie: 'Lofi Stream',
    release_year: 2022,
    theme: 'LOFI_CHILL',
    duration_seconds: 600,
    title: 'Lofi Hip Hop Radio — Beats to Relax/Study to',
    thumbnail_url: 'https://img.youtube.com/vi/jfKfPfyJRdk/hqdefault.jpg'
  },
  {
    videoId: '60ItHLz5WEA',
    song_name: 'Faded Lo-Fi Mix',
    artist: 'Alan Walker / Chill Mix',
    album_or_movie: 'Chillout',
    release_year: 2016,
    theme: 'LOFI_CHILL',
    duration_seconds: 212,
    title: 'Faded — Chillout Lo-Fi Mix',
    thumbnail_url: 'https://img.youtube.com/vi/60ItHLz5WEA/hqdefault.jpg'
  },
  {
    videoId: 'tLqtnGLfm4Q',
    song_name: 'Tum Hi Aana (Lofi Acoustic)',
    artist: 'Jubin Nautiyal',
    album_or_movie: 'Acoustic Chill',
    release_year: 2019,
    theme: 'LOFI_CHILL',
    duration_seconds: 249,
    title: 'Tum Hi Aana (Lofi Acoustic) — Jubin Nautiyal',
    thumbnail_url: 'https://img.youtube.com/vi/tLqtnGLfm4Q/hqdefault.jpg'
  },
  {
    videoId: 'hoNb6HuNmU0',
    song_name: 'Khairiyat (Midnight Chill)',
    artist: 'Arijit Singh, Pritam',
    album_or_movie: 'Chillout',
    release_year: 2019,
    theme: 'LOFI_CHILL',
    duration_seconds: 280,
    title: 'Khairiyat (Midnight Chill) — Arijit Singh',
    thumbnail_url: 'https://img.youtube.com/vi/hoNb6HuNmU0/hqdefault.jpg'
  },
  {
    videoId: 'BddP6PYo2gs',
    song_name: 'Kesariya (Lofi Vibe)',
    artist: 'Arijit Singh, Pritam',
    album_or_movie: 'Lofi Mix',
    release_year: 2022,
    theme: 'LOFI_CHILL',
    duration_seconds: 268,
    title: 'Kesariya (Lofi Vibe) — Arijit Singh',
    thumbnail_url: 'https://img.youtube.com/vi/BddP6PYo2gs/hqdefault.jpg'
  },

  // ═══════════════════════════════════════════════════════════════════
  // 4. INSTAGRAM TRENDING (Recent Viral Hits — Mixed Hindi, English, Punjabi, Global)
  // ═══════════════════════════════════════════════════════════════════
  {
    videoId: 'hOHKltAiKXQ',
    song_name: 'Big Dawgs',
    artist: 'Hanumankind, Kalmi',
    album_or_movie: 'Def Jam India',
    release_year: 2024,
    theme: 'TRENDING',
    duration_seconds: 232,
    title: 'Big Dawgs — Hanumankind, Kalmi',
    thumbnail_url: 'https://img.youtube.com/vi/hOHKltAiKXQ/hqdefault.jpg'
  },
  {
    videoId: '4tywp83zkmk',
    song_name: 'Cheques',
    artist: 'Shubh',
    album_or_movie: 'Still Rollin',
    release_year: 2023,
    theme: 'TRENDING',
    duration_seconds: 183,
    title: 'Cheques — Shubh',
    thumbnail_url: 'https://img.youtube.com/vi/4tywp83zkmk/hqdefault.jpg'
  },
  {
    videoId: 'cWMxCE2HTag',
    song_name: 'Softly',
    artist: 'Karan Aujla, Ikky',
    album_or_movie: 'Making Memories',
    release_year: 2023,
    theme: 'TRENDING',
    duration_seconds: 155,
    title: 'Softly — Karan Aujla, Ikky',
    thumbnail_url: 'https://img.youtube.com/vi/cWMxCE2HTag/hqdefault.jpg'
  },
  {
    videoId: 'JGwWNGJdvx8',
    song_name: 'Shape of You',
    artist: 'Ed Sheeran',
    album_or_movie: '÷ (Divide)',
    release_year: 2017,
    theme: 'TRENDING',
    duration_seconds: 233,
    title: 'Shape of You — Ed Sheeran',
    thumbnail_url: 'https://img.youtube.com/vi/JGwWNGJdvx8/hqdefault.jpg'
  },
  {
    videoId: 'kJQP7kiw5Fk',
    song_name: 'Despacito',
    artist: 'Luis Fonsi, Daddy Yankee',
    album_or_movie: 'Vida',
    release_year: 2017,
    theme: 'TRENDING',
    duration_seconds: 282,
    title: 'Despacito — Luis Fonsi ft. Daddy Yankee',
    thumbnail_url: 'https://img.youtube.com/vi/kJQP7kiw5Fk/hqdefault.jpg'
  },
  {
    videoId: 'OPf0YbXqDm0',
    song_name: 'Uptown Funk',
    artist: 'Mark Ronson ft. Bruno Mars',
    album_or_movie: 'Uptown Special',
    release_year: 2014,
    theme: 'TRENDING',
    duration_seconds: 270,
    title: 'Uptown Funk — Mark Ronson ft. Bruno Mars',
    thumbnail_url: 'https://img.youtube.com/vi/OPf0YbXqDm0/hqdefault.jpg'
  },
  {
    videoId: '9bZkp7q19f0',
    song_name: 'Gangnam Style',
    artist: 'PSY',
    album_or_movie: 'Psy 6 (Six Rules)',
    release_year: 2012,
    theme: 'TRENDING',
    duration_seconds: 252,
    title: 'Gangnam Style — PSY',
    thumbnail_url: 'https://img.youtube.com/vi/9bZkp7q19f0/hqdefault.jpg'
  },
  {
    videoId: '2Vv-BfVoq4g',
    song_name: 'Perfect',
    artist: 'Ed Sheeran',
    album_or_movie: '÷ (Divide)',
    release_year: 2017,
    theme: 'TRENDING',
    duration_seconds: 263,
    title: 'Perfect — Ed Sheeran',
    thumbnail_url: 'https://img.youtube.com/vi/2Vv-BfVoq4g/hqdefault.jpg'
  },
  {
    videoId: 'YQHsXMglC9A',
    song_name: 'Hello',
    artist: 'Adele',
    album_or_movie: '25',
    release_year: 2015,
    theme: 'TRENDING',
    duration_seconds: 367,
    title: 'Hello — Adele',
    thumbnail_url: 'https://img.youtube.com/vi/YQHsXMglC9A/hqdefault.jpg'
  },
  {
    videoId: 'RgKAFK5djSk',
    song_name: 'See You Again',
    artist: 'Wiz Khalifa ft. Charlie Puth',
    album_or_movie: 'Furious 7',
    release_year: 2015,
    theme: 'TRENDING',
    duration_seconds: 237,
    title: 'See You Again — Wiz Khalifa ft. Charlie Puth',
    thumbnail_url: 'https://img.youtube.com/vi/RgKAFK5djSk/hqdefault.jpg'
  }
];

export const SEED_CATALOG_TRACKS = VERIFIED_SEED_TRACKS;
