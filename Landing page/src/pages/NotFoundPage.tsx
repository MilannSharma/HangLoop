import { Link } from 'react-router-dom'
import SEOHead from '../components/SEOHead'
import Footer from '../components/Footer'
import { Radio, Home, Search, ArrowRight } from 'lucide-react'

interface Props {
  onOpenDownload: () => void
}

export default function NotFoundPage({ onOpenDownload }: Props) {
  return (
    <>
      <SEOHead
        title="Page Not Found (404) | Hangloop"
        description="The page you are looking for does not exist on Hangloop. Return to homepage or discover live synchronized music rooms."
        noindex={true}
      />

      <main className="subpage-wrapper" style={{ minHeight: '65vh', display: 'flex', alignItems: 'center' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: 640 }}>
          <span className="section-label">⚠️ Error 404</span>
          <h1 className="display" style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', margin: '16px 0', color: 'var(--prisma-cream)' }}>
            Track Not Found
          </h1>
          <p className="subpage-lead" style={{ margin: '0 auto 28px' }}>
            The room, track, or page you were looking for doesn't exist or may have moved. Let's get you back into the groove.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/" className="btn btn-gold">
              <Home className="w-4 h-4" />
              <span>Back to Homepage</span>
            </Link>
            <Link to="/#live-streams" className="btn btn-ghost">
              <Radio className="w-4 h-4" />
              <span>Explore Live Rooms</span>
            </Link>
          </div>

          <div style={{ marginTop: 40, borderTop: '1px solid var(--surface-border)', paddingTop: 20 }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Popular pages:</span>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 10 }}>
              <Link to="/listen-to-music-with-friends" className="text-gold-link" style={{ fontSize: '0.85rem' }}>Listen Together</Link>
              <span style={{ color: 'var(--text-dim)' }}>&bull;</span>
              <Link to="/music-rooms" className="text-gold-link" style={{ fontSize: '0.85rem' }}>Music Rooms</Link>
              <span style={{ color: 'var(--text-dim)' }}>&bull;</span>
              <Link to="/faq" className="text-gold-link" style={{ fontSize: '0.85rem' }}>FAQ</Link>
              <span style={{ color: 'var(--text-dim)' }}>&bull;</span>
              <Link to="/requests" className="text-gold-link" style={{ fontSize: '0.85rem' }}>Requests</Link>
            </div>
          </div>
        </div>
      </main>

      <Footer onOpenDownload={onOpenDownload} />
    </>
  )
}
