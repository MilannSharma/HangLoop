import { Link } from 'react-router-dom'
import SEOHead from '../components/SEOHead'
import Breadcrumbs from '../components/Breadcrumbs'
import AEOAnswerBox from '../components/AEOAnswerBox'
import Footer from '../components/Footer'
import { Sparkles, Radio, Bot, Disc3, Users, ShieldCheck, ExternalLink, Download, ArrowRight, Heart } from 'lucide-react'

interface Props {
  onOpenDownload: () => void
}

export default function AboutPage({ onOpenDownload }: Props) {
  return (
    <>
      <SEOHead
        title="About Hangloop — The Real-Time Synchronized Music Platform | Hangloop"
        description="Learn about the origin, mission, and technology behind Hangloop — the platform built by Milan Sharma to connect friends and music lovers through sub-50ms synchronized audio rooms."
        canonicalUrl="https://hang-loop.vercel.app/about"
        keywords="about hangloop, hangloop story, milan sharma hangloop, synchronized music platform, collaborative music listening"
      />

      <main className="subpage-wrapper">
        <div className="container">
          <Breadcrumbs items={[{ name: 'About', path: '/about' }]} />

          {/* Hero Header */}
          <header className="subpage-hero">
            <span className="section-label">🌟 Our Story &amp; Vision</span>
            <h1 className="display subpage-title">
              About Hangloop: Real-Time Synchronized Music for Everyone
            </h1>
            <p className="subpage-lead">
              Music is inherently social. Hangloop was engineered to eliminate physical distance and bring friends together in zero-lag synchronized audio harmony.
            </p>
          </header>

          {/* AEO Direct Answer */}
          <AEOAnswerBox
            question="What is Hangloop's mission?"
            directAnswer="Hangloop exists to make collective music listening seamless, accessible, and lag-free across the globe. Built on high-performance Cloudflare Edge architecture and Google Gemini AI, Hangloop enables friends to share live music rooms with sub-50ms synchronization drift, live chat, animated reaction showers, and continuous mobile background playback — 100% free and without intrusive ads."
            takeaways={[
              'Created by Milan Sharma with a community-first philosophy',
              'Sub-50ms global atomic clock audio synchronization',
              'Integrated Kira & Leo AI co-hosts powered by Google Gemini',
              'Open community roadmap where users request streams and vote on features',
              'Available on Web, Android APK, and iOS Progressive Web App'
            ]}
          />

          {/* Origin Story Section */}
          <section className="pillar-section">
            <div className="section-header">
              <span className="section-label">❤️ The Origin Story</span>
              <h2 className="display section-title">Why We Built Hangloop</h2>
            </div>

            <div className="about-hero-box" style={{ margin: 0 }}>
              <div className="about-hero-text" style={{ maxWidth: '100%' }}>
                <h3 className="about-hero-title" style={{ fontSize: '1.4rem' }}>
                  "Listening to music alone is good. Sharing a beat in real-time is magic."
                </h3>
                <p className="about-hero-desc" style={{ marginBottom: 16 }}>
                  During remote work and long-distance friendships, existing tools for listening to music together fell short. Screen sharing over Discord or Zoom compressed high-fidelity music into muddy voice audio with unpredictable 2–5 second delays. Mainstream music streaming platforms locked group listening behind paid subscriptions and separate accounts.
                </p>
                <p className="about-hero-desc" style={{ marginBottom: 16 }}>
                  Hangloop was created to solve this fundamentally. By separating the media synchronization timeline from audio transmission and leveraging Cloudflare Edge Durable Objects, Hangloop achieves sub-50ms synchronized playback directly from source CDNs.
                </p>
                <p className="about-hero-desc">
                  Whether you are studying with friends across town or jamming with loved ones across time zones, Hangloop ensures you hear every note together at the exact same millisecond.
                </p>
              </div>
            </div>
          </section>

          {/* 4 Architectural Pillars */}
          <section className="pillar-section">
            <div className="section-header">
              <span className="section-label">⚙️ Technology Pillars</span>
              <h2 className="display section-title">How Hangloop Is Engineered</h2>
            </div>

            <div className="about-pillars-grid">
              <div className="about-pillar-card">
                <div className="pillar-icon-wrap"><Radio className="w-6 h-6 text-[#E1E0CC]" /></div>
                <h3 className="pillar-title">Cloudflare Edge Architecture</h3>
                <p className="pillar-desc">Stateful Durable Objects coordinate room timelines with atomic clocks across 300+ global data centers for sub-50ms synchronization drift.</p>
              </div>

              <div className="about-pillar-card">
                <div className="pillar-icon-wrap"><Bot className="w-6 h-6 text-[#E1E0CC]" /></div>
                <h3 className="pillar-title">Google Gemini AI Roomies</h3>
                <p className="pillar-desc">Kira &amp; Leo AI bring life to every room with real-time music trivia, track reactions, and community banter 24/7.</p>
              </div>

              <div className="about-pillar-card">
                <div className="pillar-icon-wrap"><Disc3 className="w-6 h-6 text-[#E1E0CC]" /></div>
                <h3 className="pillar-title">Continuous Background Play</h3>
                <p className="pillar-desc">Designed for mobile life. The official Android App keeps audio streaming in the background with lock-screen media controls.</p>
              </div>

              <div className="about-pillar-card">
                <div className="pillar-icon-wrap"><Users className="w-6 h-6 text-[#E1E0CC]" /></div>
                <h3 className="pillar-title">Community-Driven Curation</h3>
                <p className="pillar-desc">An open request board where listeners suggest new YouTube live streams and upvote roadmap features directly.</p>
              </div>
            </div>
          </section>

          {/* Founder & Music Release Spotlight */}
          <section className="pillar-section">
            <div className="section-header">
              <span className="section-label">🎵 Creator &amp; Community</span>
              <h2 className="display section-title">Meet the Creator</h2>
            </div>

            <div className="spotlight-banner">
              <div className="spotlight-img-wrap">
                <img
                  src="/milan_sharma_banner.jpg"
                  alt="Milan Sharma — Creator of Hangloop"
                  className="spotlight-img"
                  onError={e => (e.target as HTMLImageElement).src = '/logo-gold.png'}
                />
              </div>
              <div className="spotlight-content">
                <span className="section-label">Founder &amp; Musician</span>
                <h3 className="display spotlight-title">Milan Sharma</h3>
                <p className="spotlight-desc">
                  Milan Sharma is an indie music artist and full-stack software engineer. As the creator of Hangloop, he combines audio engineering with distributed edge systems to build tools that bring people closer through music.
                </p>
                <div className="spotlight-actions">
                  <a
                    href="https://music.apple.com/us/album/teri-yaad-single/1826071477"
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-gold btn-sm"
                  >
                    <Disc3 className="w-4 h-4" />
                    <span>"Teri Yaad" on Apple Music</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href="https://github.com/MilannSharma/HangLoop"
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost btn-sm"
                  >
                    <span>GitHub Repository</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Related Links */}
          <section className="related-links-bar">
            <span className="related-links-label">Explore More:</span>
            <div className="related-links-list">
              <Link to="/how-it-works" className="related-link-pill">How Hangloop Works &rarr;</Link>
              <Link to="/features" className="related-link-pill">Platform Capabilities &rarr;</Link>
              <Link to="/changelog" className="related-link-pill">Changelog &amp; Releases &rarr;</Link>
              <Link to="/contact" className="related-link-pill">Contact Support &rarr;</Link>
            </div>
          </section>

          {/* Bottom CTA */}
          <div className="about-cta-card">
            <div className="about-cta-content">
              <span className="section-label">🌟 Join the Movement</span>
              <h3 className="about-cta-title">Experience Hangloop with Your Friends</h3>
              <p className="about-cta-desc">Tune into live stations right now or download the mobile app.</p>
              <div className="about-cta-actions">
                <Link to="/#live-streams" className="btn btn-gold">
                  <span>Enter Live Rooms</span>
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
