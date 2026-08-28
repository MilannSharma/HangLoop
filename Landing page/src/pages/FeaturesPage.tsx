import { Link } from 'react-router-dom'
import SEOHead from '../components/SEOHead'
import Breadcrumbs from '../components/Breadcrumbs'
import AEOAnswerBox from '../components/AEOAnswerBox'
import Footer from '../components/Footer'
import { Zap, Headphones, Bot, MessageCircle, ShieldCheck, Sparkles, Download, ArrowRight, Radio, Sliders } from 'lucide-react'

interface Props {
  onOpenDownload: () => void
}

export default function FeaturesPage({ onOpenDownload }: Props) {
  const features = [
    {
      icon: <Zap className="w-6 h-6 text-[#E1E0CC]" />,
      title: 'Zero-Lag Sub-50ms Synchronization',
      desc: 'Powered by Cloudflare Workers & Durable Objects, Hangloop synchronizes playback across hundreds of concurrent listeners globally with under 50ms of drift.'
    },
    {
      icon: <Headphones className="w-6 h-6 text-[#E1E0CC]" />,
      title: 'Continuous Background Audio on Mobile',
      desc: 'Lock your phone or multitask across other apps without interrupting your live music stream. Includes full lock-screen media notification controls.'
    },
    {
      icon: <Bot className="w-6 h-6 text-[#E1E0CC]" />,
      title: 'Intelligent AI Roomies: Kira & Leo',
      desc: 'Powered by Google Gemini, Kira & Leo live in every room to share song trivia, banter about trending tracks, and keep room energy alive 24/7.'
    },
    {
      icon: <MessageCircle className="w-6 h-6 text-[#E1E0CC]" />,
      title: 'Live Chat & Full-Screen Reaction Showers',
      desc: 'Chat in real time with room members and trigger animated floating emoji reaction bursts (🔥, ❤️, 👏, 🎉) that shower across everyone’s display.'
    },
    {
      icon: <Radio className="w-6 h-6 text-[#E1E0CC]" />,
      title: '24/7 Curated Genre Stations',
      desc: 'Always-on synchronized radio stations streaming Bollywood Superhits, Punjabi Chartbusters, Lo-Fi Chill Beats, and Trending Reels Hits non-stop.'
    },
    {
      icon: <Sliders className="w-6 h-6 text-[#E1E0CC]" />,
      title: 'Community Roadmap & Stream Requests',
      desc: 'An open board where listeners submit their favorite YouTube live streams, propose new features, and upvote community ideas.'
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-[#E1E0CC]" />,
      title: '100% Free & No Invasive Ads',
      desc: 'Pure high-fidelity music streaming with zero paywalls, forced subscription tiers, or invasive audio advertising interruptions.'
    },
    {
      icon: <Sparkles className="w-6 h-6 text-[#E1E0CC]" />,
      title: 'Cinematic Obsidian Aesthetic',
      desc: 'Sleek dark-mode aesthetic with warm bone cream accents, ambient glow nebulas, and buttery 60fps micro-animations.'
    }
  ]

  return (
    <>
      <SEOHead
        title="Hangloop Features: Zero-Lag Sync, AI Hosts & Background Play | Hangloop"
        description="Explore Hangloop features: sub-50ms synchronized audio playback, Kira & Leo AI co-hosts, continuous background playback, live chat, reaction showers, and 24/7 stations."
        canonicalUrl="https://hang-loop.vercel.app/features"
        keywords="hangloop features, synchronized music app, background music player, ai music room host, live music reaction showers"
      />

      <main className="subpage-wrapper">
        <div className="container">
          <Breadcrumbs items={[{ name: 'Features', path: '/features' }]} />

          {/* Hero Header */}
          <header className="subpage-hero">
            <span className="section-label">⚡ Platform Capabilities</span>
            <h1 className="display subpage-title">
              Hangloop Features &amp; Platform Capabilities
            </h1>
            <p className="subpage-lead">
              Engineered from the ground up to deliver the premier synchronized music listening experience for friends, communities, and creators.
            </p>
          </header>

          {/* AEO Direct Answer */}
          <AEOAnswerBox
            question="What are the key features of Hangloop?"
            directAnswer="Hangloop provides an end-to-end synchronized social music streaming platform. Key features include sub-50ms edge audio synchronization, continuous lock-screen background playback on mobile devices, Kira & Leo Gemini-powered AI room hosts, real-time live chat with full-screen reaction bursts, 24/7 curated live radio stations, and a community-driven feature request board."
            takeaways={[
              'Sub-50ms Cloudflare Edge atomic clock synchronization',
              'Background audio streaming with lock-screen controls on Android',
              'Kira & Leo AI co-hosts powered by Google Gemini',
              'Interactive full-screen emoji reaction showers',
              'Community stream requests and feature roadmap voting'
            ]}
          />

          {/* Features Grid */}
          <section className="pillar-section">
            <div className="section-header">
              <span className="section-label">🌟 Core Suite</span>
              <h2 className="display section-title">All Platform Capabilities</h2>
            </div>

            <div className="features-grid">
              {features.map((feat, idx) => (
                <div className="feat-card" key={idx}>
                  <div className="feat-icon">{feat.icon}</div>
                  <h3 className="feat-title">{feat.title}</h3>
                  <p className="feat-desc">{feat.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Related Links */}
          <section className="related-links-bar">
            <span className="related-links-label">Explore More:</span>
            <div className="related-links-list">
              <Link to="/listen-to-music-with-friends" className="related-link-pill">Listen Together Guide &rarr;</Link>
              <Link to="/music-rooms" className="related-link-pill">Virtual Music Rooms &rarr;</Link>
              <Link to="/synchronized-music" className="related-link-pill">Sync Technology &rarr;</Link>
              <Link to="/requests" className="related-link-pill">Feature Roadmap &rarr;</Link>
            </div>
          </section>

          {/* Bottom CTA */}
          <div className="about-cta-card">
            <div className="about-cta-content">
              <span className="section-label">📲 Download Hangloop</span>
              <h3 className="about-cta-title">Experience Every Feature in the Official App</h3>
              <p className="about-cta-desc">Get the Hangloop APK for background audio, lock-screen controls, and zero-lag music jams.</p>
              <div className="about-cta-actions">
                <Link to="/#live-streams" className="btn btn-gold">
                  <span>Explore Rooms</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button className="btn btn-ghost" onClick={onOpenDownload}>
                  <Download className="w-4 h-4" />
                  <span>Download APK (68 MB)</span>
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
