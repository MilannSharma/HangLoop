import { useState } from 'react'
import { Link } from 'react-router-dom'
import SEOHead from '../components/SEOHead'
import Breadcrumbs from '../components/Breadcrumbs'
import AEOAnswerBox from '../components/AEOAnswerBox'
import Footer from '../components/Footer'
import { Search, HelpCircle, ArrowRight, Download, Sparkles } from 'lucide-react'

interface Props {
  onOpenDownload: () => void
}

interface FAQItem {
  id: string
  category: string
  q: string
  a: string
}

const ALL_FAQS: FAQItem[] = [
  // General
  {
    id: 'gen-1',
    category: 'General',
    q: 'What is Hangloop?',
    a: 'Hangloop is a web and mobile platform that allows friends and music enthusiasts to listen to music together in real-time synchronized online music rooms with under 50ms of audio drift, live chat, animated reaction showers, and AI co-hosts.'
  },
  {
    id: 'gen-2',
    category: 'General',
    q: 'Is Hangloop free to use?',
    a: 'Yes, Hangloop is 100% free. There are no subscriptions, paywalls, or invasive audio advertising breaks.'
  },
  {
    id: 'gen-3',
    category: 'General',
    q: 'Who created Hangloop?',
    a: 'Hangloop was created by Milan Sharma and engineered for music lovers who want to share synchronous listening experiences without the latency of screen sharing.'
  },
  {
    id: 'gen-4',
    category: 'General',
    q: 'How is Hangloop different from listening on Spotify or YouTube Music?',
    a: 'Standard music apps are designed for solo listening or asynchronous playlists. Hangloop synchronizes playback across all room members down to the exact millisecond so everyone hears every drop, vocal, and chorus simultaneously.'
  },

  // Rooms & Playback
  {
    id: 'room-1',
    category: 'Rooms & Playback',
    q: 'How do I create or join a music room?',
    a: 'You can join any 24/7 curated public station (Bollywood, Punjabi, Lo-Fi, Trending) directly from the homepage or open a direct invite link shared by a friend.'
  },
  {
    id: 'room-2',
    category: 'Rooms & Playback',
    q: 'How many people can listen together in a single room?',
    a: 'Hangloop supports up to 500 simultaneous listeners per room on its Cloudflare Edge WebSocket infrastructure.'
  },
  {
    id: 'room-3',
    category: 'Rooms & Playback',
    q: 'Can I request a custom YouTube Live stream for a room?',
    a: 'Yes! Navigate to the Request Stream section on the homepage or the Requests Board to submit any YouTube live stream URL for review.'
  },

  // Synchronization
  {
    id: 'sync-1',
    category: 'Synchronization & Technology',
    q: 'How does Hangloop achieve zero-lag synchronization?',
    a: 'Hangloop uses Cloudflare Edge Durable Objects running in 300+ global edge locations. Each room maintains an authoritative atomic clock timeline and sends periodic sync beacons over WebSockets to keep client players calibrated within 50ms.'
  },
  {
    id: 'sync-2',
    category: 'Synchronization & Technology',
    q: 'What happens if someone in the room has a slow internet connection?',
    a: 'Hangloop uses micro-rate timeline calibration. Instead of pausing or stuttering the audio, the client player imperceptibly adjusts playback speed (e.g. 1.02x) for a fraction of a second until it re-aligns with the room master clock.'
  },

  // Mobile & Devices
  {
    id: 'mobile-1',
    category: 'Mobile & Audio',
    q: 'Does Hangloop support background audio playback on mobile?',
    a: 'Yes. The official Hangloop Android App supports continuous background streaming and lock-screen media controls so you can listen while multitasking or with your screen turned off.'
  },
  {
    id: 'mobile-2',
    category: 'Mobile & Audio',
    q: 'Can I use Hangloop on iPhone / iOS?',
    a: 'Yes. On iPhone you can use Hangloop via Safari as a Progressive Web App (PWA) by selecting "Share" > "Add to Home Screen", or by downloading the standalone release package.'
  },

  // AI & Community
  {
    id: 'ai-1',
    category: 'AI & Community',
    q: 'Who are Kira and Leo AI in the music rooms?',
    a: 'Kira and Leo are intelligent AI room companions powered by Google Gemini. They live inside the room chat to share artist trivia, discuss song choices, and bring lively banter to the room.'
  },
  {
    id: 'ai-2',
    category: 'AI & Community',
    q: 'How do animated reaction showers work?',
    a: 'When you tap reaction emoji buttons in the live chat (like 🔥, ❤️, 👏, 🎉), an animated burst showers across the screen of every connected room member in real time.'
  }
]

