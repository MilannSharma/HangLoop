import SEOHead from '../components/SEOHead'
import Breadcrumbs from '../components/Breadcrumbs'
import Footer from '../components/Footer'

interface Props {
  onOpenDownload: () => void
}

export default function PrivacyPage({ onOpenDownload }: Props) {
  return (
    <>
      <SEOHead
        title="Privacy Policy | Hangloop Synchronized Music Platform"
        description="Review the Hangloop Privacy Policy. We respect listener privacy with zero audio tracking, no invasive third-party ad networks, and transparent edge session management."
        canonicalUrl="https://hang-loop.vercel.app/privacy"
        keywords="hangloop privacy policy, privacy, data protection, synchronized music privacy"
      />

      <main className="subpage-wrapper">
        <div className="container">
          <Breadcrumbs items={[{ name: 'Privacy Policy', path: '/privacy' }]} />

          <header className="subpage-hero">
            <span className="section-label">🔒 Legal &amp; Transparency</span>
            <h1 className="display subpage-title">Hangloop Privacy Policy</h1>
            <p className="subpage-lead">Last updated: August 28, 2026</p>
          </header>

          <article className="legal-content-card">
            <section className="legal-section">
              <h2>1. Introduction</h2>
              <p>
                Hangloop ("we", "our", or "the Platform") is committed to protecting your personal privacy. This Privacy Policy explains how information is collected, used, and safeguarded when you use our web platform (https://hang-loop.vercel.app/) and our mobile applications.
              </p>
            </section>

            <section className="legal-section">
              <h2>2. Information We Collect</h2>
              <p>Hangloop is built with minimal data collection principles:</p>
              <ul>
                <li><strong>Public Room Activity:</strong> Temporary display names, chosen avatars, and real-time chat messages sent in public rooms are visible to other room participants during the active session.</li>
                <li><strong>Feature &amp; Stream Requests:</strong> Suggestions and votes submitted to the public community roadmap board are stored to display community interest.</li>
                <li><strong>Technical Session Telemetry:</strong> Minimal network metrics (such as WebSocket latency offsets) required strictly for calculating sub-50ms audio synchronization.</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>3. What We Do NOT Collect</h2>
              <p>
                We do not sell, rent, or monetize your personal information. We do not track your listening habits across third-party websites or deploy invasive advertising cookies.
              </p>
            </section>

            <section className="legal-section">
              <h2>4. Third-Party Services</h2>
              <p>
                Hangloop utilizes trusted infrastructure providers:
              </p>
              <ul>
                <li><strong>Cloudflare:</strong> For DDoS protection, edge caching, and Durable Object WebSocket synchronization.</li>
                <li><strong>YouTube IFrame Embed API:</strong> Music playback is powered by embedded public YouTube streams conforming to YouTube's Terms of Service.</li>
                <li><strong>Google Gemini API:</strong> For powering the Kira &amp; Leo AI room co-host interactions.</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>5. Contact &amp; Inquiries</h2>
              <p>
                If you have questions about this Privacy Policy, please reach out via our GitHub repository or contact channels.
              </p>
            </section>
          </article>
        </div>
      </main>

      <Footer onOpenDownload={onOpenDownload} />
    </>
  )
}
