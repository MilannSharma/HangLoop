import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Download } from 'lucide-react'

interface NavbarProps {
  onOpenDownload: () => void
}

export default function Navbar({ onOpenDownload }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 20) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const closeMobile = () => setMobileOpen(false)

  return (
    <header className={`prisma-navbar-wrapper${scrolled ? ' scrolled' : ''}`}>
      <div className="prisma-navbar-container">
        
        {/* Floating Top Capsule Bar */}
        <div className="prisma-navbar-capsule">
          
          {/* Logo */}
          <Link to="/" className="prisma-nav-logo" onClick={closeMobile} title="Hangloop Home">
            <img src="/logo-gold.png" alt="Hangloop" width={22} height={22} />
            <span className="prisma-nav-logo-text">Hangloop</span>
          </Link>

          {/* Navigation Links */}
          <nav className="prisma-nav-links" aria-label="Main Navigation">
            <Link
              to="/music-rooms"
              className={`prisma-nav-link${location.pathname === '/music-rooms' ? ' active' : ''}`}
            >
              <span className="live-pulse-dot" />
              <span>Live Rooms</span>
            </Link>

            <Link
              to="/listen-to-music-with-friends"
              className={`prisma-nav-link${location.pathname === '/listen-to-music-with-friends' ? ' active' : ''}`}
            >
              <span>Listen Together</span>
            </Link>

            <Link
              to="/how-it-works"
              className={`prisma-nav-link${location.pathname === '/how-it-works' ? ' active' : ''}`}
            >
              <span>How It Works</span>
            </Link>

            <Link
              to="/features"
              className={`prisma-nav-link${location.pathname === '/features' ? ' active' : ''}`}
            >
              <span>Features</span>
            </Link>

            <Link
              to="/faq"
              className={`prisma-nav-link${location.pathname === '/faq' ? ' active' : ''}`}
            >
              <span>FAQ</span>
            </Link>

            <Link
              to="/requests"
              className={`prisma-nav-link${location.pathname === '/requests' ? ' active' : ''}`}
            >
              <span>Roadmap</span>
            </Link>
          </nav>

          {/* Actions: Download App */}
          <div className="prisma-nav-actions">
            <button className="prisma-nav-btn-primary" onClick={onOpenDownload} title="Download Hangloop App">
              <Download className="w-3.5 h-3.5" />
              <span>Get App</span>
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              className={`prisma-nav-burger${mobileOpen ? ' open' : ''}`}
              aria-label="Toggle navigation menu"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <span /><span /><span />
            </button>
          </div>

        </div>

      </div>

      {/* Mobile Menu Drawer */}
      <div className={`mobile-nav${mobileOpen ? ' open' : ''}`}>
        <Link to="/" onClick={closeMobile}>🏠 Home</Link>
        <Link to="/music-rooms" onClick={closeMobile}>🔴 24/7 Music Rooms</Link>
        <Link to="/listen-to-music-with-friends" onClick={closeMobile}>🎶 Listen Together Guide</Link>
        <Link to="/how-it-works" onClick={closeMobile}>⚡ How Hangloop Works</Link>
        <Link to="/synchronized-music" onClick={closeMobile}>🔬 Sync Engine Technology</Link>
        <Link to="/features" onClick={closeMobile}>✨ Platform Features</Link>
        <Link to="/faq" onClick={closeMobile}>❓ Frequently Asked Questions</Link>
        <Link to="/requests" onClick={closeMobile}>💡 Community Roadmap &amp; Requests</Link>
        <Link to="/about" onClick={closeMobile}>🌟 About Hangloop</Link>
        <Link to="/changelog" onClick={closeMobile}>📜 Changelog &amp; Releases</Link>
        <div style={{ display: 'flex', gap: '10px', marginTop: '14px', flexDirection: 'column' }}>
          <button
            className="btn btn-gold"
            onClick={() => { closeMobile(); onOpenDownload(); }}
            style={{ width: '100%' }}
          >
            <Download className="w-4 h-4" />
            <span>Download Hangloop APK</span>
          </button>
        </div>
      </div>
    </header>
  )
}
