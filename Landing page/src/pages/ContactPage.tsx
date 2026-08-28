import { Link } from 'react-router-dom'
import SEOHead from '../components/SEOHead'
import Breadcrumbs from '../components/Breadcrumbs'
import Footer from '../components/Footer'
import { Mail, Code2, MessageSquare, Sparkles, ExternalLink, HelpCircle, ArrowRight } from 'lucide-react'

interface Props {
  onOpenDownload: () => void
  onOpenFeedback: () => void
}

export default function ContactPage({ onOpenDownload, onOpenFeedback }: Props) {
  return (
    <>
      <SEOHead
        title="Contact & Community Support | Hangloop Network"
        description="Get in touch with the Hangloop team, report bugs, join our open developer community on GitHub, or request technical support."
        canonicalUrl="https://hang-loop.vercel.app/contact"
        keywords="contact hangloop, hangloop support, hangloop github, hangloop community"
      />

      <main className="subpage-wrapper">
        <div className="container">
          <Breadcrumbs items={[{ name: 'Contact', path: '/contact' }]} />

          {/* Hero Header */}
          <header className="subpage-hero">
            <span className="section-label">📬 Community &amp; Support</span>
            <h1 className="display subpage-title">
              Contact &amp; Connect with Hangloop
            </h1>
            <p className="subpage-lead">
              We value direct communication with our listeners and community. Whether you have feedback, need support, or want to contribute to the open-source codebase, we are here.
            </p>
          </header>

          {/* Contact Channels Grid */}
          <section className="pillar-section" style={{ paddingTop: 10 }}>
            <div className="features-grid">
              <div className="feat-card">
                <div className="feat-icon"><Code2 className="w-5 h-5 text-[#E1E0CC]" /></div>
                <h3 className="feat-title">GitHub Repository</h3>
                <p className="feat-desc">Explore the codebase, star the project, inspect issue discussions, and report technical bugs on GitHub.</p>
                <div style={{ marginTop: 16 }}>
                  <a
                    href="https://github.com/MilannSharma/HangLoop"
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost btn-sm"
                  >
                    <span>View on GitHub</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="feat-card">
                <div className="feat-icon"><Sparkles className="w-5 h-5 text-[#E1E0CC]" /></div>
                <h3 className="feat-title">Feature Roadmap Board</h3>
                <p className="feat-desc">Submit ideas for new features, propose YouTube live streams, and upvote community requests on our open board.</p>
                <div style={{ marginTop: 16 }}>
                  <Link to="/requests" className="btn btn-gold btn-sm">
                    <span>Open Roadmap</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              <div className="feat-card">
                <div className="feat-icon"><MessageSquare className="w-5 h-5 text-[#E1E0CC]" /></div>
                <h3 className="feat-title">Listener Feedback</h3>
                <p className="feat-desc">Share your listening experience, report sound drift issues, or leave a review for the engineering team.</p>
                <div style={{ marginTop: 16 }}>
                  <button className="btn btn-ghost btn-sm" onClick={onOpenFeedback}>
                    <span>Leave Feedback</span>
                  </button>
                </div>
              </div>

              <div className="feat-card">
                <div className="feat-icon"><HelpCircle className="w-5 h-5 text-[#E1E0CC]" /></div>
                <h3 className="feat-title">Help &amp; FAQ</h3>
                <p className="feat-desc">Check out our searchable FAQ covering synchronization questions, mobile background play, and room controls.</p>
                <div style={{ marginTop: 16 }}>
                  <Link to="/faq" className="btn btn-ghost btn-sm">
                    <span>Browse FAQ</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Direct Support Card */}
          <div className="about-hero-box" style={{ marginTop: 24 }}>
            <div className="about-hero-text" style={{ maxWidth: '100%' }}>
              <span className="section-label">📧 Direct Inquiries</span>
              <h3 className="about-hero-title">Developer &amp; Collaboration Inquiries</h3>
              <p className="about-hero-desc">
                For artist integrations, community partnerships, or security disclosures, connect with creator Milan Sharma via official social profiles or GitHub issues.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
                <a
                  href="https://github.com/MilannSharma"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-gold btn-sm"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>@MilannSharma on GitHub</span>
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
      </main>

      <Footer onOpenDownload={onOpenDownload} />
    </>
  )
}
