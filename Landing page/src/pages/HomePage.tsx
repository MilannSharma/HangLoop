import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import SEOHead from '../components/SEOHead'
import HeroSection from '../components/HeroSection'
import AboutSection from '../components/AboutSection'
import LiveStreamsSection from '../components/LiveStreamsSection'
import RequestStreamSection from '../components/RequestStreamSection'
import FeedbackSection from '../components/FeedbackSection'
import FeaturesSection from '../components/FeaturesSection'
import SpotlightSection from '../components/SpotlightSection'
import Footer from '../components/Footer'
import { LiveRoom } from '../types'
import { API_BASE } from '../config'
import { HelpCircle, ArrowRight, Sparkles } from 'lucide-react'

const DEFAULT_OFFICIAL_ROOMS: LiveRoom[] = [
  {
    id: 'room-bollywood-hindi',
    name: 'Bollywood Hindi Music Live',
    theme: 'BOLLYWOOD',
    category: 'Bollywood Superhits',
    current_title: 'Kesariya — Brahmāstra',
    current_artist: 'Arijit Singh, Pritam',
    current_video_id: 'BddP6PYo2gs',
    thumbnail_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    current_thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    active_viewers: 1,
    is_private: false,
    music_enabled: true,
    max_members: 500,
    created_by: 'system'
  },
  {
    id: 'room-punjabi-hits',
    name: 'Punjabi Hits Live',
    theme: 'PUNJABI',
    category: 'Punjabi Chartbusters',
    current_title: 'Excuses — AP Dhillon',
    current_artist: 'AP Dhillon, Gurinder Gill',
    current_video_id: 'vX2cDW8LUWk',
    thumbnail_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    current_thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    active_viewers: 1,
    is_private: false,
    music_enabled: true,
    max_members: 500,
    created_by: 'system'
  },
  {
    id: 'room-lofi-chill',
    name: 'Lo-Fi Chill Beats Live',
    theme: 'LOFI_CHILL',
    category: 'Lo-Fi Study & Relax',
    current_title: 'Lofi Hip Hop Radio — 24/7 Beats',
    current_artist: 'Lofi Girl',
    current_video_id: 'jfKfPfyJRdk',
    thumbnail_url: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&auto=format&fit=crop&q=80',
    current_thumbnail: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&auto=format&fit=crop&q=80',
    active_viewers: 1,
    is_private: false,
    music_enabled: true,
    max_members: 500,
    created_by: 'system'
  },
  {
    id: 'room-instagram-trending',
    name: 'Instagram Trending Songs Live',
    theme: 'TRENDING',
    category: 'Reels & Viral Hits',
    current_title: 'Big Dawgs — Hanumankind',
    current_artist: 'Hanumankind, Kalmi',
    current_video_id: 'hOHKltAiKXQ',
    thumbnail_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    current_thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    active_viewers: 1,
    is_private: false,
    music_enabled: true,
    max_members: 500,
    created_by: 'system'
  }
];

const HOME_FAQS = [
  {
    q: 'What is Hangloop?',
    a: 'Hangloop is a web and mobile platform that lets friends listen to music together in synchronized online rooms with sub-50ms latency, live chat, animated reaction showers, and AI co-hosts.'
  },
  {
    q: 'How does synchronized music listening work?',
    a: 'Hangloop edge servers running on Cloudflare maintain an authoritative atomic clock timeline. Every listener in a room is locked to the exact same millisecond so music plays in absolute unison without audio drift.'
  },
  {
    q: 'Can I listen to Hangloop in the background on mobile?',
    a: 'Yes! The official Hangloop Android App supports continuous background streaming and lock-screen media notification controls.'
  },
  {
    q: 'Is Hangloop free to use?',
    a: 'Hangloop is 100% free with no paid subscriptions or intrusive audio advertisements.'
  }
]

interface Props {
  onOpenDownload: () => void
  onOpenFeedback: () => void
}

export default function HomePage({ onOpenDownload, onOpenFeedback }: Props) {
  const [rooms, setRooms] = useState<LiveRoom[]>(DEFAULT_OFFICIAL_ROOMS)

  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/rooms`)
      const data = await res.json()
      if (data && data.rooms && Array.isArray(data.rooms) && data.rooms.length > 0) {
        setRooms(data.rooms)
      }
    } catch {
      // Keep default official stations
    }
  }, [])

  useEffect(() => {
    fetchRooms()
    const timer = setInterval(() => {
      fetchRooms()
    }, 10000)
    return () => clearInterval(timer)
  }, [fetchRooms])

  const homeFaqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': HOME_FAQS.map(item => ({
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
        title="Hangloop — Listen to Music Together With Friends in Real Time"
        description="Hangloop lets you listen to music together with friends online in real time. Join synchronized 24/7 music rooms with zero-lag Cloudflare Edge playback, live chat, and AI hosts."
        canonicalUrl="https://hang-loop.vercel.app/"
        keywords="hangloop, listen to music together, listen to music with friends online, music rooms, synchronized music listening, synced music with friends, listen together with friends, online music room, virtual music room, real time music synchronization"
        jsonLd={homeFaqSchema}
      />

      <main>
        <HeroSection onOpenDownload={onOpenDownload} />
        <AboutSection onOpenDownload={onOpenDownload} />
        <LiveStreamsSection rooms={rooms} onOpenDownload={onOpenDownload} onRefresh={fetchRooms} />
        <RequestStreamSection />
        <FeedbackSection onOpenFeedback={onOpenFeedback} />
        <FeaturesSection />
        <SpotlightSection />

        {/* Homepage Quick FAQ Section for AEO */}
        <section id="home-faq" className="section-wrap" style={{ borderTop: '1px solid var(--surface-border)' }}>
          <div className="container">
            <div className="section-header">
              <span className="section-label">❓ Fast Answers</span>
              <h2 className="display section-title">Frequently Asked Questions</h2>
              <p className="section-sub">Quick answers to help you get started listening with friends.</p>
            </div>

            <div className="faq-accordion-list">
              {HOME_FAQS.map((faq, idx) => (
                <div className="faq-item" key={idx}>
                  <h3 className="faq-question">{faq.q}</h3>
                  <p className="faq-answer">{faq.a}</p>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: 28 }}>
              <Link to="/faq" className="btn btn-ghost btn-sm">
                <HelpCircle className="w-4 h-4" />
                <span>View All Questions in FAQ Hub &rarr;</span>
              </Link>
            </div>
          </div>
        </section>

        <Footer onOpenDownload={onOpenDownload} />
      </main>
    </>
  )
}
