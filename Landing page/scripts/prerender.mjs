import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const distDir = path.join(projectRoot, 'dist')

if (!fs.existsSync(distDir)) {
  console.error('❌ dist/ directory does not exist. Run "vite build" first.')
  process.exit(1)
}

const templateHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8')

console.log('⚡ Starting Hangloop Static Prerendering (SSG) for Crawlers & AI Bots...\n')

// 13 Canonical Routes definitions with rich semantic HTML and Schema.org metadata
const routes = [
  {
    path: '/',
    title: 'Hangloop — Listen to Music Together With Friends in Real Time',
    description: 'Hangloop lets you listen to music together with friends online in real time. Join synchronized 24/7 music rooms with zero-lag Cloudflare Edge playback, live chat, and AI hosts.',
    canonical: 'https://hang-loop.vercel.app/',
    keywords: 'hangloop, listen to music together, listen to music with friends online, music rooms, synchronized music listening, synced music with friends, listen together with friends, online music room, virtual music room, real time music synchronization',
    htmlContent: `
      <header class="prisma-navbar-wrapper">
        <div class="prisma-navbar-container">
          <div class="prisma-navbar-capsule">
            <a href="/" class="prisma-nav-logo">
              <img src="/logo-gold.png" alt="Hangloop" width="22" height="22" />
              <span class="prisma-nav-logo-text">Hangloop</span>
            </a>
            <nav class="prisma-nav-links" aria-label="Main Navigation">
              <a href="/music-rooms" class="prisma-nav-link"><span class="live-pulse-dot"></span><span>Live Rooms</span></a>
              <a href="/listen-to-music-with-friends" class="prisma-nav-link"><span>Listen Together</span></a>
              <a href="/how-it-works" class="prisma-nav-link"><span>How It Works</span></a>
              <a href="/features" class="prisma-nav-link"><span>Features</span></a>
              <a href="/faq" class="prisma-nav-link"><span>FAQ</span></a>
              <a href="/requests" class="prisma-nav-link"><span>Roadmap</span></a>
            </nav>
            <div class="prisma-nav-actions">
              <button class="prisma-nav-btn-primary"><span>Get App</span></button>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section class="prisma-hero-container">
          <div class="prisma-hero-card">
            <div class="prisma-hero-bottom">
              <div class="prisma-hero-grid">
                <div class="prisma-hero-title-col">
                  <h1 class="prisma-hero-title">Hangloop</h1>
                </div>
                <div class="prisma-hero-info-col">
                  <p class="prisma-hero-desc">
                    Hangloop is a worldwide network of synchronized music rooms connecting music lovers, artists and friends in real-time zero-lag audio harmony with live chat and reaction showers.
                  </p>
                  <div class="prisma-hero-actions">
                    <a href="#live-streams" class="btn-prisma-primary"><span>Join live rooms</span></a>
                    <button class="btn-prisma-secondary"><span>Download App</span></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="about" class="section-wrap">
          <div class="container">
            <div class="section-header">
              <span class="section-label">🌟 The Hangloop Story</span>
              <h2 class="display section-title">About Hangloop</h2>
              <p class="section-sub">
                Music is inherently social. Hangloop was engineered to bring people together through real-time synchronized music rooms, interactive AI companions, and zero-distraction playback.
              </p>
            </div>
            <div class="about-hero-box">
              <div class="about-hero-text">
                <span class="about-badge"><span>Synchronized Worldwide</span></span>
                <h3 class="about-hero-title">"Listening to music alone is great. Listening together is unforgettable."</h3>
                <p class="about-hero-desc">
                  Hangloop eliminates the physical distance between friends, creators, and music lovers. With our sub-second global synchronization engine running on Cloudflare Edge, every person in a room hears the exact same beat, guitar solo, and drop at the precise millisecond.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="live-streams" class="section-wrap">
          <div class="container">
            <div class="section-header">
              <span class="section-label">🔴 24/7 Synchronized Audio</span>
              <h2 class="display section-title">Live Music Stations</h2>
              <p class="section-sub">Continuous real-time synchronized music stations streaming 24/7 with zero-lag Cloudflare Edge technology.</p>
            </div>
            <div class="streams-grid">
              <article class="stream-card">
                <div class="stream-card-body">
                  <div class="stream-card-meta"><span class="stream-theme-tag">BOLLYWOOD</span><span class="stream-category-lbl">Bollywood Superhits</span></div>
                  <h3 class="stream-room-name">Bollywood Hindi Music Live</h3>
                  <p class="stream-track-artist-text">24/7 Synchronized Live Stream &bull; Sub-50ms Drift</p>
                </div>
              </article>
              <article class="stream-card">
                <div class="stream-card-body">
                  <div class="stream-card-meta"><span class="stream-theme-tag">PUNJABI</span><span class="stream-category-lbl">Punjabi Chartbusters</span></div>
                  <h3 class="stream-room-name">Punjabi Hits Live</h3>
                  <p class="stream-track-artist-text">24/7 Synchronized Live Stream &bull; Sub-50ms Drift</p>
                </div>
              </article>
              <article class="stream-card">
                <div class="stream-card-body">
                  <div class="stream-card-meta"><span class="stream-theme-tag">LOFI_CHILL</span><span class="stream-category-lbl">Lo-Fi Study & Relax</span></div>
                  <h3 class="stream-room-name">Lo-Fi Chill Beats Live</h3>
                  <p class="stream-track-artist-text">24/7 Synchronized Live Stream &bull; Sub-50ms Drift</p>
                </div>
              </article>
              <article class="stream-card">
                <div class="stream-card-body">
                  <div class="stream-card-meta"><span class="stream-theme-tag">TRENDING</span><span class="stream-category-lbl">Reels & Viral Hits</span></div>
                  <h3 class="stream-room-name">Instagram Trending Songs Live</h3>
                  <p class="stream-track-artist-text">24/7 Synchronized Live Stream &bull; Sub-50ms Drift</p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section id="home-faq" class="section-wrap">
          <div class="container">
            <div class="section-header">
              <span class="section-label">❓ Fast Answers</span>
              <h2 class="display section-title">Frequently Asked Questions</h2>
              <p class="section-sub">Quick answers to help you get started listening with friends.</p>
            </div>
            <div class="faq-accordion-list">
              <div class="faq-item">
                <h3 class="faq-question">What is Hangloop?</h3>
                <p class="faq-answer">Hangloop is a web and mobile platform that lets friends listen to music together in synchronized online rooms with sub-50ms latency, live chat, animated reaction showers, and AI co-hosts.</p>
              </div>
              <div class="faq-item">
                <h3 class="faq-question">How does synchronized music listening work?</h3>
                <p class="faq-answer">Hangloop edge servers running on Cloudflare maintain an authoritative atomic clock timeline. Every listener in a room is locked to the exact same millisecond so music plays in absolute unison without audio drift.</p>
              </div>
              <div class="faq-item">
                <h3 class="faq-question">Can I listen to Hangloop in the background on mobile?</h3>
                <p class="faq-answer">Yes! The official Hangloop Android App supports continuous background streaming and lock-screen media notification controls.</p>
              </div>
              <div class="faq-item">
                <h3 class="faq-question">Is Hangloop free to use?</h3>
                <p class="faq-answer">Hangloop is 100% free with no paid subscriptions or intrusive audio advertisements.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer class="footer-wrap" aria-label="Site Footer">
        <div class="container">
          <div class="footer-columns-grid">
            <div class="footer-col brand-col">
              <a href="/" class="footer-brand"><img src="/logo-gold.png" alt="Hangloop" width="28" height="28" /><span class="footer-brand-name">Hangloop</span><span class="footer-badge">v1.0.0</span></a>
              <p class="footer-tagline">The premier platform for listening to music together with friends in real-time synchronized online music rooms. Sub-50ms sync drift powered by Cloudflare Edge.</p>
            </div>
            <div class="footer-col">
              <h4 class="footer-col-title">Product</h4>
              <ul class="footer-links-list">
                <li><a href="/listen-to-music-with-friends">Listen Together Online</a></li>
                <li><a href="/music-rooms">24/7 Live Music Rooms</a></li>
                <li><a href="/how-it-works">How Hangloop Works</a></li>
                <li><a href="/synchronized-music">Audio Sync Technology</a></li>
                <li><a href="/features">Features &amp; Capabilities</a></li>
                <li><a href="/requests">Feature &amp; Stream Roadmap</a></li>
              </ul>
            </div>
            <div class="footer-col">
              <h4 class="footer-col-title">Resources</h4>
              <ul class="footer-links-list">
                <li><a href="/faq">Frequently Asked Questions</a></li>
                <li><a href="/about">About Hangloop Story</a></li>
                <li><a href="/changelog">Changelog &amp; Release Notes</a></li>
                <li><a href="/contact">Contact &amp; Support</a></li>
                <li><a href="https://github.com/MilannSharma/HangLoop" target="_blank" rel="noreferrer">GitHub Repository</a></li>
              </ul>
            </div>
            <div class="footer-col">
              <h4 class="footer-col-title">Apps &amp; Legal</h4>
              <ul class="footer-links-list">
                <li><a href="/privacy">Privacy Policy</a></li>
                <li><a href="/terms">Terms of Service</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    `
  },
  {
    path: '/listen-to-music-with-friends',
    title: 'Listen to Music Together With Friends Online in Real Time | Hangloop',
    description: 'Listen to music together online with friends with sub-50ms zero-lag synchronized audio playback. Join live music rooms, chat, react with animated emojis, and stream in background on Android & iOS.',
    canonical: 'https://hang-loop.vercel.app/listen-to-music-with-friends',
    keywords: 'listen to music together, listen to music with friends online, listen to music together online, synced music with friends, listen together with friends, online music room, real time music synchronization',
    htmlContent: `
      <main class="subpage-wrapper">
        <div class="container">
          <nav aria-label="Breadcrumb" class="breadcrumbs-nav">
            <ol class="breadcrumbs-list">
              <li class="breadcrumb-item"><a href="/" class="breadcrumb-link"><span>Home</span></a></li>
              <li class="breadcrumb-item"><span class="breadcrumb-separator">&gt;</span><span class="breadcrumb-current">Listen Together</span></li>
            </ol>
          </nav>
          <header class="subpage-hero">
            <span class="section-label">🎶 Collaborative Social Audio</span>
            <h1 class="display subpage-title">Listen to Music Together With Friends Online in Real Time</h1>
            <p class="subpage-lead">Transform music listening into a shared, live social event. Hangloop connects you and your friends into zero-lag synchronized audio rooms where every drop, chorus, and beat drops together at the exact same millisecond.</p>
          </header>
          <article class="aeo-answer-box">
            <div class="aeo-header">
              <span class="aeo-badge"><span>Direct Answer</span></span>
              <h2 class="aeo-question">What is the best way to listen to music together with friends online?</h2>
            </div>
            <div class="aeo-direct-summary">
              <p class="aeo-direct-text">Hangloop is a web and mobile platform specifically engineered for friends to listen to music together synchronously. Powered by Cloudflare Edge atomic time synchronization, Hangloop locks audio playback across all connected listeners with less than 50ms of drift, combining live YouTube streaming with live chat, animated reaction showers, and background playback.</p>
            </div>
            <div class="aeo-takeaways-list">
              <div class="aeo-takeaways-title">Key Highlights:</div>
              <div class="aeo-takeaways-grid">
                <div class="aeo-takeaway-item"><span>Sub-50ms global audio synchronization across all devices</span></div>
                <div class="aeo-takeaway-item"><span>24/7 curated genre stations (Bollywood, Punjabi, Lo-Fi, Viral Hits)</span></div>
                <div class="aeo-takeaway-item"><span>Live chat with animated emoji reaction showers &amp; AI hosts (Kira &amp; Leo)</span></div>
                <div class="aeo-takeaway-item"><span>Continuous background audio playback on mobile with lock-screen controls</span></div>
                <div class="aeo-takeaway-item"><span>100% free with no subscription or invasive audio ads</span></div>
              </div>
            </div>
          </article>
        </div>
      </main>
    `
  },
  {
    path: '/music-rooms',
    title: 'Synchronized Music Rooms & 24/7 Live Music Stations | Hangloop',
    description: 'Join 24/7 synchronized online music rooms streaming Bollywood, Punjabi, Lo-Fi, and trending hits. Listen with friends in real time with sub-50ms sync, live chat, and AI hosts.',
    canonical: 'https://hang-loop.vercel.app/music-rooms',
    keywords: 'music rooms, online music room, virtual music room, synchronized music rooms, shared music room, music listening room',
    htmlContent: `
      <main class="subpage-wrapper">
        <div class="container">
          <nav aria-label="Breadcrumb" class="breadcrumbs-nav">
            <ol class="breadcrumbs-list">
              <li class="breadcrumb-item"><a href="/" class="breadcrumb-link"><span>Home</span></a></li>
              <li class="breadcrumb-item"><span class="breadcrumb-separator">&gt;</span><span class="breadcrumb-current">Music Rooms</span></li>
            </ol>
          </nav>
          <header class="subpage-hero">
            <span class="section-label">🔴 24/7 Live Synchronized Stations</span>
            <h1 class="display subpage-title">Synchronized Music Rooms &amp; 24/7 Live Stations</h1>
            <p class="subpage-lead">Discover curated online music rooms streaming 24 hours a day, 7 days a week. Hangloop music rooms synchronize audio playback across hundreds of simultaneous listeners with zero drift.</p>
          </header>
          <article class="aeo-answer-box">
            <div class="aeo-header">
              <span class="aeo-badge"><span>Direct Answer</span></span>
              <h2 class="aeo-question">What are Hangloop Music Rooms?</h2>
            </div>
            <div class="aeo-direct-summary">
              <p class="aeo-direct-text">Hangloop Music Rooms are real-time collaborative audio spaces powered by Cloudflare Durable Objects and WebSocket edge architecture. Each room maintains an authoritative playback timeline so that every user in the room experiences identical music playback simultaneously, paired with synchronized live chat, emoji reaction showers, and AI co-hosts.</p>
            </div>
          </article>
        </div>
      </main>
    `
  },
  {
    path: '/synchronized-music',
    title: 'Synchronized Music Listening: Sub-50ms Real-Time Audio | Hangloop',
    description: 'Learn how Hangloop delivers sub-50ms real-time audio synchronization across devices worldwide using Cloudflare Edge Durable Objects, atomic clock tracking, and zero-lag WebSockets.',
    canonical: 'https://hang-loop.vercel.app/synchronized-music',
    keywords: 'synchronized music, synchronized music listening, synced music, real time music synchronization, audio synchronization',
    htmlContent: `
      <main class="subpage-wrapper">
        <div class="container">
          <nav aria-label="Breadcrumb" class="breadcrumbs-nav">
            <ol class="breadcrumbs-list">
              <li class="breadcrumb-item"><a href="/" class="breadcrumb-link"><span>Home</span></a></li>
              <li class="breadcrumb-item"><span class="breadcrumb-separator">&gt;</span><span class="breadcrumb-current">Synchronized Music</span></li>
            </ol>
          </nav>
          <header class="subpage-hero">
            <span class="section-label">⚡ Real-Time Audio Engine</span>
            <h1 class="display subpage-title">Synchronized Music Listening: Sub-50ms Real-Time Audio</h1>
            <p class="subpage-lead">Discover the engineering behind zero-lag collaborative music streaming. Hangloop eliminates audio latency and drift, ensuring every listener in a room hears every beat in absolute unison.</p>
          </header>
          <article class="aeo-answer-box">
            <div class="aeo-header">
              <span class="aeo-badge"><span>Direct Answer</span></span>
              <h2 class="aeo-question">How does synchronized music listening work on Hangloop?</h2>
            </div>
            <div class="aeo-direct-summary">
              <p class="aeo-direct-text">Synchronized music listening on Hangloop coordinates audio playback across multiple distributed devices using an authoritative atomic server clock. Cloudflare Edge Durable Objects calculate real-time playback offsets and broadcast lightweight synchronization packets over low-latency WebSockets.</p>
            </div>
          </article>
        </div>
      </main>
    `
  },
  {
    path: '/how-it-works',
    title: 'How Hangloop Works: Create, Join & Sync Music Rooms | Hangloop',
    description: 'Learn how Hangloop works in 4 simple steps: choose a live station, invite friends, enjoy sub-50ms synchronized audio playback, and chat in real time.',
    canonical: 'https://hang-loop.vercel.app/how-it-works',
    keywords: 'how hangloop works, how does hangloop work, how to listen to music together, how to join music room',
    htmlContent: `
      <main class="subpage-wrapper">
        <div class="container">
          <nav aria-label="Breadcrumb" class="breadcrumbs-nav">
            <ol class="breadcrumbs-list">
              <li class="breadcrumb-item"><a href="/" class="breadcrumb-link"><span>Home</span></a></li>
              <li class="breadcrumb-item"><span class="breadcrumb-separator">&gt;</span><span class="breadcrumb-current">How It Works</span></li>
            </ol>
          </nav>
          <header class="subpage-hero">
            <span class="section-label">📖 User Guide</span>
            <h1 class="display subpage-title">How Hangloop Works: Create, Join &amp; Sync Music Rooms</h1>
            <p class="subpage-lead">A comprehensive walkthrough of how Hangloop connects music lovers worldwide for real-time synchronized listening sessions in 4 simple steps.</p>
          </header>
          <article class="aeo-answer-box">
            <div class="aeo-header">
              <span class="aeo-badge"><span>Direct Answer</span></span>
              <h2 class="aeo-question">How does Hangloop work?</h2>
            </div>
            <div class="aeo-direct-summary">
              <p class="aeo-direct-text">Hangloop operates by connecting listeners to cloud-hosted synchronized audio rooms. When a user opens a room, an authoritative Cloudflare Edge server aligns their device player with the room global timeline, keeping everyone in absolute synchronization with live chat and AI banter.</p>
            </div>
          </article>
        </div>
      </main>
    `
  },
  {
    path: '/features',
    title: 'Hangloop Features: Zero-Lag Sync, AI Hosts & Background Play | Hangloop',
    description: 'Explore Hangloop features: sub-50ms synchronized audio playback, Kira & Leo AI co-hosts, continuous background playback, live chat, reaction showers, and 24/7 stations.',
    canonical: 'https://hang-loop.vercel.app/features',
    keywords: 'hangloop features, synchronized music app, background music player, ai music room host',
    htmlContent: `
      <main class="subpage-wrapper">
        <div class="container">
          <nav aria-label="Breadcrumb" class="breadcrumbs-nav">
            <ol class="breadcrumbs-list">
              <li class="breadcrumb-item"><a href="/" class="breadcrumb-link"><span>Home</span></a></li>
              <li class="breadcrumb-item"><span class="breadcrumb-separator">&gt;</span><span class="breadcrumb-current">Features</span></li>
            </ol>
          </nav>
          <header class="subpage-hero">
            <span class="section-label">⚡ Platform Capabilities</span>
            <h1 class="display subpage-title">Hangloop Features &amp; Platform Capabilities</h1>
            <p class="subpage-lead">Engineered from the ground up to deliver the premier synchronized music listening experience for friends, communities, and creators.</p>
          </header>
          <article class="aeo-answer-box">
            <div class="aeo-header">
              <span class="aeo-badge"><span>Direct Answer</span></span>
              <h2 class="aeo-question">What are the key features of Hangloop?</h2>
            </div>
            <div class="aeo-direct-summary">
              <p class="aeo-direct-text">Hangloop provides an end-to-end synchronized social music streaming platform. Key features include sub-50ms edge audio synchronization, continuous lock-screen background playback on mobile devices, Kira &amp; Leo Gemini-powered AI room hosts, real-time live chat with full-screen reaction bursts, 24/7 curated live radio stations, and an open request board.</p>
            </div>
          </article>
        </div>
      </main>
    `
  },
  {
    path: '/faq',
    title: 'Frequently Asked Questions (FAQ) | Hangloop Synchronized Music',
    description: 'Find answers to all questions about Hangloop: how synchronized music listening works, sub-50ms edge audio, 24/7 music rooms, background mobile play, and AI hosts.',
    canonical: 'https://hang-loop.vercel.app/faq',
    keywords: 'hangloop faq, how hangloop works, synchronized music faq, listen together faq',
    htmlContent: `
      <main class="subpage-wrapper">
        <div class="container">
          <nav aria-label="Breadcrumb" class="breadcrumbs-nav">
            <ol class="breadcrumbs-list">
              <li class="breadcrumb-item"><a href="/" class="breadcrumb-link"><span>Home</span></a></li>
              <li class="breadcrumb-item"><span class="breadcrumb-separator">&gt;</span><span class="breadcrumb-current">FAQ</span></li>
            </ol>
          </nav>
          <header class="subpage-hero">
            <span class="section-label">❓ Help &amp; Knowledge Base</span>
            <h1 class="display subpage-title">Frequently Asked Questions (FAQ)</h1>
            <p class="subpage-lead">Clear, direct answers to common questions about Hangloop synchronized music rooms, audio synchronization, background playback, and AI room companions.</p>
          </header>
          <div class="faq-accordion-list">
            <div class="faq-item">
              <h3 class="faq-question">What is Hangloop?</h3>
              <p class="faq-answer">Hangloop is a web and mobile platform that allows friends and music enthusiasts to listen to music together in real-time synchronized online music rooms with under 50ms of audio drift, live chat, animated reaction showers, and AI co-hosts.</p>
            </div>
            <div class="faq-item">
              <h3 class="faq-question">Is Hangloop free to use?</h3>
              <p class="faq-answer">Yes, Hangloop is 100% free. There are no subscriptions, paywalls, or invasive audio advertising breaks.</p>
            </div>
            <div class="faq-item">
              <h3 class="faq-question">How does Hangloop achieve zero-lag synchronization?</h3>
              <p class="faq-answer">Hangloop uses Cloudflare Edge Durable Objects running in 300+ global edge locations. Each room maintains an authoritative atomic clock timeline and sends periodic sync beacons over WebSockets to keep client players calibrated within 50ms.</p>
            </div>
            <div class="faq-item">
              <h3 class="faq-question">Does Hangloop support background audio playback on mobile?</h3>
              <p class="faq-answer">Yes. The official Hangloop Android App supports continuous background streaming and lock-screen media controls so you can listen while multitasking or with your screen turned off.</p>
            </div>
          </div>
        </div>
      </main>
    `
  },
  {
    path: '/about',
    title: 'About Hangloop — The Real-Time Synchronized Music Platform | Hangloop',
    description: 'Learn about the origin, mission, and technology behind Hangloop — the platform built by Milan Sharma to connect friends and music lovers through sub-50ms synchronized audio rooms.',
    canonical: 'https://hang-loop.vercel.app/about',
    keywords: 'about hangloop, hangloop story, milan sharma hangloop, synchronized music platform',
    htmlContent: `
      <main class="subpage-wrapper">
        <div class="container">
          <nav aria-label="Breadcrumb" class="breadcrumbs-nav">
            <ol class="breadcrumbs-list">
              <li class="breadcrumb-item"><a href="/" class="breadcrumb-link"><span>Home</span></a></li>
              <li class="breadcrumb-item"><span class="breadcrumb-separator">&gt;</span><span class="breadcrumb-current">About</span></li>
            </ol>
          </nav>
          <header class="subpage-hero">
            <span class="section-label">🌟 Our Story &amp; Vision</span>
            <h1 class="display subpage-title">About Hangloop: Real-Time Synchronized Music for Everyone</h1>
            <p class="subpage-lead">Music is inherently social. Hangloop was engineered to eliminate physical distance and bring friends together in zero-lag synchronized audio harmony.</p>
          </header>
          <div class="about-hero-box">
            <div class="about-hero-text">
              <h3 class="about-hero-title">Why We Built Hangloop</h3>
              <p class="about-hero-desc">Hangloop was created by Milan Sharma to solve the latency and audio degradation problems of standard screen-sharing tools. By utilizing Cloudflare Edge Durable Objects, Hangloop locks music playback across devices globally with sub-50ms precision.</p>
            </div>
          </div>
        </div>
      </main>
    `
  },
  {
    path: '/requests',
    title: 'Feature & YouTube Live Stream Roadmap | Hangloop',
    description: 'Submit your favorite YouTube live streams, suggest new features, and upvote community ideas on the official Hangloop roadmap.',
    canonical: 'https://hang-loop.vercel.app/requests',
    keywords: 'hangloop roadmap, live stream request, youtube live request, hangloop features',
    htmlContent: `
      <main class="subpage-wrapper">
        <div class="container">
          <nav aria-label="Breadcrumb" class="breadcrumbs-nav">
            <ol class="breadcrumbs-list">
              <li class="breadcrumb-item"><a href="/" class="breadcrumb-link"><span>Home</span></a></li>
              <li class="breadcrumb-item"><span class="breadcrumb-separator">&gt;</span><span class="breadcrumb-current">Requests</span></li>
            </ol>
          </nav>
          <header class="subpage-hero">
            <span class="section-label">💡 Community Driven</span>
            <h1 class="display subpage-title">Feature &amp; YouTube Live Stream Roadmap</h1>
            <p class="subpage-lead">Shape the future of Hangloop. Request your favorite YouTube live streams, propose new features, and upvote community ideas.</p>
          </header>
        </div>
      </main>
    `
  },
  {
    path: '/changelog',
    title: 'Hangloop Changelog & Product Release Notes | Hangloop',
    description: 'Stay updated with the latest Hangloop features, version history, edge synchronization improvements, and release notes.',
    canonical: 'https://hang-loop.vercel.app/changelog',
    keywords: 'hangloop changelog, hangloop updates, hangloop release notes',
    htmlContent: `
      <main class="subpage-wrapper">
        <div class="container">
          <nav aria-label="Breadcrumb" class="breadcrumbs-nav">
            <ol class="breadcrumbs-list">
              <li class="breadcrumb-item"><a href="/" class="breadcrumb-link"><span>Home</span></a></li>
              <li class="breadcrumb-item"><span class="breadcrumb-separator">&gt;</span><span class="breadcrumb-current">Changelog</span></li>
            </ol>
          </nav>
          <header class="subpage-hero">
            <span class="section-label">📜 Version History</span>
            <h1 class="display subpage-title">Hangloop Changelog &amp; Product Updates</h1>
            <p class="subpage-lead">Track new features, edge synchronization performance updates, and roadmap milestones.</p>
          </header>
        </div>
      </main>
    `
  },
  {
    path: '/contact',
    title: 'Contact & Community Support | Hangloop Network',
    description: 'Get in touch with the Hangloop team, report bugs, join our open developer community on GitHub, or request technical support.',
    canonical: 'https://hang-loop.vercel.app/contact',
    keywords: 'contact hangloop, hangloop support, hangloop github',
    htmlContent: `
      <main class="subpage-wrapper">
        <div class="container">
          <nav aria-label="Breadcrumb" class="breadcrumbs-nav">
            <ol class="breadcrumbs-list">
              <li class="breadcrumb-item"><a href="/" class="breadcrumb-link"><span>Home</span></a></li>
              <li class="breadcrumb-item"><span class="breadcrumb-separator">&gt;</span><span class="breadcrumb-current">Contact</span></li>
            </ol>
          </nav>
          <header class="subpage-hero">
            <span class="section-label">📬 Community &amp; Support</span>
            <h1 class="display subpage-title">Contact &amp; Connect with Hangloop</h1>
            <p class="subpage-lead">We value direct communication with our listeners and community. Whether you have feedback, need support, or want to contribute to the open-source codebase, we are here.</p>
          </header>
        </div>
      </main>
    `
  },
  {
    path: '/privacy',
    title: 'Privacy Policy | Hangloop Synchronized Music Platform',
    description: 'Review the Hangloop Privacy Policy. We respect listener privacy with zero audio tracking, no invasive third-party ad networks, and transparent edge session management.',
    canonical: 'https://hang-loop.vercel.app/privacy',
    keywords: 'hangloop privacy policy, privacy, data protection',
    htmlContent: `
      <main class="subpage-wrapper">
        <div class="container">
          <header class="subpage-hero">
            <span class="section-label">🔒 Legal</span>
            <h1 class="display subpage-title">Hangloop Privacy Policy</h1>
            <p class="subpage-lead">Hangloop is committed to protecting your privacy. We do not sell user data, track personal habits across external websites, or deploy invasive audio advertisements.</p>
          </header>
        </div>
      </main>
    `
  },
  {
    path: '/terms',
    title: 'Terms of Service | Hangloop Synchronized Music Platform',
    description: 'Review the Hangloop Terms of Service governing the use of synchronized music rooms, chat, stream requests, and mobile applications.',
    canonical: 'https://hang-loop.vercel.app/terms',
    keywords: 'hangloop terms of service, terms of use',
    htmlContent: `
      <main class="subpage-wrapper">
        <div class="container">
          <header class="subpage-hero">
            <span class="section-label">⚖️ Legal</span>
            <h1 class="display subpage-title">Hangloop Terms of Service</h1>
            <p class="subpage-lead">Guidelines governing the use of Hangloop synchronized music rooms, chat rooms, and community requests.</p>
          </header>
        </div>
      </main>
    `
  }
]

