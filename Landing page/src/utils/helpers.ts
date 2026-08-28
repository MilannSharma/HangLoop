export function escapeHtml(str: string): string {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, (m) => {
    const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return map[m] || m;
  });
}

export function getAvatarUrl(name: string): string {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
}

export function getThumbnail(room: {
  current_thumbnail?: string;
  thumbnail_url?: string;
  current_video_id?: string;
  theme?: string;
  id?: string;
  name?: string;
}): string {
  // 1. If high quality HTTP URL is provided, use it
  if (room.current_thumbnail && room.current_thumbnail.startsWith('http')) {
    return room.current_thumbnail;
  }
  if (room.thumbnail_url && room.thumbnail_url.startsWith('http')) {
    return room.thumbnail_url;
  }

  // 2. If valid YouTube video ID exists, use YouTube HD thumbnail
  if (room.current_video_id && room.current_video_id.length === 11) {
    return `https://img.youtube.com/vi/${room.current_video_id}/hqdefault.jpg`;
  }

  // 3. High-quality curated theme visuals
  const theme = (room.theme || room.id || room.name || '').toUpperCase();
  if (theme.includes('BOLLYWOOD') || theme.includes('HINDI')) {
    return 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80';
  }
  if (theme.includes('PUNJABI')) {
    return 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80';
  }
  if (theme.includes('LOFI') || theme.includes('CHILL')) {
    return 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&auto=format&fit=crop&q=80';
  }
  if (theme.includes('TRENDING') || theme.includes('INSTAGRAM')) {
    return 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80';
  }

  return 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80';
}

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
  const isSmallTouchScreen = window.innerWidth <= 768 && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  return isMobileUA || isSmallTouchScreen;
}
