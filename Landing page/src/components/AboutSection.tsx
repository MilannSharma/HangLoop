import { useScrollReveal } from '../hooks/useScrollMotion'
import { Radio, Bot, Disc3, Users, Sparkles, Heart, Shield, ArrowRight, Music2 } from 'lucide-react'

interface Props {
  onOpenDownload: () => void
}

export default function AboutSection({ onOpenDownload }: Props) {
  useScrollReveal()

  return (
    <section id="about" className="section-wrap" style={{ position: 'relative' }}>
      <div className="container">
        
        {/* Section Header */}
        <div className="section-header reveal-item">
          <span className="section-label">🌟 The Hangloop Story</span>
          <h2 className="display section-title">About Hangloop</h2>
          <p className="section-sub">
            Music is inherently social. Hangloop was engineered to bring people together through real-time synchronized music rooms, interactive AI companions, and zero-distraction playback.
          </p>
        </div>

        {/* Big Vision Banner */}
        <div className="about-hero-box reveal-item">
          <div className="about-hero-grid">
            <div className="about-hero-text">
              <span className="about-badge">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Synchronized Worldwide</span>
              </span>
              <h3 className="about-hero-title">
                "Listening to music alone is great. Listening together is unforgettable."
              </h3>
              <p className="about-hero-desc">
                Hangloop eliminates the physical distance between friends, creators, and music lovers. With our sub-second global synchronization engine running on Cloudflare Edge, every person in a room hears the exact same beat, guitar solo, and drop at the precise millisecond — whether you're across the street or across the world.
              </p>
              <div className="about-hero-stats">
                <div className="about-stat-item">
                  <span className="about-stat-val">&lt; 50ms</span>
                  <span className="about-stat-lbl">Global Sync Drift</span>
                </div>
                <div className="about-stat-item">
                  <span className="about-stat-val">24/7</span>
                  <span className="about-stat-lbl">Curated Live Stations</span>
                </div>
                <div className="about-stat-item">
                  <span className="about-stat-val">100%</span>
                  <span className="about-stat-lbl">Free Community App</span>
                </div>
              </div>
            </div>

            <div className="about-hero-visual">
              <div className="about-visual-card">
                <div className="about-visual-glow" />
                <div className="about-visual-header">
                  <div className="about-visual-tag">
                    <Radio className="w-3.5 h-3.5" />
                    <span>Live Edge Network</span>
                  </div>
                  <span className="about-visual-status">Operational</span>
                </div>
                
                <div className="about-visual-body">
                  <div className="about-visual-station-row">
                    <span className="station-indicator dot-red" />
                    <span className="station-title">Bollywood Hindi 24/7 Live</span>
                    <span className="station-badge">Live</span>
                  </div>
                  <div className="about-visual-station-row">
                    <span className="station-indicator dot-gold" />
                    <span className="station-title">Punjabi Superhits Station</span>
                    <span className="station-badge">Live</span>
                  </div>
                  <div className="about-visual-station-row">
                    <span className="station-indicator dot-blue" />
                    <span className="station-title">Lo-Fi Chill &amp; Study Beats</span>
                    <span className="station-badge">Live</span>
                  </div>
                  <div className="about-visual-station-row">
                    <span className="station-indicator dot-green" />
                    <span className="station-title">Instagram Viral &amp; Trending</span>
                    <span className="station-badge">Live</span>
                  </div>
                </div>

                <div className="about-visual-footer">
                  <div className="ai-host-pill">
                    <Bot className="w-3.5 h-3.5 text-[#E1E0CC]" />
                    <span>Hosted by Kira &amp; Leo AI</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Pillars Grid */}
        <div className="about-pillars-grid">
          
          {/* Pillar 1 */}
          <div className="about-pillar-card reveal-item">
            <div className="pillar-icon-wrap">
              <Radio className="w-6 h-6 text-[#E1E0CC]" />
            </div>
            <h4 className="pillar-title">Sub-Second Clock Synchronization</h4>
            <p className="pillar-desc">
              Powered by Cloudflare Workers &amp; Durable Objects, Hangloop orchestrates room playback with authoritative atomic clock tracking to guarantee continuous zero-lag synchronization.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="about-pillar-card reveal-item">
            <div className="pillar-icon-wrap">
              <Bot className="w-6 h-6 text-[#E1E0CC]" />
            </div>
            <h4 className="pillar-title">Meet Kira &amp; Leo — Your AI Roomies</h4>
            <p className="pillar-desc">
              Every room features intelligent, banter-loving AI hosts (Kira &amp; Leo) powered by Google Gemini. They share music trivia, roast track picks, and keep room vibes alive 24/7.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="about-pillar-card reveal-item">
            <div className="pillar-icon-wrap">
              <Disc3 className="w-6 h-6 text-[#E1E0CC]" />
            </div>
            <h4 className="pillar-title">Continuous Background Playback</h4>
            <p className="pillar-desc">
              Designed specifically for everyday listening. The Hangloop Android App plays seamlessly in the background with full lock-screen media controls and ultra-low battery drain.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="about-pillar-card reveal-item">
            <div className="pillar-icon-wrap">
              <Users className="w-6 h-6 text-[#E1E0CC]" />
            </div>
            <h4 className="pillar-title">Community-Driven Curation</h4>
            <p className="pillar-desc">
              Listeners can request new YouTube live streams, suggest missing songs, and upvote roadmap features directly through the open request board.
            </p>
          </div>

        </div>

        {/* Creator Note & CTA Banner */}
        <div className="about-cta-card reveal-item">
          <div className="about-cta-content">
            <span className="section-label">❤️ Built with Passion</span>
            <h3 className="about-cta-title">Ready to Experience the Hangloop Vibe?</h3>
            <p className="about-cta-desc">
              Join thousands of listeners enjoying synchronized live stations, real-time chat, and AI banter on the official Hangloop Android App.
            </p>
            <div className="about-cta-actions">
              <button className="btn btn-gold" onClick={onOpenDownload}>
                <span>Download Hangloop Official APK</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
