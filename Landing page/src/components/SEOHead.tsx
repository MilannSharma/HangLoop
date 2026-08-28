import { useEffect } from 'react'

export interface SEOHeadProps {
  title: string
  description: string
  canonicalUrl?: string
  ogType?: string
  ogImage?: string
  keywords?: string
  noindex?: boolean
  jsonLd?: object | object[]
}

const BASE_URL = 'https://hang-loop.vercel.app'
const DEFAULT_IMAGE = `${BASE_URL}/logo-gold.png`

export default function SEOHead({
  title,
  description,
  canonicalUrl,
  ogType = 'website',
  ogImage = DEFAULT_IMAGE,
  keywords,
  noindex = false,
  jsonLd
}: SEOHeadProps) {
  useEffect(() => {
    // 1. Document Title
    const fullTitle = title.includes('Hangloop') ? title : `${title} | Hangloop`
    document.title = fullTitle

    // Helper to set or create meta tag
    const setMeta = (nameAttr: string, nameVal: string, contentVal: string) => {
      let meta = document.querySelector(`meta[${nameAttr}="${nameVal}"]`)
      if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute(nameAttr, nameVal)
        document.head.appendChild(meta)
      }
      meta.setAttribute('content', contentVal)
    }

    // 2. Primary Meta Tags
    setMeta('name', 'description', description)
    setMeta('name', 'title', fullTitle)
    if (keywords) {
      setMeta('name', 'keywords', keywords)
    }
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1')

    // 3. Canonical Link
    const currentCanonical = canonicalUrl || (typeof window !== 'undefined' ? `${BASE_URL}${window.location.pathname}` : BASE_URL)
    let canonicalLink = document.querySelector('link[rel="canonical"]')
    if (!canonicalLink) {
      canonicalLink = document.createElement('link')
      canonicalLink.setAttribute('rel', 'canonical')
      document.head.appendChild(canonicalLink)
    }
    canonicalLink.setAttribute('href', currentCanonical)

    // 4. Open Graph Tags
    setMeta('property', 'og:title', fullTitle)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', currentCanonical)
    setMeta('property', 'og:type', ogType)
    setMeta('property', 'og:image', ogImage)
    setMeta('property', 'og:site_name', 'Hangloop')

    // 5. Twitter Card Tags
    setMeta('name', 'twitter:card', 'summary_large_image')
    setMeta('name', 'twitter:title', fullTitle)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'twitter:url', currentCanonical)
    setMeta('name', 'twitter:image', ogImage)

    // 6. Inject / Update Page-Specific JSON-LD Schema
    const existingScript = document.getElementById('page-jsonld-schema')
    if (existingScript) {
      existingScript.remove()
    }

    if (jsonLd) {
      const script = document.createElement('script')
      script.id = 'page-jsonld-schema'
      script.type = 'application/ld+json'
      script.textContent = JSON.stringify(jsonLd)
      document.head.appendChild(script)
    }

    return () => {
      const script = document.getElementById('page-jsonld-schema')
      if (script) {
        script.remove()
      }
    }
  }, [title, description, canonicalUrl, ogType, ogImage, keywords, noindex, jsonLd])

  return null
}
