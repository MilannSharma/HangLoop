import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { StreamRequest } from '../types'
import { useScrollReveal } from '../hooks/useScrollMotion'
import { Send, Radio, ExternalLink, ArrowRight, Sparkles } from 'lucide-react'

const DEFAULT_STREAM_REQUESTS: StreamRequest[] = [
  {
    id: 'sr-1',
    title: '24/7 Lofi Girl & Chill Beats Radio',
    url: 'https://www.youtube.com/live/jfKfPfyJRdk',
    genre: 'LOFI_CHILL',
    author: 'Riya Gupta',
    status: 'UNDER_REVIEW'
  },
  {
    id: 'sr-2',
    title: 'Coke Studio Pakistan Live Jam',
    url: 'https://www.youtube.com/watch?v=5Eqb_-j3FDA',
    genre: 'INDIE',
    author: 'Farhan Ali',
    status: 'PLANNED'
  },
  {
    id: 'sr-3',
    title: 'Bhakti Sagar 24/7 Morning Bhajans',
    url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
    genre: 'DEVOTIONAL',
    author: 'Sunil Sharma',
    status: 'APPROVED'
  }
]

export default function RequestStreamSection() {
  useScrollReveal()

  const [streamRequests, setStreamRequests] = useState<StreamRequest[]>(() => {
    try {
      const stored = localStorage.getItem('@hangloop_stream_requests')
      return stored ? JSON.parse(stored) : DEFAULT_STREAM_REQUESTS
    } catch {
      return DEFAULT_STREAM_REQUESTS
    }
  })

  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [genre, setGenre] = useState('BOLLYWOOD')
  const [name, setName] = useState('')
  const [alertInfo, setAlertInfo] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedUrl = url.trim()
    const trimmedTitle = title.trim()
    const trimmedName = name.trim()

    if (!trimmedUrl || !trimmedTitle || !trimmedName) return

    if (!trimmedUrl.includes('youtube.com') && !trimmedUrl.includes('youtu.be')) {
      setAlertInfo({ msg: 'Kripya valid YouTube video ya live stream URL enter karein.', type: 'error' })
      return
    }

    setSubmitting(true)

    const newReq: StreamRequest = {
      id: 'sr-' + Date.now(),
      title: trimmedTitle,
      url: trimmedUrl,
      genre,
      author: trimmedName,
      status: 'UNDER_REVIEW'
    }

    const updated = [newReq, ...streamRequests]
    setStreamRequests(updated)

    try {
      localStorage.setItem('@hangloop_stream_requests', JSON.stringify(updated))
    } catch {}

    try {
      const fullReqs = JSON.parse(localStorage.getItem('@hangloop_requests_data') || '[]')
      fullReqs.unshift({
        id: 'req-' + Date.now(),
        title: `[Live Stream] ${trimmedTitle}`,
        desc: `YouTube Live Stream Request: ${trimmedUrl} (${genre})`,
        type: 'YOUTUBE_LIVE',
        status: 'REVIEW',
        author: trimmedName,
        authorAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(trimmedName)}`,
        votes: 1,
        createdAt: 'Just now',
        youtubeUrl: trimmedUrl
      })
      localStorage.setItem('@hangloop_requests_data', JSON.stringify(fullReqs))
    } catch {}

    setAlertInfo({ msg: 'Shukriya! Aapka YouTube live stream request review ke liye submit ho gaya hai.', type: 'success' })
    setUrl('')
    setTitle('')
    setName('')
    setSubmitting(false)
  }

  return (
    <section id="request-stream" className="section-wrap">
      <div className="container">
        {/* Section Header */}
        <div className="section-header reveal-item">
          <span className="section-label">🔴 Add Your Favorite Stream</span>
          <h2 className="display section-title">Request a YouTube Live Stream</h2>
          <p className="section-sub">
            Do you have a favorite 24/7 stream or music channel you want to listen to synchronously with friends? Submit the link below and our team will create a live room!
          </p>
        </div>

        {/* 2-Column Layout */}
        <div className="req-stream-layout reveal-item">
          
          {/* Left Column: Request Form Card */}
          <div className="req-stream-form-card">
            <div className="req-stream-card-header">
              <div className="req-stream-icon-box">
                <Radio className="w-5 h-5 text-[#E1E0CC]" />
              </div>
              <div>
                <h3 className="req-stream-card-title">YouTube Live Stream Request Form</h3>
                <p className="req-stream-card-sub">Directly request any YouTube Live URL on Hangloop</p>
              </div>
            </div>

            {alertInfo && (
              <div className={`form-alert ${alertInfo.type}`} style={{ display: 'block' }}>
                {alertInfo.msg}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">YouTube Live Stream URL *</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://www.youtube.com/watch?v=... or https://youtube.com/live/..."
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  required
                />
                <div className="form-hint">Enter any official YouTube live stream or radio broadcast link.</div>
              </div>

              <div className="form-group">
                <label className="form-label">Stream / Channel Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Lofi Girl 24/7 / Coke Studio Live"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                  maxLength={60}
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Category / Genre</label>
                  <select className="form-select" value={genre} onChange={e => setGenre(e.target.value)}>
                    <option value="BOLLYWOOD">Bollywood / Hindi</option>
                    <option value="LOFI_CHILL">Lo-Fi &amp; Chill</option>
                    <option value="PUNJABI">Punjabi Hits</option>
                    <option value="DEVOTIONAL">Bhajan / Devotional</option>
                    <option value="RETRO">Retro 90s Classics</option>
                    <option value="INDIE">Indie / Pop / Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Your Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Aman Sharma"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    maxLength={25}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-gold btn-full mt-2"
                disabled={submitting}
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Submitting Request...' : 'Submit Live Stream Request'}</span>
              </button>
            </form>
          </div>

          {/* Right Column: Community Requests Feed */}
          <div className="req-stream-feed-col">
            <div className="req-stream-feed-header">
              <h4 className="req-stream-feed-title">Community Requested Streams</h4>
              <Link to="/requests" className="req-stream-view-all">
                <span>View All Requests</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="req-stream-cards-list">
              {streamRequests.slice(0, 4).map(sr => {
                let statusTag = (
                  <span className="request-status-pill status-review">
                    Under Review
                  </span>
                )
                if (sr.status === 'APPROVED') {
                  statusTag = (
                    <span className="request-status-pill status-planned">
                      Approved &bull; Live Soon
                    </span>
                  )
                }

                return (
                  <div className="stream-req-item-card" key={sr.id}>
                    <div className="stream-req-item-content">
                      <div className="stream-req-item-meta">
                        <span className="stream-req-genre-tag">
                          {sr.genre || 'STREAM'}
                        </span>
                        {statusTag}
                      </div>
                      <div className="stream-req-item-title">
                        {sr.title}
                      </div>
                      <div className="stream-req-item-footer">
                        <span>By {sr.author}</span> &bull;
                        <a
                          href={sr.url}
                          target="_blank"
                          rel="noreferrer"
                          className="stream-req-link"
                        >
                          <span>YouTube Link</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    </div>
                    <div className="stream-req-live-icon">🔴</div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
