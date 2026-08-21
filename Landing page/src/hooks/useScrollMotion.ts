import { useEffect, useRef } from 'react'

export function useScrollReveal() {
  const observed = useRef(false)

  useEffect(() => {
    if (observed.current) return
    observed.current = true
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('revealed')
      })
    }, { threshold: 0.12 })
    document.querySelectorAll('.reveal-item').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])
}

export function useScrollRevealOnUpdate(deps: unknown[]) {
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('revealed')
      })
    }, { threshold: 0.1 })
    document.querySelectorAll('.reveal-item').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, deps)
}
