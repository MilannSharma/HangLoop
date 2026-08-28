import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

console.log('🚀 Starting Hangloop Comprehensive Technical SEO & AEO Verification...\n')

let totalChecks = 0
let passedChecks = 0
let failedChecks = 0

function assert(condition, message) {
  totalChecks++
  if (condition) {
    passedChecks++
    console.log(`  ✅ PASS: ${message}`)
  } else {
    failedChecks++
    console.error(`  ❌ FAIL: ${message}`)
  }
}

// 1. Check robots.txt
console.log('📋 1. Checking public/robots.txt...')
const robotsPath = path.join(projectRoot, 'public', 'robots.txt')
assert(fs.existsSync(robotsPath), 'robots.txt exists in public/')
if (fs.existsSync(robotsPath)) {
  const robotsContent = fs.readFileSync(robotsPath, 'utf8')
  assert(robotsContent.includes('Sitemap: https://hang-loop.vercel.app/sitemap.xml'), 'robots.txt contains correct sitemap reference')
  assert(robotsContent.includes('User-agent: Googlebot'), 'robots.txt explicitly allows Googlebot')
  assert(robotsContent.includes('User-agent: GPTBot') || robotsContent.includes('User-agent: *'), 'robots.txt allows AI crawlers')
  assert(robotsContent.includes('Disallow: /api/'), 'robots.txt blocks private API routes')
  assert(robotsContent.includes('Disallow: /room/private/'), 'robots.txt protects private room URLs')
}

// 2. Check sitemap.xml
console.log('\n🗺️ 2. Checking public/sitemap.xml...')
const sitemapPath = path.join(projectRoot, 'public', 'sitemap.xml')
assert(fs.existsSync(sitemapPath), 'sitemap.xml exists in public/')
if (fs.existsSync(sitemapPath)) {
  const sitemapContent = fs.readFileSync(sitemapPath, 'utf8')
  const expectedRoutes = [
    'https://hang-loop.vercel.app/',
    'https://hang-loop.vercel.app/listen-to-music-with-friends',
    'https://hang-loop.vercel.app/music-rooms',
    'https://hang-loop.vercel.app/synchronized-music',
    'https://hang-loop.vercel.app/how-it-works',
    'https://hang-loop.vercel.app/features',
    'https://hang-loop.vercel.app/faq',
    'https://hang-loop.vercel.app/about',
    'https://hang-loop.vercel.app/requests',
    'https://hang-loop.vercel.app/changelog',
    'https://hang-loop.vercel.app/contact',
    'https://hang-loop.vercel.app/privacy',
    'https://hang-loop.vercel.app/terms'
  ]

  expectedRoutes.forEach(url => {
    assert(sitemapContent.includes(`<loc>${url}</loc>`), `sitemap.xml indexes canonical URL: ${url}`)
  })
}

// 3. Check site.webmanifest
console.log('\n📱 3. Checking public/site.webmanifest...')
const manifestPath = path.join(projectRoot, 'public', 'site.webmanifest')
assert(fs.existsSync(manifestPath), 'site.webmanifest exists in public/')
if (fs.existsSync(manifestPath)) {
  try {
    const manifestJson = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    assert(manifestJson.name === 'Hangloop — Live Synchronized Music Rooms', 'webmanifest has valid name')
    assert(manifestJson.short_name === 'Hangloop', 'webmanifest has valid short_name')
    assert(manifestJson.start_url === '/', 'webmanifest has start_url')
    assert(manifestJson.icons && manifestJson.icons.length > 0, 'webmanifest has icons defined')
  } catch (err) {
    assert(false, `site.webmanifest is valid JSON: ${err.message}`)
  }
}

// 4. Check index.html base tags & Schema.org Graph
console.log('\n🏷️ 4. Checking index.html static markup & Schema.org JSON-LD...')
const indexHtmlPath = path.join(projectRoot, 'index.html')
assert(fs.existsSync(indexHtmlPath), 'index.html exists')
if (fs.existsSync(indexHtmlPath)) {
  const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8')
  assert(indexHtml.includes('<link rel="canonical" href="https://hang-loop.vercel.app/"/>'), 'index.html contains canonical URL')
  assert(indexHtml.includes('name="robots" content="index, follow'), 'index.html contains robots meta directive')
  assert(indexHtml.includes('property="og:title"'), 'index.html contains Open Graph og:title')
  assert(indexHtml.includes('name="twitter:card"'), 'index.html contains twitter:card')
  assert(indexHtml.includes('"@type": "Organization"'), 'index.html contains Schema.org Organization')
  assert(indexHtml.includes('"@type": "WebSite"'), 'index.html contains Schema.org WebSite')
  assert(indexHtml.includes('"@type": "WebApplication"'), 'index.html contains Schema.org WebApplication')
  assert(indexHtml.includes('<noscript>'), 'index.html contains noscript crawler fallback for non-JS bots')
}

// 5. Check Pages & Component Implementations
console.log('\n🧩 5. Checking Subpages & Components Existence...')
const requiredPages = [
  'src/pages/HomePage.tsx',
  'src/pages/ListenTogetherPage.tsx',
  'src/pages/MusicRoomsPage.tsx',
  'src/pages/SynchronizedMusicPage.tsx',
  'src/pages/HowItWorksPage.tsx',
  'src/pages/FeaturesPage.tsx',
  'src/pages/FAQPage.tsx',
  'src/pages/AboutPage.tsx',
  'src/pages/ChangelogPage.tsx',
  'src/pages/ContactPage.tsx',
  'src/pages/PrivacyPage.tsx',
  'src/pages/TermsPage.tsx',
  'src/pages/RequestsPage.tsx',
  'src/pages/NotFoundPage.tsx',
  'src/components/SEOHead.tsx',
  'src/components/Breadcrumbs.tsx',
  'src/components/AEOAnswerBox.tsx',
  'src/components/ScrollToTop.tsx'
]

requiredPages.forEach(fileRel => {
  const fullPath = path.join(projectRoot, fileRel)
  assert(fs.existsSync(fullPath), `Component/Page file exists: ${fileRel}`)
})

// Summary
console.log('\n══════════════════════════════════════════════════════════════')
console.log(`🏁 Verification Finished: ${passedChecks}/${totalChecks} checks passed (${failedChecks} failed).`)
console.log('══════════════════════════════════════════════════════════════\n')

if (failedChecks > 0) {
  process.exit(1)
}
