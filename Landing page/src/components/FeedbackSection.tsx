import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Feedback } from '../types'
import { getAvatarUrl } from '../utils/helpers'
import { useScrollReveal } from '../hooks/useScrollMotion'
import { MessageSquare, Sparkles, Star, Quote } from 'lucide-react'

const DEFAULT_FEEDBACKS: Feedback[] = [
  {
    id: 'fb-1',
    name: 'Aarav Malhotra',
    tag: 'Verified Listener',
    stars: 5,
    text: 'Sound synchronization is absolutely flawless! Listening with friends in real-time with zero lag feels like being in the same room.',
    date: 'Today'
  },
  {
    id: 'fb-2',
    name: 'Ananya Deshmukh',
    tag: 'Daily Music Lover',
    stars: 5,
    text: 'The background audio playback on the mobile app is incredible. Even when locking the phone, the Bollywood hits keep streaming seamlessly.',
    date: 'Yesterday'
  },
  {
    id: 'fb-3',
    name: 'Kabir Sen',
    tag: 'Lo-Fi Fan',
    stars: 5,
    text: 'The clean obsidian UI and ad-free experience is next level. The live emoji reaction bursts give the room a real live party vibe!',
    date: '2 days ago'
  }
]

interface Props {
  onOpenFeedback: () => void
}

export default function FeedbackSection({ onOpenFeedback }: Props) {
  useScrollReveal()

  const [feedbacks, setFeedbacks] = useState<Feedback[]>(() => {
    try {
      const stored = localStorage.getItem('@hangloop_feedbacks')
      return stored ? JSON.parse(stored) : DEFAULT_FEEDBACKS
    } catch {
      return DEFAULT_FEEDBACKS
    }
  })

  useEffect(() => {
    const handleStorage = () => {
      try {
        const stored = localStorage.getItem('@hangloop_feedbacks')
        if (stored) setFeedbacks(JSON.parse(stored))
      } catch {}
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  return (
    <section id="feedback" className="section-wrap">
      <div className="container">
        {/* Section Header */}
        <div className="section-header reveal-item">
          <span className="section-label">⭐ Listener Reviews &amp; Ratings</span>
          <h2 className="display section-title">What Our Listeners Say</h2>
          <p className="section-sub">
            Real feedback from our global community of music enthusiasts and friends jamming together.
          </p>
        </div>

        {/* Feedbacks Grid */}
        <div className="feedback-grid" id="feedbacks-container">
          {feedbacks.map(fb => {
            const avatar = getAvatarUrl(fb.name)

            return (
              <div className="feedback-card reveal-item" key={fb.id}>
                <div className="feedback-quote-icon">
                  <Quote className="w-5 h-5" />
                </div>
                <div className="feedback-header">
                  <img src={avatar} alt={fb.name} className="feedback-avatar" />
                  <div>
                    <div className="feedback-user">{fb.name}</div>
                    <div className="feedback-tag">{fb.tag || 'Verified Listener'}</div>
                  </div>
                </div>
                <div className="feedback-stars-row">
                  {[...Array(fb.stars || 5)].map((_, i) => (
                    <Star key={i} className="feedback-star-icon" />
                  ))}
                </div>
                <p className="feedback-text">"{fb.text}"</p>
                <div className="feedback-date">{fb.date || 'Recent'}</div>
              </div>
            )
          })}
        </div>

        {/* Action Banner for Feedback & Feature Requests */}
        <div className="request-cta-banner reveal-item">
          <div className="request-cta-info">
            <h3 className="request-cta-title">
              💡 Have a Feature Idea or Song Request?
            </h3>
            <p className="request-cta-desc">
              Our engineering team is constantly building new features for Hangloop. Submit your ideas or vote on community requests!
            </p>
          </div>
          <div className="request-cta-actions">
            <button className="btn btn-ghost" onClick={onOpenFeedback}>
              <MessageSquare className="w-4 h-4" />
              <span>Give Feedback</span>
            </button>
            <Link to="/requests" className="btn btn-gold">
              <Sparkles className="w-4 h-4" />
              <span>Feature Requests &rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
