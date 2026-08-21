import React, { useState } from 'react'
import { Feedback } from '../types'
import { Star, Send } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
}

export default function FeedbackModal({ open, onClose }: Props) {
  const [stars, setStars] = useState(5)
  const [text, setText] = useState('')
  const [name, setName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || !name.trim()) return

    const newFb: Feedback = {
      id: 'fb-' + Date.now(),
      name: name.trim(),
      tag: 'Community Reviewer',
      stars,
      text: text.trim(),
      date: 'Just now'
    }

    try {
      const stored = JSON.parse(localStorage.getItem('@hangloop_feedbacks') || '[]')
      const updated = [newFb, ...stored]
      localStorage.setItem('@hangloop_feedbacks', JSON.stringify(updated))
      window.dispatchEvent(new Event('storage'))
    } catch {}

    setText('')
    setName('')
    onClose()
  }

  return (
    <div className={`modal-backdrop${open ? ' active' : ''}`} id="feedback-modal" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-card" style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <h3>💬 Share Your Feedback</h3>
            <p>Tell us about your listening experience on Hangloop</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Your Rating (Select Stars)</label>
              <div className="feedback-stars-selector" id="feedback-stars-picker">
                {[1, 2, 3, 4, 5].map(val => (
                  <button
                    type="button"
                    key={val}
                    className="feedback-star-btn"
                    onClick={() => setStars(val)}
                  >
                    <Star
                      className={`w-7 h-7 ${val <= stars ? 'fill-[#F59E0B] text-[#F59E0B]' : 'text-zinc-600'}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Your Review / Message *</label>
              <textarea
                className="form-textarea"
                placeholder="How was the music synchronization and listening experience..."
                value={text}
                onChange={e => setText(e.target.value)}
                required
                maxLength={250}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Your Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Vikas Verma"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                maxLength={25}
              />
            </div>

            <button type="submit" className="btn btn-gold btn-full mt-2">
              <Send className="w-4 h-4" />
              <span>Submit Feedback</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
