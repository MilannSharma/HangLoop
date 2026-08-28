import { Link } from 'react-router-dom'
import SEOHead from '../components/SEOHead'
import Breadcrumbs from '../components/Breadcrumbs'
import AEOAnswerBox from '../components/AEOAnswerBox'
import Footer from '../components/Footer'
import { Radio, Users, Bot, Download, ArrowRight, Smartphone, Laptop, Sparkles, Share2, MessageCircle } from 'lucide-react'

interface Props {
  onOpenDownload: () => void
}

export default function HowItWorksPage({ onOpenDownload }: Props) {
  const faqList = [
    {
      q: 'How do I join an existing Hangloop music room?',
      a: 'To join an existing room, click any active live station on the homepage or open the direct room URL shared by your friend. You will connect instantly and sync to the live song.'
    },
    {
      q: 'Can I use Hangloop on both mobile and desktop computers?',
      a: 'Yes. Hangloop is accessible via modern desktop browsers (Chrome, Edge, Safari, Firefox) and on mobile devices via the official Android APK and iOS Progressive Web App.'
    },
    {
      q: 'Is there any fee or subscription required to use Hangloop?',
      a: 'No. Hangloop is 100% free with no subscription tiers or intrusive audio advertisements.'
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
        title="How Hangloop Works: Create, Join & Sync Music Rooms | Hangloop"
        description="Learn how Hangloop works in 4 simple steps: choose a live station, invite friends, enjoy sub-50ms synchronized audio playback, and chat in real time."
        canonicalUrl="https://hang-loop.vercel.app/how-it-works"
        keywords="how hangloop works, how does hangloop work, how to listen to music together, how to join music room, invite friends music room"
        jsonLd={faqSchema}
      />

      <main className="subpage-wrapper">
        <div className="container">
          <Breadcrumbs items={[{ name: 'How It Works', path: '/how-it-works' }]} />

          {/* Hero Header */}
          <header className="subpage-hero">
            <span className="section-label">📖 User Guide</span>
            <h1 className="display subpage-title">
              How Hangloop Works: Create, Join &amp; Sync Music Rooms
            </h1>
            <p className="subpage-lead">
              A comprehensive walkthrough of how Hangloop connects music lovers worldwide for real-time synchronized listening sessions in 4 simple steps.
            </p>
          </header>

          {/* AEO Direct Answer */}
          <AEOAnswerBox
            question="How does Hangloop work?"
            directAnswer="Hangloop operates by connecting listeners to cloud-hosted synchronized audio rooms. When a user opens a room, an authoritative Cloudflare Edge server aligns their device's media player with the room's global timeline. All listeners hear the exact same audio stream in real time, while a WebSocket channel enables instant text chat, animated emoji reactions, and AI co-host banter."
            takeaways={[
              'Select from 24/7 curated genre radio stations or submit custom YouTube streams',
              'Share instant room links with friends across WhatsApp, Discord, or social media',
              'Experience zero-lag audio synchronization with <50ms global drift',
              'Enjoy continuous background audio playback on mobile devices with lock-screen controls',
              'Banter with Kira & Leo, our Gemini-powered AI room hosts'
            ]}
          />

          {/* Detailed 4 Steps Breakdown */}
          <section className="pillar-section">
            <div className="section-header">
              <span className="section-label">🚀 4 Simple Steps</span>
              <h2 className="display section-title">Step-by-Step Walkthrough</h2>
            </div>

            <div className="steps-grid">
              <div className="step-card">
                <div className="step-number">01</div>
                <div className="step-icon-wrap"><Radio className="w-5 h-5 text-[#E1E0CC]" /></div>
                <h3 className="step-title">1. Choose a Synchronized Station</h3>
                <p className="step-desc">
                  Browse our active 24/7 music rooms spanning Bollywood Hindi Hits, Punjabi Bangers, Lo-Fi Chill Beats, and Trending Reels Hits, or visit the <Link to="/requests" className="text-gold-link">Requests Board</Link> to submit new streams.
                </p>
              </div>

              <div className="step-card">
                <div className="step-number">02</div>
                <div className="step-icon-wrap"><Share2 className="w-5 h-5 text-[#E1E0CC]" /></div>
                <h3 className="step-title">2. Invite Your Friends</h3>
                <p className="step-desc">
                  Share the room URL with your friends. Friends can join on their laptops or mobile phones instantly without needing to download cumbersome software or pay for subscriptions.
                </p>
              </div>

              <div className="step-card">
                <div className="step-number">03</div>
                <div className="step-icon-wrap"><Sparkles className="w-5 h-5 text-[#E1E0CC]" /></div>
                <h3 className="step-title">3. Experience Sub-50ms Sync</h3>
                <p className="step-desc">
                  Hangloop edge servers calibrate all connected players to the same atomic millisecond. Every guitar lick, vocal riff, and bass drop lands at the exact same moment for everyone.
                </p>
              </div>

              <div className="step-card">
                <div className="step-number">04</div>
                <div className="step-icon-wrap"><MessageCircle className="w-5 h-5 text-[#E1E0CC]" /></div>
                <h3 className="step-title">4. Chat &amp; React Together</h3>
                <p className="step-desc">
                  Send real-time messages, trigger animated emoji bursts that shower across everyone's screens, and interact with Kira &amp; Leo AI for fun music trivia and room commentary.
                </p>
              </div>
            </div>
          </section>

          {/* Device Compatibility */}
          <section className="pillar-section">
            <div className="section-header">
              <span className="section-label">📱 Cross-Device Support</span>
              <h2 className="display section-title">Supported Devices &amp; Platforms</h2>
            </div>

            <div className="features-grid">
              <div className="feat-card">
                <div className="feat-icon"><Laptop className="w-5 h-5 text-[#E1E0CC]" /></div>
                <h3 className="feat-title">Web Browser (PC &amp; Mac)</h3>
                <p className="feat-desc">Works in Google Chrome, Microsoft Edge, Safari, Firefox, and Brave with no extensions or downloads required.</p>
              </div>

              <div className="feat-card">
                <div className="feat-icon"><Smartphone className="w-5 h-5 text-[#E1E0CC]" /></div>
                <h3 className="feat-title">Android Official App (APK)</h3>
                <p className="feat-desc">Features background audio streaming, lock-screen media notification controls, and battery optimization for Android 7.0+.</p>
              </div>

              <div className="feat-card">
                <div className="feat-icon"><Sparkles className="w-5 h-5 text-[#E1E0CC]" /></div>
                <h3 className="feat-title">Apple iOS (iPhone &amp; iPad)</h3>
                <p className="feat-desc">Installable Progressive Web App (PWA) on iOS Safari via "Add to Home Screen" or standalone release package.</p>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="pillar-section">
            <div className="section-header">
              <span className="section-label">❓ FAQ</span>
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
              <Link to="/listen-to-music-with-friends" className="related-link-pill">Listen Together Guide &rarr;</Link>
              <Link to="/music-rooms" className="related-link-pill">Explore Music Rooms &rarr;</Link>
              <Link to="/features" className="related-link-pill">Platform Capabilities &rarr;</Link>
              <Link to="/faq" className="related-link-pill">Full FAQ &rarr;</Link>
            </div>
          </section>

          {/* Bottom CTA */}
          <div className="about-cta-card">
            <div className="about-cta-content">
              <span className="section-label">🚀 Get Started</span>
              <h3 className="about-cta-title">Start Your First Synchronized Session</h3>
              <p className="about-cta-desc">Jump straight into any live station or download the mobile app.</p>
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
