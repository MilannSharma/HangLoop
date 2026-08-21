import { useScrollReveal } from '../hooks/useScrollMotion'
import { Disc3, ExternalLink } from 'lucide-react'

export default function SpotlightSection() {
  useScrollReveal()

  return (
    <section id="spotlight" className="section-wrap">
      <div className="container">
        <div className="spotlight-banner reveal-item">
          <div className="spotlight-img-wrap">
            <img
              src="/milan_sharma_banner.jpg"
              alt="Teri Yaad by Milan Sharma"
              className="spotlight-img"
              onError={e => (e.target as HTMLImageElement).src = '/logo-gold.png'}
            />
          </div>
          <div className="spotlight-content">
            <span className="section-label">
              Featured Release
            </span>
            <h3 className="display spotlight-title">
              "Teri Yaad" by Milan Sharma
            </h3>
            <p className="spotlight-desc">
              Experience the soulful indie single streaming live right now across Hangloop synchronized rooms, Apple Music, and YouTube.
            </p>
            <div className="spotlight-actions">
              <a
                href="https://music.apple.com/us/album/teri-yaad-single/1826071477"
                target="_blank"
                rel="noreferrer"
                className="btn btn-gold btn-sm"
              >
                <Disc3 className="w-4 h-4" />
                <span>Listen on Apple Music</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://www.youtube.com/@TheMilanSharma"
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost btn-sm"
              >
                <span>YouTube Channel</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
