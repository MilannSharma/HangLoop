import { motion } from 'framer-motion'
import { LiveRoom } from '../types'
import { getThumbnail } from '../utils/helpers'
import { Smartphone, Radio, RotateCw, Sparkles, Download, Music2, Volume2 } from 'lucide-react'

interface Props {
  rooms: LiveRoom[]
  onOpenDownload: () => void
  onRefresh: () => void
}

export default function LiveStreamsSection({ rooms, onOpenDownload, onRefresh }: Props) {
  return (
    <section id="live-streams" className="section-wrap" style={{ position: 'relative' }}>
      <div className="container">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="section-header"
        >
          <span className="section-label">🔴 24/7 Synchronized Audio</span>
          <h2 className="display section-title">Live Music Stations</h2>
          <p className="section-sub">
            Continuous real-time synchronized music stations streaming 24/7 with zero-lag Cloudflare Edge technology.
          </p>
        </motion.div>

        {/* Live Status Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="live-status-bar"
        >
          <div className="live-status-indicator">
            <div className="live-status-pulse" />
            <span>{rooms.length || 4} 24/7 Stations Online</span>
          </div>
          <div className="live-status-actions">
            <span className="live-status-info">Auto-syncing every 10s</span>
            <button className="btn btn-ghost btn-sm" onClick={onRefresh} title="Refresh Stations">
              <RotateCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>
        </motion.div>

        {/* Exclusive App Notice Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          style={{
            background: 'linear-gradient(135deg, rgba(225, 224, 204, 0.08) 0%, rgba(12, 13, 18, 0.95) 100%)',
            border: '1px solid var(--border-gold)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 24px',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(225, 224, 204, 0.12)',
              border: '1px solid var(--border-gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Sparkles className="w-4 h-4 text-[#E1E0CC]" />
            </div>
            <div>
              <div style={{ fontSize: '0.92rem', color: 'var(--prisma-cream)', fontWeight: 700 }}>
                Live Stream Audio &amp; AI Chat Available in Hangloop App
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: 2 }}>
                Enjoy continuous background playback, zero ads, lock-screen controls, and banter with Kira &amp; Leo AI.
              </div>
            </div>
          </div>
          <button className="btn btn-gold btn-sm" onClick={onOpenDownload}>
            <Download className="w-3.5 h-3.5" />
            <span>Get Official APK</span>
          </button>
        </motion.div>

        {/* Streams Grid */}
        <div className="streams-grid" id="streams-grid-container">
          {rooms.map((room, idx) => {
            const thumb = getThumbnail(room)
            const title = room.current_title || room.name
            const artist = room.current_artist ? `${room.current_artist}` : '24/7 Synchronized Live'
            const theme = room.theme || 'MUSIC'

            return (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -8, transition: { duration: 0.25 } }}
                className="stream-card"
              >
                {/* High-Resolution Thumbnail Wrap */}
                <div className="stream-card-thumb-wrap">
                  <img
                    src={thumb}
                    alt={room.name}
                    className="stream-card-thumb"
                    loading="lazy"
                    onError={(e) => {
                      // Guaranteed reliable theme-based fallback
                      const target = e.target as HTMLImageElement;
                      if (theme.includes('BOLLYWOOD') || theme.includes('HINDI')) {
                        target.src = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80';
                      } else if (theme.includes('PUNJABI')) {
                        target.src = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80';
                      } else if (theme.includes('LOFI') || theme.includes('CHILL')) {
                        target.src = 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&auto=format&fit=crop&q=80';
                      } else {
                        target.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80';
                      }
                    }}
                  />

                  {/* Dark Gradient Overlay for Contrast */}
                  <div className="stream-thumb-gradient-overlay" />

                  {/* Live Badge */}
                  <div className="stream-card-overlay-badge">
                    <span className="live-tag">
                      <span className="live-tag-dot" /> LIVE
                    </span>
                  </div>

                  {/* Animated Soundwave Visualizer in Card */}
                  <div className="card-soundwave-bars">
                    <span className="sw-bar bar-1" />
                    <span className="sw-bar bar-2" />
                    <span className="sw-bar bar-3" />
                    <span className="sw-bar bar-4" />
                  </div>

                  {/* Audio Mode Badge */}
                  <div className="stream-mode-badge">
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>Sync Stream</span>
                  </div>
                </div>

                {/* Body */}
                <div className="stream-card-body">
                  <div className="stream-card-meta">
                    <span className="stream-theme-tag">{theme}</span>
                    <span className="stream-category-lbl">{room.category || 'Music Station'}</span>
                  </div>
                  
                  <h3 className="stream-room-name">{room.name}</h3>
                  
                  <div className="stream-track-info-box">
                    <Music2 className="w-4 h-4 text-[#E1E0CC] flex-shrink-0" />
                    <div style={{ overflow: 'hidden' }}>
                      <div className="stream-track-title-text" title={title}>{title}</div>
                      <div className="stream-track-artist-text">{artist}</div>
                    </div>
                  </div>

                  {/* Open in App CTA Button */}
                  <button className="btn-prisma-primary stream-card-btn" onClick={onOpenDownload}>
                    <span>Listen in App</span>
                    <span className="btn-prisma-icon-wrap">
                      <Smartphone className="w-3.5 h-3.5" />
                    </span>
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
