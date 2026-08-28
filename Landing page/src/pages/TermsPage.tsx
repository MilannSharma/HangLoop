import SEOHead from '../components/SEOHead'
import Breadcrumbs from '../components/Breadcrumbs'
import Footer from '../components/Footer'

interface Props {
  onOpenDownload: () => void
}

export default function TermsPage({ onOpenDownload }: Props) {
  return (
    <>
      <SEOHead
        title="Terms of Service | Hangloop Synchronized Music Platform"
        description="Review the Hangloop Terms of Service governing the use of synchronized music rooms, chat, stream requests, and mobile applications."
        canonicalUrl="https://hang-loop.vercel.app/terms"
        keywords="hangloop terms of service, terms of use, legal terms"
      />

      <main className="subpage-wrapper">
        <div className="container">
          <Breadcrumbs items={[{ name: 'Terms of Service', path: '/terms' }]} />

          <header className="subpage-hero">
            <span className="section-label">⚖️ Legal &amp; Compliance</span>
            <h1 className="display subpage-title">Hangloop Terms of Service</h1>
            <p className="subpage-lead">Last updated: August 28, 2026</p>
          </header>

          <article className="legal-content-card">
            <section className="legal-section">
              <h2>1. Agreement to Terms</h2>
              <p>
                By accessing or using Hangloop (https://hang-loop.vercel.app/) or our mobile applications, you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the service.
              </p>
            </section>

            <section className="legal-section">
              <h2>2. Community Conduct &amp; Room Chat</h2>
              <p>
                Hangloop is designed as a welcoming, inclusive space for music lovers. You agree not to:
              </p>
              <ul>
                <li>Transmit abusive, harassing, defamatory, or unlawful content in room chats.</li>
                <li>Attempt to disrupt or reverse-engineer the WebSocket synchronization protocol.</li>
                <li>Submit spam or malicious links through the public request board.</li>
              </ul>
            </section>

            <section className="legal-section">
              <h2>3. Intellectual Property &amp; Media Playback</h2>
              <p>
                Music streaming on Hangloop is powered through authorized embeds (including YouTube IFrame Player API). All copyright, trademarks, and master recordings belong to their respective rights holders and artists. Hangloop does not host or distribute raw audio files on its servers.
              </p>
            </section>

            <section className="legal-section">
              <h2>4. Disclaimer of Warranties</h2>
              <p>
                The service is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, whether express or implied.
              </p>
            </section>
          </article>
        </div>
      </main>

      <Footer onOpenDownload={onOpenDownload} />
    </>
  )
}
