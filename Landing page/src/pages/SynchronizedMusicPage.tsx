import { Link } from 'react-router-dom'
import SEOHead from '../components/SEOHead'
import Breadcrumbs from '../components/Breadcrumbs'
import AEOAnswerBox from '../components/AEOAnswerBox'
import Footer from '../components/Footer'
import { Zap, Clock, ShieldCheck, Cpu, ArrowRight, Download, Radio, Network } from 'lucide-react'

interface Props {
  onOpenDownload: () => void
}

export default function SynchronizedMusicPage({ onOpenDownload }: Props) {
  const faqList = [
    {
      q: 'What is synchronized music listening?',
      a: 'Synchronized music listening is a technology where multiple listeners across different locations and devices experience identical audio playback at the exact same point on the timeline with zero perceptible lag (sub-50 milliseconds drift).'
    },
    {
      q: 'Why do Discord, Zoom, and normal music apps drift out of sync?',
      a: 'Standard apps rely on individual device clocks, variable network buffers, and audio transcoding lag. When users press play on different devices, network jitter causes streams to diverge by several seconds within minutes.'
    },
    {
      q: 'How does Hangloop achieve sub-50ms synchronization?',
      a: 'Hangloop uses Cloudflare Edge Durable Objects running at 300+ global edge locations. Each room maintains an authoritative atomic server clock and sends periodic synchronization beacons over persistent WebSockets, enabling clients to continuously calibrate playback timing.'
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
        title="Synchronized Music Listening: Sub-50ms Real-Time Audio | Hangloop"
        description="Learn how Hangloop delivers sub-50ms real-time audio synchronization across devices worldwide using Cloudflare Edge Durable Objects, atomic clock tracking, and zero-lag WebSockets."
        canonicalUrl="https://hang-loop.vercel.app/synchronized-music"
        keywords="synchronized music, synchronized music listening, synced music, real time music synchronization, audio synchronization, zero lag music sync"
        jsonLd={faqSchema}
      />

      <main className="subpage-wrapper">
        <div className="container">
          <Breadcrumbs items={[{ name: 'Synchronized Music', path: '/synchronized-music' }]} />

          {/* Hero Header */}
          <header className="subpage-hero">
            <span className="section-label">⚡ Real-Time Audio Engine</span>
            <h1 className="display subpage-title">
              Synchronized Music Listening: Sub-50ms Real-Time Audio
            </h1>
            <p className="subpage-lead">
              Discover the engineering behind zero-lag collaborative music streaming. Hangloop eliminates audio latency and drift, ensuring every listener in a room hears every beat in absolute unison.
            </p>
          </header>

          {/* AEO Direct Answer */}
          <AEOAnswerBox
            question="How does synchronized music listening work on Hangloop?"
            directAnswer="Synchronized music listening on Hangloop coordinates audio playback across multiple distributed devices using an authoritative atomic server clock. Cloudflare Edge Durable Objects calculate real-time playback offsets and broadcast lightweight synchronization packets over low-latency WebSockets. Client players continuously adjust buffer positions to maintain sub-50ms synchronization globally."
            takeaways={[
              'Authoritative atomic clock timekeeping eliminates local device clock skew',
              'Cloudflare Edge network with 300+ points of presence delivers ultra-low round-trip latency',
              'Adaptive drift correction smoothly adjusts playback without audio distortion or skipping',
              'Native support for both YouTube Live broadcast streams and on-demand track playlists',
              'Cross-platform synchronization between Android mobile devices, iPhones, and web browsers'
            ]}
          />

          {/* Technical Breakdown Section */}
          <section className="pillar-section">
            <div className="section-header">
              <span className="section-label">🔬 The Latency Problem</span>
              <h2 className="display section-title">Why Traditional Streaming Apps Fail at Synchronization</h2>
              <p className="section-sub">Understanding the three fundamental obstacles that cause standard audio streams to drift.</p>
            </div>

            <div className="steps-grid">
              <div className="step-card">
                <div className="step-number">01</div>
                <div className="step-icon-wrap"><Clock className="w-5 h-5 text-[#E1E0CC]" /></div>
                <h3 className="step-title">Hardware Clock Skew</h3>
                <p className="step-desc">
                  Every smartphone and laptop has an internal hardware quartz oscillator with slight timing inaccuracies. Over 10 minutes of playback, two uncoordinated devices will naturally drift apart by 300ms to 2 seconds.
                </p>
              </div>

              <div className="step-card">
                <div className="step-number">02</div>
                <div className="step-icon-wrap"><Network className="w-5 h-5 text-[#E1E0CC]" /></div>
                <h3 className="step-title">Variable Network Jitter</h3>
                <p className="step-desc">
                  Cellular (4G/5G) and Wi-Fi networks fluctuate constantly. When a player buffers packets independently, one listener ends up 3 seconds ahead while another lags behind.
                </p>
              </div>

              <div className="step-card">
                <div className="step-number">03</div>
                <div className="step-icon-wrap"><Cpu className="w-5 h-5 text-[#E1E0CC]" /></div>
                <h3 className="step-title">VoIP Audio Degradation</h3>
                <p className="step-desc">
                  Screen-sharing apps like Discord and Zoom compress stereo music into aggressive mono voice codecs with noise cancellation, destroying music fidelity and adding up to 4,000ms of lag.
                </p>
              </div>
            </div>
          </section>

          {/* The Hangloop Sync Architecture */}
          <section className="pillar-section">
            <div className="section-header">
              <span className="section-label">🛡️ The Solution</span>
              <h2 className="display section-title">The Hangloop Edge Sync Protocol</h2>
              <p className="section-sub">How our architecture guarantees millisecond-precision audio alignment.</p>
            </div>

            <div className="features-grid">
              <div className="feat-card">
                <div className="feat-icon"><Zap className="w-5 h-5 text-[#E1E0CC]" /></div>
                <h3 className="feat-title">Authoritative Durable Objects</h3>
                <p className="feat-desc">Each Hangloop room runs inside a globally distributed stateful worker that tracks the precise timeline timestamp `(startTime, currentTrackOffset, serverEpoch)`.</p>
              </div>

              <div className="feat-card">
                <div className="feat-icon"><Radio className="w-5 h-5 text-[#E1E0CC]" /></div>
                <h3 className="feat-title">Continuous Time Beacons</h3>
                <p className="feat-desc">The edge server broadcasts lightweight synchronization heartbeats every few seconds. Client devices measure round-trip time (RTT) and calculate the exact server-relative playback position.</p>
              </div>

              <div className="feat-card">
                <div className="feat-icon"><Clock className="w-5 h-5 text-[#E1E0CC]" /></div>
                <h3 className="feat-title">Micro-Rate Playback Correction</h3>
                <p className="feat-desc">If a client drifts by more than 150ms, Hangloop imperceptibly adjusts playback speed (e.g. 1.02x or 0.98x) for a fraction of a second to smoothly re-align without jarring audio skips.</p>
              </div>

              <div className="feat-card">
                <div className="feat-icon"><ShieldCheck className="w-5 h-5 text-[#E1E0CC]" /></div>
                <h3 className="feat-title">High-Fidelity Audio Direct Stream</h3>
                <p className="feat-desc">Audio is pulled directly from source CDNs in crystal-clear stereo rather than being re-encoded through a screen-share voice channel.</p>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="pillar-section">
            <div className="section-header">
              <span className="section-label">❓ Technical FAQ</span>
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
              <Link to="/music-rooms" className="related-link-pill">Virtual Music Rooms &rarr;</Link>
              <Link to="/features" className="related-link-pill">Platform Capabilities &rarr;</Link>
              <Link to="/faq" className="related-link-pill">General FAQ &rarr;</Link>
            </div>
          </section>

          {/* Bottom CTA */}
          <div className="about-cta-card">
            <div className="about-cta-content">
              <span className="section-label">🎧 Experience Zero-Lag Sync</span>
              <h3 className="about-cta-title">Test Sub-50ms Synchronized Audio Yourself</h3>
              <p className="about-cta-desc">Open a live station on two devices and hear them play in flawless harmony.</p>
              <div className="about-cta-actions">
                <Link to="/#live-streams" className="btn btn-gold">
                  <span>Open Live Rooms</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button className="btn btn-ghost" onClick={onOpenDownload}>
                  <Download className="w-4 h-4" />
                  <span>Download Mobile APK</span>
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