let generatedCount = 0

routes.forEach(route => {
  let html = templateHtml

  // Replace Title
  html = html.replace(/<title>.*?<\/title>/, `<title>${route.title}</title>`)
  html = html.replace(/<meta name="title" content=".*?"\/>/, `<meta name="title" content="${route.title}"/>`)
  html = html.replace(/<meta property="og:title" content=".*?"\/>/, `<meta property="og:title" content="${route.title}"/>`)
  html = html.replace(/<meta name="twitter:title" content=".*?"\/>/, `<meta name="twitter:title" content="${route.title}"/>`)

  // Replace Description
  html = html.replace(/<meta name="description" content=".*?"\/>/, `<meta name="description" content="${route.description}"/>`)
  html = html.replace(/<meta property="og:description" content=".*?"\/>/, `<meta property="og:description" content="${route.description}"/>`)
  html = html.replace(/<meta name="twitter:description" content=".*?"\/>/, `<meta name="twitter:description" content="${route.description}"/>`)

  // Replace Canonical
  html = html.replace(/<link rel="canonical" href=".*?"\/>/, `<link rel="canonical" href="${route.canonical}"/>`)
  html = html.replace(/<meta property="og:url" content=".*?"\/>/, `<meta property="og:url" content="${route.canonical}"/>`)
  html = html.replace(/<meta name="twitter:url" content=".*?"\/>/, `<meta name="twitter:url" content="${route.canonical}"/>`)

  // Inject Static Semantic Content into <div id="root">
  html = html.replace('<div id="root"></div>', `<div id="root">${route.htmlContent}</div>`)

  let targetFilePath
  if (route.path === '/') {
    targetFilePath = path.join(distDir, 'index.html')
  } else {
    const routeDir = path.join(distDir, route.path.slice(1))
    if (!fs.existsSync(routeDir)) {
      fs.mkdirSync(routeDir, { recursive: true })
    }
    targetFilePath = path.join(routeDir, 'index.html')
  }

  fs.writeFileSync(targetFilePath, html, 'utf8')
  generatedCount++
  console.log(`  ✅ Generated Prerendered HTML: ${route.path} -> ${path.relative(projectRoot, targetFilePath)}`)
})

