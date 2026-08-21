// Strict Theme Validator for YouTube Metadata
// Curated 3 Core Live Themes: BOLLYWOOD, PUNJABI, TRENDING

export interface YouTubeVideoMetadata {
  videoId: string;
  title: string;
  channelTitle: string;
  description: string;
  tags?: string[];
  categoryId?: string;
  durationSeconds?: number;
  embeddable?: boolean;
  uploadStatus?: string;
  privacyStatus?: string;
}

// ──────────────────────────────────────────────────────────────
// Helper: Parse ISO 8601 Duration (e.g. PT4M28S, PT1H2M10S, PT58S) into Seconds
// ──────────────────────────────────────────────────────────────
export function parseISO8601Duration(durationStr: string): number {
  if (!durationStr) return 0;
  const match = durationStr.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
  if (!match) return 0;
  const days = parseInt(match[1] || '0', 10);
  const hours = parseInt(match[2] || '0', 10);
  const minutes = parseInt(match[3] || '0', 10);
  const seconds = parseInt(match[4] || '0', 10);
  return days * 86400 + hours * 3600 + minutes * 60 + seconds;
}

export async function isYouTubeEmbeddable(videoId: string): Promise<boolean> {
  if (!videoId || videoId.length < 5) return false;
  try {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!res.ok) return false;
    const data = (await res.json()) as any;
    return !!(data && data.title);
  } catch (e) {
    return false;
  }
}

// ──────────────────────────────────────────────────────────────
// Validate a video is actually playable as an embed and get real duration
// ──────────────────────────────────────────────────────────────
export async function validateVideoPlayable(
  videoId: string,
  apiKey: string = ''
): Promise<{ playable: boolean; meta: YouTubeVideoMetadata | null }> {
  if (!videoId || videoId.length < 5) {
    return { playable: false, meta: null };
  }

  // 1. Primary with API Key: YouTube Data API v3 (fetches accurate duration, embeddability & metadata)
  if (apiKey) {
    try {
      const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,status&id=${videoId}&key=${apiKey}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = (await res.json()) as any;
        if (data.items && data.items.length > 0) {
          const item = data.items[0];
          const snippet = item.snippet;
          const status = item.status;
          const contentDetails = item.contentDetails;

          if (status?.embeddable !== false && status?.privacyStatus !== 'private') {
            const durationSec = contentDetails?.duration ? parseISO8601Duration(contentDetails.duration) : 0;
            return {
              playable: true,
              meta: {
                videoId,
                title: snippet.title || '',
                channelTitle: snippet.channelTitle || '',
                description: snippet.description || '',
                tags: snippet.tags || [],
                categoryId: snippet.categoryId || '',
                durationSeconds: durationSec > 0 ? durationSec : undefined,
                embeddable: true,
              },
            };
          }
        }
      }
    } catch (e) {
      console.warn('validateVideoPlayable API error:', e);
    }
  }

  // 2. Secondary fallback: oEmbed check (works globally without consuming YouTube API quota)
  try {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (res.ok) {
      const data = (await res.json()) as any;
      if (data && data.title) {
        return {
          playable: true,
          meta: {
            videoId,
            title: data.title || '',
            channelTitle: data.author_name || 'Official',
            description: '',
            embeddable: true,
          },
        };
      }
    }
  } catch (e) {
    console.warn('oEmbed validation error:', e);
  }

  return { playable: false, meta: null };
}

// ──────────────────────────────────────────────────────────────
// Search YouTube for candidate videos matching a query
// ──────────────────────────────────────────────────────────────
export async function searchYouTubeCandidates(
  query: string,
  apiKey: string,
  maxResults: number = 10
): Promise<Array<{ videoId: string; title: string; channelTitle: string }>> {
  if (!apiKey) return [];

  try {
    const params = new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'video',
      videoCategoryId: '10', // Music category
      videoEmbeddable: 'true',
      maxResults: String(Math.min(maxResults, 15)),
      key: apiKey,
    });

    const res = await fetch(`https://www.googleapis.com/youtube/v3/search?${params.toString()}`);
    if (!res.ok) {
      console.warn('YouTube Search API error:', res.status);
      return [];
    }

    const data = (await res.json()) as any;
    if (!data.items) return [];

    return data.items
      .filter((item: any) => item.id?.videoId)
      .map((item: any) => ({
        videoId: item.id.videoId,
        title: item.snippet?.title || '',
        channelTitle: item.snippet?.channelTitle || '',
      }));
  } catch (e) {
    console.warn('searchYouTubeCandidates error:', e);
    return [];
  }
}

const THEME_KEYWORDS: Record<string, string[]> = {
  BOLLYWOOD: [
    'bollywood', 'hindi', 'aashiqui', 'arijit', 't-series', 'tseries', 'zee music', 
    'sony music india', 'yrf', 'movie', 'ost', 'singh', 'shreya', 'jubin', 
    'badshah', 'neha', 'pritam', 'sanam', 'kabir singh', 'brahmastra', 'dhadak', 'kalank',
    'tum hi ho', 'kesariya', 'raataan', 'apna bana le', 'chaleya', 'tere vaaste', 'jawan', 'animal', 'dunki'
  ],
  PUNJABI: [
    'punjabi', 'sidhu moose wala', 'moosewala', 'ap dhillon', 'diljit', 'dosanjh',
    'karan aujla', 'shubh', 'honey singh', 'bhangra', 'speed records', 'white hill', 'jatt',
    '295', 'excuses', 'softly', 'lover', 'brown munde', 'cheques', 'baller', 'tauba tauba'
  ],
  TRENDING: [
    'trending', 'viral', 'instagram', 'reels', 'tiktok', 'billboard', 'pop', 'hip hop',
    'hanumankind', 'big dawgs', 'taambdi chaamdi', 'millionaire', 'sajni', 'illuminati',
    'soulmate', 'ishq', 'husn', 'gata only', 'espresso', 'sabrina carpenter', 'billie eilish',
    'the weeknd', 'travis scott', 'tate mcrae', 'tyla', 'doja cat', 'dua lipa', 'taylor swift'
  ]
};

export async function fetchYouTubeMetadata(videoId: string, apiKey: string = ''): Promise<YouTubeVideoMetadata | null> {
  const check = await validateVideoPlayable(videoId, apiKey);
  if (check.meta) return check.meta;

  return {
    videoId,
    title: 'Track ' + videoId,
    channelTitle: 'YouTube Music',
    description: 'Music Track'
  };
}

export function validateVideoTheme(theme: string, meta: YouTubeVideoMetadata): { valid: boolean; reason?: string } {
  const normalizedTheme = theme.toUpperCase();
  const keywords = THEME_KEYWORDS[normalizedTheme];
  if (!keywords) {
    return { valid: true };
  }

  const searchText = `${meta.title} ${meta.channelTitle} ${meta.description} ${(meta.tags || []).join(' ')}`.toLowerCase();
  const isMatch = keywords.some((kw) => searchText.includes(kw.toLowerCase()));

  if (!isMatch) {
    return {
      valid: false,
      reason: `Song Rejected: This song does not match the theme of this room (${theme}).`
    };
  }

  return { valid: true };
}
