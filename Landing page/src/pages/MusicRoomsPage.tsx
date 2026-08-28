import { Link } from 'react-router-dom'
import SEOHead from '../components/SEOHead'
import Breadcrumbs from '../components/Breadcrumbs'
import AEOAnswerBox from '../components/AEOAnswerBox'
import Footer from '../components/Footer'
import { Radio, Users, Bot, Sparkles, Disc3, ArrowRight, Download, Volume2, Music2 } from 'lucide-react'

interface Props {
  onOpenDownload: () => void
}

export default function MusicRoomsPage({ onOpenDownload }: Props) {
  const stations = [
    {
      id: 'bollywood',
      name: 'Bollywood Hindi Music Live',
      theme: 'BOLLYWOOD',
      desc: '24/7 non-stop Bollywood blockbuster anthems, romantic melodies, and trending chart hits.',
      tag: '🔥 Most Popular',
      listeners: '500 Max / Room'
    },
    {
      id: 'punjabi',
      name: 'Punjabi Hits Live Jam',
      theme: 'PUNJABI',
      desc: 'High-energy Punjabi beats, bhangra grooves, and viral tracks from top artists.',
      tag: '⚡ High Energy',
      listeners: '500 Max / Room'
    },
    {
      id: 'lofi',
      name: 'Lo-Fi Chill & Study Beats',
      theme: 'LOFI_CHILL',
      desc: 'Mellow, relaxing, ambient lo-fi beats curated for studying, coding, relaxation, and deep focus.',
      tag: '☕ Focus & Relax',
      listeners: '500 Max / Room'
    },
    {
      id: 'trending',
      name: 'Instagram Trending & Viral Reels',
      theme: 'VIRAL',
      desc: 'The hottest trending tracks blowing up across Instagram Reels, TikTok, and Spotify charts worldwide.',
      tag: '🚀 Viral Hits',
      listeners: '500 Max / Room'
    }
  ]

  const faqList = [
    {
      q: 'What is a synchronized music room on Hangloop?',
      a: 'A Hangloop music room is a virtual online listening space where multiple listeners connect to a single synchronized audio timeline. Playback is locked across all participants down to the millisecond, accompanied by live chat, floating reaction emojis, and AI hosts.'
    },
    {
      q: 'How many listeners can join a single Hangloop music room?',
      a: 'Hangloop edge architecture supports up to 500 concurrent listeners per room with zero latency degradation.'
    },
    {
      q: 'Can I request new songs or YouTube live streams for the music rooms?',
      a: 'Yes! Hangloop features an open community request board where listeners can submit YouTube Live stream links or propose new feature additions.'
    }
  ]

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': faqList.map(item => ({
      '@type': 'Question',
      'name': item.q,
      'acceptedAnswer': {
        '@type': 'Answer',
        'text': item.a
      }
    }))
  }

  return (
    <>
      <SEOHead
        title="Synchronized Music Rooms & 24/7 Live Music Stations | Hangloop"
        description="Join 24/7 synchronized online music rooms streaming Bollywood, Punjabi, Lo-Fi, and trending hits. Listen with friends in real time with sub-50ms sync, live chat, and AI hosts."
        canonicalUrl="https://hang-loop.vercel.app/music-rooms"
        keywords="hangloop live music app, live music room app, music rooms, online music room with friends, virtual music room app, synchronized music rooms, shared live music room, 24/7 music station app, bollywood music room, punjabi music room, lofi study room with friends"
        jsonLd={faqSchema}
      />

      <main className="subpage-wrapper">
        <div className="container">
          <Breadcrumbs items={[{ name: 'Music Rooms', path: '/music-rooms' }]} />

          {/* Hero Header */}
          <header className="subpage-hero">
            <span className="section-label">🔴 24/7 Live Synchronized Stations</span>
            <h1 className="display subpage-title">
              Synchronized Music Rooms &amp; 24/7 Live Stations
            </h1>
            <p className="subpage-lead">
              Discover curated online music rooms streaming 24 hours a day, 7 days a week. Hangloop music rooms synchronize audio playback across hundreds of simultaneous listeners with zero drift.
            </p>
          </header>

          {/* AEO Direct Answer */}
          <AEOAnswerBox
            question="What are Hangloop Music Rooms?"
            directAnswer="Hangloop Music Rooms are real-time collaborative audio spaces powered by Cloudflare Durable Objects and WebSocket edge architecture. Each room maintains an authoritative playback timeline so that every user in the room experiences identical music playback simultaneously, paired with synchronized live chat, emoji reaction showers, and AI co-hosts."
            takeaways={[
              '24/7 curated stations for Bollywood, Punjabi, Lo-Fi Chill, and Viral Reels',
              'Sub-second clock synchronization (<50ms drift globally)',
              'Interactive AI roomies Kira & Leo sharing music trivia and lively banter',
              'Community-driven stream curation and user-requested YouTube live channels',
              'Free background playback on Android and iOS web app'
            ]}
          />

          {/* Stations Breakdown */}
          <section className="pillar-section">
            <div className="section-header">
              <span className="section-label">📻 Official Stations</span>
              <h2 className="display section-title">Featured 24/7 Live Music Rooms</h2>
              <p className="section-sub">Choose your vibe and jump straight into live synchronization.</p>
            </div>

            <div className="features-grid">
              {stations.map(st => (
                <div className="feat-card" key={st.id}>
                  <div className="stream-card-meta" style={{ marginBottom: 12 }}>
                    <span className="stream-theme-tag">{st.theme}</span>
                    <span className="stream-category-lbl">{st.tag}</span>
                  </div>
                  <h3 className="feat-title">{st.name}</h3>
                  <p className="feat-desc">{st.desc}</p>
                  <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--surface-border)', paddingTop: 12 }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}><Users className="w-3.5 h-3.5 inline mr-1" />{st.listeners}</span>
                    <Link to="/#live-streams" className="btn btn-gold btn-sm">
                      <span>Tune In</span>
                      <Radio className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Room Architecture & Capabilities */}
          <section className="pillar-section">
            <div className="section-header">
              <span className="section-label">⚙️ Room Capabilities</span>
              <h2 className="display section-title">What Makes Hangloop Music Rooms Unique</h2>
            </div>

            <div className="features-grid">
              <div className="feat-card">
                <div className="feat-icon"><Radio className="w-5 h-5 text-[#E1E0CC]" /></div>
                <h3 className="feat-title">Atomic Edge Synchronization</h3>
                <p className="feat-desc">Each room connects to an isolated Cloudflare Durable Object worker that calculates playback offsets against authoritative time servers, eliminating audio skew.</p>
              </div>

              <div className="feat-card">
                <div className="feat-icon"><Bot className="w-5 h-5 text-[#E1E0CC]" /></div>
                <h3 className="feat-title">AI Roomies: Kira &amp; Leo</h3>
                <p className="feat-desc">Powered by Google Gemini, Kira &amp; Leo chat with listeners, share artist trivia, react to song changes, and bring energy to every listening session.</p>
              </div>

              <div className="feat-card">
                <div className="feat-icon"><Volume2 className="w-5 h-5 text-[#E1E0CC]" /></div>
                <h3 className="feat-title">Lock-Screen Background Audio</h3>
                <p className="feat-desc">Listen without keeping your screen turned on. The Hangloop mobile app supports full background streaming and lock-screen notification controls.</p>
              </div>

              <div className="feat-card">
                <div className="feat-icon"><Sparkles className="w-5 h-5 text-[#E1E0CC]" /></div>
                <h3 className="feat-title">Full-Screen Reaction Showers</h3>
                <p className="feat-desc">Trigger animated emoji showers when the beat drops. Every connected listener sees the reaction burst float up across their screen in real time.</p>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="pillar-section">
            <div className="section-header">
              <span className="section-label">❓ Room Questions</span>
              <h2 className="display section-title">Frequently Asked Questions</h2>
            </div>

            <div className="faq-accordion-list">
              {faqList.map((item, idx) => (
                <div className="faq-item" key={idx}>
                  <h3 className="faq-question">{item.q}</h3>
                  <p className="faq-answer">{item.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Related Links */}
          <section className="related-links-bar">
            <span className="related-links-label">Explore More:</span>
            <div className="related-links-list">
              <Link to="/listen-to-music-with-friends" className="related-link-pill">Listen Together Online &rarr;</Link>
              <Link to="/synchronized-music" className="related-link-pill">Audio Sync Technology &rarr;</Link>
              <Link to="/requests" className="related-link-pill">Request a Live Stream &rarr;</Link>
              <Link to="/faq" className="related-link-pill">Full Hangloop FAQ &rarr;</Link>
            </div>
          </section>

          {/* Bottom CTA */}
          <div className="about-cta-card">
            <div className="about-cta-content">
              <span className="section-label">🎧 Join a Room</span>
              <h3 className="about-cta-title">Experience 24/7 Live Synchronized Music Today</h3>
              <p className="about-cta-desc">Choose your favorite station or request custom streams with our global community.</p>
              <div className="about-cta-actions">
                <Link to="/#live-streams" className="btn btn-gold">
                  <span>Enter Live Rooms</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button className="btn btn-ghost" onClick={onOpenDownload}>
                  <Download className="w-4 h-4" />
                  <span>Download App</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer onOpenDownload={onOpenDownload} />
    </>
  )
}
