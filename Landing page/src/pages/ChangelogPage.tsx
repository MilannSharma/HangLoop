import { Link } from 'react-router-dom'
import SEOHead from '../components/SEOHead'
import Breadcrumbs from '../components/Breadcrumbs'
import Footer from '../components/Footer'
import { Sparkles, CheckCircle2, Zap, Radio, Bot, Headphones, ArrowRight, Download } from 'lucide-react'

interface Props {
  onOpenDownload: () => void
}

export default function ChangelogPage({ onOpenDownload }: Props) {
  const releases = [
    {
      version: 'v1.0.0',
      date: 'August 28, 2026',
      tag: 'Official Production Release',
      title: 'Global Launch & Edge Synchronized Audio Engine',
      highlights: [
        'Sub-50ms audio synchronization powered by Cloudflare Durable Objects and low-latency WebSockets.',
        '4 Curated 24/7 Live Radio Stations: Bollywood Superhits, Punjabi Hits, Lo-Fi Chill Beats, and Instagram Trending.',
        'Kira & Leo AI room companions powered by Google Gemini with live music trivia and room chat interaction.',
        'Hangloop Official Android App (APK) with continuous background audio playback and lock-screen notification controls.',
        'Animated full-screen emoji reaction showers (🔥, ❤️, 👏, 🎉, 🎵, 🚀).',
        'Open Community Roadmap & YouTube Live stream request board with upvoting.'
      ]
    },
    {
      version: 'v0.9.5',
      date: 'August 15, 2026',
      tag: 'Beta Release',
      title: 'Background Playback & Mobile App Architecture',
      highlights: [
        'Introduced native foreground audio service on Android for seamless background playback when the device is locked.',
        'Adaptive micro-rate playback correction to eliminate audio jitter on unstable cellular connections.',
        'Obsidian Cinematic Dark Mode theme with warm bone cream typography and responsive desktop/mobile layouts.'
      ]
    },
    {
      version: 'v0.9.0',
      date: 'August 01, 2026',
      tag: 'Alpha Release',
      title: 'Initial Multi-User WebSocket Room Prototype',
      highlights: [
        'Proof of concept synchronized YouTube iframe embed controller.',
        'Real-time multi-user live chat with role badges and avatar generation.'
      ]
    }
  ]

  return (
    <>
      <SEOHead
        title="Hangloop Changelog & Product Release Notes | Hangloop"
        description="Stay updated with the latest Hangloop features, version history, edge synchronization improvements, and release notes."
        canonicalUrl="https://hang-loop.vercel.app/changelog"
        keywords="hangloop changelog, hangloop updates, hangloop release notes, synchronized music updates"
      />

      <main className="subpage-wrapper">
        <div className="container">
          <Breadcrumbs items={[{ name: 'Changelog', path: '/changelog' }]} />

          {/* Hero Header */}
          <header className="subpage-hero">
            <span className="section-label">📜 Version History &amp; Updates</span>
            <h1 className="display subpage-title">
              Hangloop Changelog &amp; Product Updates
            </h1>
            <p className="subpage-lead">
              Track new features, edge synchronization performance updates, and roadmap milestones as we build the ultimate synchronized music platform.
            </p>
          </header>

          {/* Changelog Timeline */}
          <section className="pillar-section" style={{ paddingTop: 10 }}>
            <div className="changelog-timeline">
              {releases.map((rel, idx) => (
                <article className="changelog-card" key={idx}>
                  <div className="changelog-header">
                    <div className="changelog-ver-wrap">
                      <span className="changelog-ver-badge">{rel.version}</span>
                      <span className="changelog-tag">{rel.tag}</span>
                    </div>
                    <time className="changelog-date">{rel.date}</time>
                  </div>

                  <h2 className="changelog-title">{rel.title}</h2>

                  <ul className="changelog-list">
                    {rel.highlights.map((point, pIdx) => (
                      <li key={pIdx} className="changelog-item">
                        <CheckCircle2 className="changelog-check-icon" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          {/* Related Links */}
          <section className="related-links-bar">
            <span className="related-links-label">Explore More:</span>
            <div className="related-links-list">
              <Link to="/features" className="related-link-pill">Platform Features &rarr;</Link>
              <Link to="/requests" className="related-link-pill">Feature Roadmap &rarr;</Link>
              <Link to="/about" className="related-link-pill">About Hangloop &rarr;</Link>
              <Link to="/contact" className="related-link-pill">Contact Support &rarr;</Link>
            </div>
          </section>

          {/* Bottom CTA */}
          <div className="about-cta-card">
            <div className="about-cta-content">
              <span className="section-label">💡 Shape the Next Release</span>
              <h3 className="about-cta-title">Have an Idea for the Next Version of Hangloop?</h3>
              <p className="about-cta-desc">Submit your feature request or vote on ideas from fellow listeners on our open roadmap.</p>
              <div className="about-cta-actions">
                <Link to="/requests" className="btn btn-gold">
                  <span>Submit Feature Request</span>
                  <Sparkles className="w-4 h-4" />
                </Link>
                <button className="btn btn-ghost" onClick={onOpenDownload}>
                  <Download className="w-4 h-4" />
                  <span>Download Latest APK</span>
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