export default function FAQPage({ onOpenDownload }: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')

  const categories = ['ALL', 'General', 'Rooms & Playback', 'Synchronization & Technology', 'Mobile & Audio', 'AI & Community']

  const filteredFaqs = ALL_FAQS.filter(faq => {
    const matchesSearch = faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          faq.a.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'ALL' || faq.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': ALL_FAQS.map(item => ({
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
        title="Frequently Asked Questions (FAQ) | Hangloop Synchronized Music"
        description="Find answers to all questions about Hangloop: how synchronized music listening works, sub-50ms edge audio, 24/7 music rooms, background mobile play, and AI hosts."
        canonicalUrl="https://hang-loop.vercel.app/faq"
        keywords="hangloop live music app, hangloop faq, hangloop apk download, listen to music together app faq, sync music with friends app, synchronized music faq, doston ke saath music sunne wala app, music room questions"
        jsonLd={faqSchema}
      />

      <main className="subpage-wrapper">
        <div className="container">
          <Breadcrumbs items={[{ name: 'FAQ', path: '/faq' }]} />

          {/* Hero Header */}
          <header className="subpage-hero">
            <span className="section-label">❓ Help &amp; Knowledge Base</span>
            <h1 className="display subpage-title">
              Frequently Asked Questions (FAQ)
            </h1>
            <p className="subpage-lead">
              Clear, direct answers to common questions about Hangloop synchronized music rooms, audio synchronization, background playback, and AI room companions.
            </p>
          </header>

          {/* AEO Direct Answer */}
          <AEOAnswerBox
            question="What is the quickest summary of Hangloop?"
            directAnswer="Hangloop is a 100% free web and mobile synchronized music listening platform. It enables friends and global communities to join live audio rooms where music playback is locked down to sub-50ms drift across all devices, featuring live chat, full-screen reaction bursts, background playback on mobile, and Kira & Leo Gemini AI hosts."
            takeaways={[
              '100% free with no subscription or audio ads',
              'Sub-50ms Cloudflare Edge atomic clock synchronization',
              '24/7 stations for Bollywood, Punjabi, Lo-Fi, and Viral Hits',
              'Android APK with background audio and lock-screen controls',
              'Community-driven YouTube live stream request board'
            ]}
          />

          {/* Search & Filter Bar */}
          <div className="requests-bar-row" style={{ marginTop: 32 }}>
            <div className="requests-search-wrap">
              <Search className="requests-search-icon" />
              <input
                type="text"
                className="form-input requests-search-input"
                placeholder="Search FAQ questions..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="requests-controls">
            <div className="filter-tabs">
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`filter-btn${selectedCategory === cat ? ' active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* FAQ Accordion List */}
          <section className="pillar-section" style={{ paddingTop: 10 }}>
            <div className="faq-accordion-list">
              {filteredFaqs.length === 0 ? (
                <div className="streams-empty-box">
                  <p className="streams-empty-title">No matching questions found.</p>
                  <p className="streams-empty-text">Try a different search term or contact our support team.</p>
                  <Link to="/contact" className="btn btn-gold btn-sm">
                    <span>Contact Support</span>
                  </Link>
                </div>
              ) : (
                filteredFaqs.map(faq => (
                  <div className="faq-item" key={faq.id}>
                    <div className="stream-card-meta" style={{ marginBottom: 6 }}>
                      <span className="stream-theme-tag" style={{ fontSize: '0.7rem' }}>{faq.category}</span>
                    </div>
                    <h3 className="faq-question">{faq.q}</h3>
                    <p className="faq-answer">{faq.a}</p>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Related Links */}
          <section className="related-links-bar">
            <span className="related-links-label">Explore More:</span>
            <div className="related-links-list">
              <Link to="/how-it-works" className="related-link-pill">How Hangloop Works &rarr;</Link>
              <Link to="/listen-to-music-with-friends" className="related-link-pill">Listen Together Guide &rarr;</Link>
              <Link to="/music-rooms" className="related-link-pill">Virtual Music Rooms &rarr;</Link>
              <Link to="/requests" className="related-link-pill">Feature Roadmap &rarr;</Link>
            </div>
          </section>

          {/* Bottom CTA */}
          <div className="about-cta-card">
            <div className="about-cta-content">
              <span className="section-label">💡 Have More Questions?</span>
              <h3 className="about-cta-title">Join Our Community or Request a Feature</h3>
              <p className="about-cta-desc">Submit new ideas to our roadmap or get in touch with the creator team.</p>
              <div className="about-cta-actions">
                <Link to="/requests" className="btn btn-gold">
                  <span>View Feature Roadmap</span>
                  <Sparkles className="w-4 h-4" />
                </Link>
                <Link to="/contact" className="btn btn-ghost">
                  <span>Contact Support</span>
                </Link>
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer onOpenDownload={onOpenDownload} />
    </>
  )
}
