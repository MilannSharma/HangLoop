import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { User } from '../types'
import { getAvatarUrl } from '../utils/helpers'
import { Download, LogIn, Sparkles, Radio, MessageSquare } from 'lucide-react'

interface NavbarProps {
  currentUser: User | null
  onOpenAuth: (tab?: 'login' | 'register') => void
  onOpenDownload: () => void
  onLogout: () => void
}

export default function Navbar({ currentUser, onOpenAuth, onOpenDownload, onLogout }: NavbarProps) {
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

          {/* Actions: Login & Download App */}
          <div className="prisma-nav-actions">
            {currentUser ? (
              <div className="nav-user-pill" title={`Logged in as ${currentUser.username}`} onClick={onLogout}>
                <img
                  src={currentUser.avatar_url || getAvatarUrl(currentUser.username)}
                  className="nav-user-avatar"
                  alt={currentUser.username}
                />
                <span className="nav-user-name">{currentUser.full_name || currentUser.username}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>▾</span>
              </div>
            ) : (
              <button className="prisma-nav-btn-ghost" onClick={() => onOpenAuth('login')}>
                <LogIn className="w-3.5 h-3.5" />
                <span>Login</span>
              </button>
            )}

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
        <a href="#live-streams" onClick={closeMobile}>🔴 Live Rooms Dekho</a>
        <a href="#request-stream" onClick={closeMobile}>✨ Request YouTube Live</a>
        <a href="#feedback" onClick={closeMobile}>⭐ Listeners Feedback</a>
        <Link to="/requests" onClick={closeMobile}>💡 Feature Requests</Link>
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexDirection: 'column' }}>
          {!currentUser ? (
            <button
              className="btn btn-ghost"
              onClick={() => { closeMobile(); onOpenAuth('login'); }}
              style={{ width: '100%' }}
            >
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </button>
          ) : (
            <button
              className="btn btn-ghost"
              onClick={() => { closeMobile(); onLogout(); }}
              style={{ width: '100%' }}
            >
              <span>Logout ({currentUser.username})</span>
            </button>
          )}
          <button
            className="btn btn-gold"
            onClick={() => { closeMobile(); onOpenDownload(); }}
            style={{ width: '100%' }}
          >
            <Download className="w-4 h-4" />
            <span>App Download Karo</span>
          </button>
        </div>
      </div>
    </header>
  )
}
