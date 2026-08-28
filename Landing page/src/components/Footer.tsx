import { Link } from 'react-router-dom'
import { Download, Sparkles, Radio, ExternalLink, ShieldCheck, Heart } from 'lucide-react'

interface Props {
  onOpenDownload: () => void
}

export default function Footer({ onOpenDownload }: Props) {
  return (
    <footer className="footer-wrap" aria-label="Site Footer">
      <div className="container">
        {/* Multi-Column Sitemap Section */}
        <div className="footer-columns-grid">
          
          {/* Brand Column */}
          <div className="footer-col brand-col">
            <Link to="/" className="footer-brand">
              <img src="/logo-gold.png" alt="Hangloop" width={28} height={28} />
              <span className="footer-brand-name">Hangloop</span>
              <span className="footer-badge">v1.0.0</span>
            </Link>
            <p className="footer-tagline">
              The premier platform for listening to music together with friends in real-time synchronized online music rooms. Sub-50ms sync drift powered by Cloudflare Edge.
            </p>
            <div className="footer-badges-list">
              <span className="footer-mini-badge">
                <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
                <span>100% Free &bull; Ad-Free</span>
              </span>
              <span className="footer-mini-badge">
                <Radio className="w-3.5 h-3.5 text-[#E1E0CC]" />
                <span>24/7 Live Stations</span>
              </span>
            </div>
          </div>

          {/* Column 1: Product Navigation */}
          <div className="footer-col">
            <h4 className="footer-col-title">Product</h4>
            <ul className="footer-links-list">
              <li><Link to="/listen-to-music-with-friends">Listen Together Online</Link></li>
              <li><Link to="/music-rooms">24/7 Live Music Rooms</Link></li>
              <li><Link to="/how-it-works">How Hangloop Works</Link></li>
              <li><Link to="/synchronized-music">Audio Sync Technology</Link></li>
              <li><Link to="/features">Features &amp; Capabilities</Link></li>
              <li><Link to="/requests">Feature &amp; Stream Roadmap</Link></li>
            </ul>
          </div>

          {/* Column 2: Resources & E-E-A-T */}
          <div className="footer-col">
            <h4 className="footer-col-title">Resources</h4>
            <ul className="footer-links-list">
              <li><Link to="/faq">Frequently Asked Questions</Link></li>
              <li><Link to="/about">About Hangloop Story</Link></li>
              <li><Link to="/changelog">Changelog &amp; Release Notes</Link></li>
              <li><Link to="/contact">Contact &amp; Support</Link></li>
              <li>
                <a href="https://github.com/MilannSharma/HangLoop" target="_blank" rel="noreferrer" className="footer-ext-link">
                  <span>GitHub Repository</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal & Mobile Downloads */}
          <div className="footer-col">
            <h4 className="footer-col-title">Apps &amp; Legal</h4>
            <ul className="footer-links-list">
              <li><button onClick={onOpenDownload} className="footer-link-btn">Download Android APK</button></li>
              <li><button onClick={onOpenDownload} className="footer-link-btn">iPhone &amp; iOS PWA App</button></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms of Service</Link></li>
            </ul>
            <div style={{ marginTop: 14 }}>
              <button className="btn btn-gold btn-sm" onClick={onOpenDownload} style={{ width: '100%' }}>
                <Download className="w-3.5 h-3.5" />
                <span>Get App (68 MB)</span>
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-row">
          <p className="footer-copy">
            &copy; 2026 Hangloop Network. Created by Milan Sharma. Real-time zero-lag synchronized music streaming.
          </p>
          <div className="footer-bottom-links">
            <Link to="/privacy">Privacy</Link>
            <span>&bull;</span>
            <Link to="/terms">Terms</Link>
            <span>&bull;</span>
            <Link to="/contact">Support</Link>
            <span>&bull;</span>
            <Link to="/sitemap.xml" target="_blank">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
