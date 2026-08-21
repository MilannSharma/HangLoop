import { Link } from 'react-router-dom'
import { Download, Sparkles, Radio } from 'lucide-react'

interface Props {
  onOpenDownload: () => void
}

export default function Footer({ onOpenDownload }: Props) {
  return (
    <footer className="footer-wrap">
      <div className="container">
        <div className="footer-inner">
          <div className="footer-brand">
            <img src="/logo-gold.png" alt="Hangloop" width={24} height={24} />
            <span className="footer-brand-name">Hangloop</span>
            <span className="footer-badge">v1.0.0</span>
          </div>

          <p className="footer-copy">
            &copy; 2026 Hangloop Network. Real-time zero-lag synchronized music platform.
          </p>

          <div className="footer-actions">
            <Link to="/requests" className="btn btn-ghost btn-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Feature Requests</span>
            </Link>
            <button className="btn btn-gold btn-sm" onClick={onOpenDownload}>
              <Download className="w-3.5 h-3.5" />
              <span>Get App</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
