import { Link } from 'react-router-dom'
import SEOHead from '../components/SEOHead'
import Breadcrumbs from '../components/Breadcrumbs'
import AEOAnswerBox from '../components/AEOAnswerBox'
import Footer from '../components/Footer'
import { Users, Radio, Zap, Headphones, MessageCircle, ArrowRight, Download, Sparkles, ShieldCheck, Share2 } from 'lucide-react'

interface Props {
  onOpenDownload: () => void
}

export default function ListenTogetherPage({ onOpenDownload }: Props) {
  const faqList = [
    {
      q: 'How do I listen to music together with friends online on Hangloop?',
      a: 'To listen together, simply launch Hangloop on web or the Android app, enter any 24/7 synchronized live room (like Bollywood, Punjabi, Lo-Fi, or Trending), and share the room link with your friends. Everyone hears the exact same song at the same millisecond.'
    },
    {
      q: 'Do my friends need to create an account to listen along?',
      a: 'No. Hangloop is open and free. Anyone can tune into public synchronized live rooms instantly without requiring sign-up or complex setup.'
    },
    {
      q: 'Does music stay in sync if my friend has a slower internet connection?',
      a: 'Yes. Hangloop uses Cloudflare Edge atomic clock synchronization that continuously adjusts timeline drift to maintain sub-50ms sync across different networks and devices.'
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
        title="Listen to Music Together With Friends Online in Real Time | Hangloop"
        description="Listen to music together online with friends with sub-50ms zero-lag synchronized audio playback. Join live music rooms, chat, react with animated emojis, and stream in background on Android & iOS."
        canonicalUrl="https://hang-loop.vercel.app/listen-to-music-with-friends"
        keywords="listen to music together, listen to music with friends online, listen to music together online, synced music with friends, listen together with friends, online music room, real time music synchronization"
        jsonLd={faqSchema}
      />

      <main className="subpage-wrapper">
        <div className="container">
          <Breadcrumbs items={[{ name: 'Listen Together', path: '/listen-to-music-with-friends' }]} />

          {/* Hero Header */}
          <header className="subpage-hero">
            <span className="section-label">🎶 Collaborative Social Audio</span>
            <h1 className="display subpage-title">
              Listen to Music Together With Friends Online in Real Time
            </h1>
            <p className="subpage-lead">
              Transform music listening into a shared, live social event. Hangloop connects you and your friends into zero-lag synchronized audio rooms where every drop, chorus, and beat drops together at the exact same millisecond.
            </p>
          </header>

          {/* AEO Direct Answer Box */}
          <AEOAnswerBox
            question="What is the best way to listen to music together with friends online?"
            directAnswer="Hangloop is a web and mobile platform specifically engineered for friends to listen to music together synchronously. Powered by Cloudflare Edge atomic time synchronization, Hangloop locks audio playback across all connected listeners with less than 50ms of drift, combining live YouTube streaming with live chat, animated reaction showers, and background playback."
            takeaways={[
              'Sub-50ms global audio synchronization across all devices',
              '24/7 curated genre stations (Bollywood, Punjabi, Lo-Fi, Viral Hits)',
              'Live chat with animated emoji reaction showers & AI hosts (Kira & Leo)',
              'Continuous background audio playback on mobile with lock-screen media controls',
              '100% free with no subscription or invasive audio ads'
            ]}
          />

          {/* How It Works 3-Step Process */}
          <section className="pillar-section">
            <div className="section-header">
              <span className="section-label">⚡ Simple 3-Step Guide</span>
              <h2 className="display section-title">How to Start a Listening Session in Seconds</h2>
              <p className="section-sub">No complex setups, bots, or subscription barriers. Start streaming together instantly.</p>
            </div>

            <div className="steps-grid">
              <div className="step-card">
                <div className="step-number">01</div>
                <div className="step-icon-wrap">
                  <Radio className="w-5 h-5 text-[#E1E0CC]" />
                </div>
                <h3 className="step-title">Choose or Request a Music Station</h3>
                <p className="step-desc">
                  Select from curated 24/7 live stations including Bollywood Superhits, Punjabi Chartbusters, Lo-Fi Chill Beats, or submit a custom YouTube Live link via our <Link to="/requests" className="text-gold-link">requests board</Link>.
                </p>
              </div>

              <div className="step-card">
                <div className="step-number">02</div>
                <div className="step-icon-wrap">
                  <Share2 className="w-5 h-5 text-[#E1E0CC]" />
                </div>
                <h3 className="step-title">Share the Link with Your Friends</h3>
                <p className="step-desc">
                  Copy the room URL or invite your crew through WhatsApp, Discord, or Instagram. Friends can join seamlessly on PC browsers or the official Hangloop Android app.
                </p>
              </div>

              <div className="step-card">
                <div className="step-number">03</div>
                <div className="step-icon-wrap">
                  <Zap className="w-5 h-5 text-[#E1E0CC]" />
                </div>
                <h3 className="step-title">Vibe in Real-Time Synchronization</h3>
                <p className="step-desc">
                  Listen in absolute unison. React to your favorite hooks with floating emoji showers, chat in real time, and banter with AI co-hosts Kira &amp; Leo.
                </p>
              </div>
            </div>
          </section>

          {/* Comparison Matrix */}
          <section className="pillar-section">
            <div className="section-header">
              <span className="section-label">📊 Comparison</span>
              <h2 className="display section-title">Why Hangloop Beats Traditional Screen Sharing</h2>
              <p className="section-sub">Standard voice calls and screen sharing suffer from audio compression, lag, and battery drain. Here is how Hangloop solves it.</p>
            </div>

            <div className="comparison-table-wrap">
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>Discord / Zoom Screen Share</th>
                    <th>Normal Music Apps</th>
                    <th>Hangloop Synchronized Rooms</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Audio Synchronization</strong></td>
                    <td>2–5 seconds delay &amp; lag</td>
                    <td>Unsynchronized</td>
                    <td className="highlight-cell"><span className="text-gold">Sub-50ms Atomic Sync</span></td>
                  </tr>
                  <tr>
                    <td><strong>Audio Quality</strong></td>
                    <td>Mono, compressed VoIP audio</td>
                    <td>High fidelity (Solo)</td>
                    <td className="highlight-cell"><span className="text-gold">High-Fidelity Original Audio</span></td>
                  </tr>
                  <tr>
                    <td><strong>Mobile Background Play</strong></td>
                    <td>Stops when screen turns off</td>
                    <td>Requires paid tier</td>
                    <td className="highlight-cell"><span className="text-gold">100% Free Background Play</span></td>
                  </tr>
                  <tr>
                    <td><strong>Interactive AI Roomies</strong></td>
                    <td>None</td>
                    <td>None</td>
                    <td className="highlight-cell"><span className="text-gold">Kira &amp; Leo AI Hosts</span></td>
                  </tr>
                  <tr>
                    <td><strong>Live Chat &amp; Reaction Showers</strong></td>
                    <td>Standard text chat</td>
                    <td>None</td>
                    <td className="highlight-cell"><span className="text-gold">Full-Screen Emoji Bursts</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Deep Content: Top Scenarios for Group Listening */}
          <section className="pillar-section">
            <div className="section-header">
              <span className="section-label">🎧 Use Cases</span>
              <h2 className="display section-title">Popular Ways People Listen Together on Hangloop</h2>
            </div>

            <div className="features-grid">
              <div className="feat-card">
                <div className="feat-icon"><Users className="w-5 h-5 text-[#E1E0CC]" /></div>
                <h3 className="feat-title">Long-Distance Friends &amp; Couples</h3>
                <p className="feat-desc">Share late-night music sessions, rediscover nostalgic tracks, and feel close regardless of physical distance.</p>
              </div>

              <div className="feat-card">
                <div className="feat-icon"><Headphones className="w-5 h-5 text-[#E1E0CC]" /></div>
                <h3 className="feat-title">Virtual Study &amp; Co-Working Sessions</h3>
                <p className="feat-desc">Tune into 24/7 Lo-Fi Chill Beats with classmates and colleagues to maintain focus and productivity in a shared ambient vibe.</p>
              </div>

              <div className="feat-card">
                <div className="feat-icon"><Sparkles className="w-5 h-5 text-[#E1E0CC]" /></div>
                <h3 className="feat-title">Virtual Album Listening Parties</h3>
                <p className="feat-desc">Celebrate new single and album drops simultaneously. Discuss lyrics, rate tracks, and trigger reaction bursts together.</p>
              </div>

              <div className="feat-card">
                <div className="feat-icon"><MessageCircle className="w-5 h-5 text-[#E1E0CC]" /></div>
                <h3 className="feat-title">Creator &amp; Fan Community Jams</h3>
                <p className="feat-desc">Artists and indie creators like Milan Sharma host live synchronized listening rooms to premiere new tracks with fans.</p>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="pillar-section">
            <div className="section-header">
              <span className="section-label">❓ Common Questions</span>
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

          {/* Internal Linking Nav */}
          <section className="related-links-bar">
            <span className="related-links-label">Explore More:</span>
            <div className="related-links-list">
              <Link to="/music-rooms" className="related-link-pill">Virtual Music Rooms &rarr;</Link>
              <Link to="/synchronized-music" className="related-link-pill">Synchronized Audio Technology &rarr;</Link>
              <Link to="/how-it-works" className="related-link-pill">How Hangloop Works &rarr;</Link>
              <Link to="/features" className="related-link-pill">Platform Features &rarr;</Link>
            </div>
          </section>

          {/* Bottom CTA Card */}
          <div className="about-cta-card">
            <div className="about-cta-content">
              <span className="section-label">🚀 Start Listening Now</span>
              <h3 className="about-cta-title">Ready to Jam Synchronously with Your Friends?</h3>
              <p className="about-cta-desc">Join active live rooms on web or download the Hangloop Android APK for continuous background audio.</p>
              <div className="about-cta-actions">
                <Link to="/#live-streams" className="btn btn-gold">
                  <span>Explore Live Rooms</span>
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
