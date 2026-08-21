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

export function getThumbnail(room: { current_thumbnail?: string; thumbnail_url?: string; current_video_id?: string }): string {
  return room.current_thumbnail || room.thumbnail_url || (room.current_video_id ? `https://img.youtube.com/vi/${room.current_video_id}/hqdefault.jpg` : '/logo-gold.png');
}

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
  const isSmallTouchScreen = window.innerWidth <= 768 && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  return isMobileUA || isSmallTouchScreen;
}
