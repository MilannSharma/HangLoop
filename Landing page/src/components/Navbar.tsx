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
          <Link to="/" className="prisma-nav-logo" onClick={closeMobile}>
            <img src="/logo-gold.png" alt="Hangloop" width={22} height={22} />
            <span className="prisma-nav-logo-text">Hangloop</span>
          </Link>

          {/* Navigation Links */}
          <nav className="prisma-nav-links">
            {location.pathname === '/' ? (
              <a href="#about" className="prisma-nav-link">
                <span>About</span>
              </a>
            ) : (
              <Link to="/#about" className="prisma-nav-link">
                <span>About</span>
              </Link>
            )}

            {location.pathname === '/' ? (
              <a href="#live-streams" className="prisma-nav-link">
                <span className="live-pulse-dot" />
                <span>Live Rooms</span>
              </a>
            ) : (
              <Link to="/#live-streams" className="prisma-nav-link">
                <span className="live-pulse-dot" />
                <span>Live Rooms</span>
              </Link>
            )}

            {location.pathname === '/' ? (
              <a href="#request-stream" className="prisma-nav-link">
                <span>Request Stream</span>
              </a>
            ) : (
              <Link to="/#request-stream" className="prisma-nav-link">
                <span>Request Stream</span>
              </Link>
            )}

            {location.pathname === '/' ? (
              <a href="#feedback" className="prisma-nav-link">
                <span>Feedback</span>
              </a>
            ) : (
              <Link to="/#feedback" className="prisma-nav-link">
                <span>Feedback</span>
              </Link>
            )}

            <Link
              to="/requests"
              className={`prisma-nav-link${location.pathname === '/requests' ? ' active' : ''}`}
            >
              <span>Requests</span>
            </Link>
          </nav>

          {/* Actions: Download App */}
          <div className="prisma-nav-actions">
            <button className="prisma-nav-btn-primary" onClick={onOpenDownload}>
              <Download className="w-3.5 h-3.5" />
              <span>Get App</span>
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              className={`prisma-nav-burger${mobileOpen ? ' open' : ''}`}
              aria-label="Toggle menu"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <span /><span /><span />
            </button>
          </div>

        </div>

      </div>

      {/* Mobile Menu Drawer */}
      <div className={`mobile-nav${mobileOpen ? ' open' : ''}`}>
        <a href="#about" onClick={closeMobile}>🌟 About Hangloop</a>
        <a href="#live-streams" onClick={closeMobile}>🔴 Live Rooms Status</a>
        <a href="#request-stream" onClick={closeMobile}>✨ Request YouTube Live</a>
        <a href="#feedback" onClick={closeMobile}>⭐ Listeners Feedback</a>
        <Link to="/requests" onClick={closeMobile}>💡 Feature Requests</Link>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexDirection: 'column' }}>
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
