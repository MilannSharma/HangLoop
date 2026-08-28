import { Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

export interface BreadcrumbItem {
  name: string
  path: string
}

interface Props {
  items: BreadcrumbItem[]
}

export default function Breadcrumbs({ items }: Props) {
  const allItems = [{ name: 'Home', path: '/' }, ...items]

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': allItems.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.name,
      'item': `https://hang-loop.vercel.app${item.path === '/' ? '' : item.path}`
    }))
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <nav aria-label="Breadcrumb" className="breadcrumbs-nav">
        <ol className="breadcrumbs-list">
          {allItems.map((item, idx) => {
            const isLast = idx === allItems.length - 1
            return (
              <li key={item.path} className="breadcrumb-item">
                {idx > 0 && <ChevronRight className="breadcrumb-separator" />}
                {isLast ? (
                  <span className="breadcrumb-current" aria-current="page">
                    {item.name}
                  </span>
                ) : (
                  <Link to={item.path} className="breadcrumb-link">
                    {idx === 0 && <Home className="breadcrumb-home-icon" />}
                    <span>{item.name}</span>
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
    </>
  )
}
