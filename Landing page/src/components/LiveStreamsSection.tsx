import { LiveRoom } from '../types'
import { getThumbnail } from '../utils/helpers'
import { useScrollRevealOnUpdate } from '../hooks/useScrollMotion'
import { Play, Users, Radio, RotateCw, Sparkles } from 'lucide-react'

interface Props {
  rooms: LiveRoom[]
  onJoinStream: (roomId: string) => void
  onRefresh: () => void
}

export default function LiveStreamsSection({ rooms, onJoinStream, onRefresh }: Props) {
  useScrollRevealOnUpdate([rooms])

  return (
    <section id="live-streams" className="section-wrap">
      <div className="container">
        {/* Section Header */}
        <div className="section-header reveal-item">
          <span className="section-label">🔴 Live Jamming Now</span>
          <h2 className="display section-title">Currently Live Rooms</h2>
          <p className="section-sub">
            Synchronized live music rooms — listen directly in real-time zero-lag harmony with live chat &amp; emoji reactions!
          </p>
        </div>

        {/* Live Status Bar */}
        <div className="live-status-bar reveal-item">
          <div className="live-status-indicator">
            <div className="live-status-pulse" />
            <span>{rooms.length} Active {rooms.length === 1 ? 'Stream' : 'Streams'} Live</span>
          </div>
          <div className="live-status-actions">
            <span className="live-status-info">Auto-updating every 10s</span>
            <button className="btn btn-ghost btn-sm" onClick={onRefresh} title="Refresh Streams">
              <RotateCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Streams Grid */}
        <div className="streams-grid" id="streams-grid-container">
          {rooms.length === 0 ? (
            <div className="streams-empty-box" style={{ gridColumn: '1/-1' }}>
              <div className="streams-empty-icon">
                <Radio className="w-10 h-10" style={{ margin: '0 auto 12px', color: 'var(--prisma-cream)', opacity: 0.4 }} />
              </div>
              <h4 className="streams-empty-title">Abhi koi live stream nahi chal rahi.</h4>
              <p className="streams-empty-text">Thodi der mein dobara check karein ya refresh button tap karein.</p>
              <button className="btn btn-gold btn-sm" onClick={onRefresh}>
                <RotateCw className="w-3.5 h-3.5" />
                <span>Refresh Streams</span>
              </button>
            </div>
          ) : (
            rooms.map(room => {
              const thumb = getThumbnail(room)
              const title = room.current_title || room.name
              const artist = room.current_artist ? `${room.current_artist} • Live` : 'Live Stream'
              const viewers = room.active_viewers || 1
              const theme = room.theme || 'MUSIC'

              return (
                <div className="stream-card reveal-item" key={room.id}>
                  {/* Thumbnail Wrap */}
                  <div className="stream-card-thumb-wrap">
                    <img
                      src={thumb}
                      alt={room.name}
                      className="stream-card-thumb"
                      onError={e => (e.target as HTMLImageElement).src = '/logo-gold.png'}
                    />
                    
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

                    {/* Viewers Pill */}
                    <div className="stream-viewers-badge">
                      <Users className="w-3 h-3" />
                      <span>{viewers} Listening</span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="stream-card-body">
                    <div className="stream-card-meta">
                      <span className="stream-theme-tag">{theme}</span>
                    </div>
                    <h3 className="stream-room-name">{room.name}</h3>
                    <p className="stream-track-title">
                      🎵 <strong>{title}</strong><br />
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>{artist}</span>
                    </p>

                    {/* Join CTA Button */}
                    <button className="btn-prisma-primary stream-card-btn" onClick={() => onJoinStream(room.id)}>
                      <span>Join Live Room</span>
                      <span className="btn-prisma-icon-wrap">
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </span>
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </section>
  )
}