// Also create 404.html for Vercel
const notFoundHtml = templateHtml
  .replace(/<title>.*?<\/title>/, '<title>Page Not Found (404) | Hangloop</title>')
  .replace(/<meta name="robots" content=".*?"\/>/, '<meta name="robots" content="noindex, nofollow"/>')
  .replace('<div id="root"></div>', `
    <div id="root">
      <main class="subpage-wrapper" style="min-height: 65vh; display: flex; align-items: center; justify-content: center; text-align: center;">
        <div class="container" style="max-width: 640px;">
          <h1 class="display" style="font-size: 3rem; color: #E1E0CC; margin-bottom: 16px;">Track Not Found (404)</h1>
          <p class="subpage-lead" style="margin-bottom: 24px;">The room or page you were looking for doesn't exist.</p>
          <a href="/" class="btn btn-gold" style="display: inline-block; padding: 10px 20px; background: #E1E0CC; color: #060709; text-decoration: none; border-radius: 999px; font-weight: 600;">Back to Homepage</a>
        </div>
      </main>
    </div>
  `)

fs.writeFileSync(path.join(distDir, '404.html'), notFoundHtml, 'utf8')
console.log(`  ✅ Generated Prerendered 404: 404.html`)

console.log(`\n🎉 Prerendering complete! ${generatedCount + 1} static HTML files ready with 100% crawlable content.`)
