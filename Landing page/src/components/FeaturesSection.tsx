import { useScrollReveal } from '../hooks/useScrollMotion'
import { Zap, Headphones, MessageCircle, ShieldCheck } from 'lucide-react'

export default function FeaturesSection() {
  useScrollReveal()

  return (
    <section id="features" className="section-wrap">
      <div className="container">
        {/* Section Header */}
        <div className="section-header reveal-item">
          <span className="section-label">⚡ Platform Capabilities</span>
          <h2 className="display section-title">Why Hangloop Feels Magic</h2>
          <p className="section-sub">
            Engineered from the ground up for real-time zero-lag collective music listening.
          </p>
        </div>

        <div className="features-grid">
          <div className="feat-card reveal-item">
            <div className="feat-icon">
              <Zap className="w-5 h-5 text-[#E1E0CC]" />
            </div>
            <h3 className="feat-title">Zero-Lag Synchronization</h3>
            <p className="feat-desc">
              Every listener hears the exact same beat down to the millisecond powered by Cloudflare Edge ultra-low latency architecture.
            </p>
          </div>

          <div className="feat-card reveal-item">
            <div className="feat-icon">
              <Headphones className="w-5 h-5 text-[#E1E0CC]" />
            </div>
            <h3 className="feat-title">Background Audio Play</h3>
            <p className="feat-desc">
              Lock your phone or multitask across apps — the mobile app keeps continuous synchronized background audio flowing without interruption.
            </p>
          </div>

          <div className="feat-card reveal-item">
            <div className="feat-icon">
              <MessageCircle className="w-5 h-5 text-[#E1E0CC]" />
            </div>
            <h3 className="feat-title">Live Chat &amp; Reaction Showers</h3>
            <p className="feat-desc">
              Chat live in sync with the song and trigger animated emoji bursts and full-screen reaction showers with your crew.
            </p>
          </div>

          <div className="feat-card reveal-item">
            <div className="feat-icon">
              <ShieldCheck className="w-5 h-5 text-[#E1E0CC]" />
            </div>
            <h3 className="feat-title">100% Free &bull; No Ads</h3>
            <p className="feat-desc">
              No intrusive ads, tracking, or paywalls. Pure, unadulterated high-fidelity music streaming for true music enthusiasts.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
