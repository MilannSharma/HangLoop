import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useScrollReveal } from '../hooks/useScrollMotion'
import { getAvatarUrl } from '../utils/helpers'
import { Plus, Search, Sparkles, ExternalLink, ThumbsUp, Radio, Music, Layout, ArrowLeft } from 'lucide-react'

interface RequestItem {
  id: string
  title: string
  desc: string
  type: 'YOUTUBE_LIVE' | 'FEATURE' | 'SONG' | 'UI'
  status: 'IN_PROGRESS' | 'PLANNED' | 'REVIEW'
  youtubeUrl?: string
  author: string
  authorAvatar?: string
  votes: number
  createdAt: string
}

const DEFAULT_REQUESTS: RequestItem[] = [
  {
    id: 'req-yt-1',
    title: '24/7 Lofi Girl & Chill Beats Radio Stream',
    desc: 'Add Lofi Girl official 24/7 live stream as a permanent synchronized live room for study and focus sessions.',
    type: 'YOUTUBE_LIVE',
    status: 'PLANNED',
    youtubeUrl: 'https://www.youtube.com/live/jfKfPfyJRdk',
    author: 'Riya Gupta',
    authorAvatar: getAvatarUrl('Riya'),
    votes: 49,
    createdAt: '1 day ago'
  },
  {
    id: 'req-yt-2',
    title: 'Coke Studio Season Hits 24/7 Live Jam',
    desc: 'Dedicated 24/7 live room streaming acoustic, fusion, and coke studio all-time superhits.',
    type: 'YOUTUBE_LIVE',
    status: 'IN_PROGRESS',
    youtubeUrl: 'https://www.youtube.com/watch?v=5Eqb_-j3FDA',
    author: 'Farhan Ali',
    authorAvatar: getAvatarUrl('Farhan'),
    votes: 44,
    createdAt: '2 days ago'
  },
  {
    id: 'req-1',
    title: 'Bass Boost & Custom Audio Equalizer',
    desc: 'Integrated equalizer inside the room player with bass boost, treble control, and custom acoustic presets.',
    type: 'FEATURE',
    status: 'IN_PROGRESS',
    author: 'Rohan Verma',
    authorAvatar: getAvatarUrl('Rohan'),
    votes: 42,
    createdAt: '2 days ago'
  },
  {
    id: 'req-2',
    title: 'Spotify & YouTube Music Playlist Importer',
    desc: 'Directly import and queue public Spotify playlists or YouTube tracks into the synchronized room queue.',
    type: 'FEATURE',
    status: 'PLANNED',
    author: 'Sneha Kapoor',
    authorAvatar: getAvatarUrl('Sneha'),
    votes: 38,
    createdAt: '3 days ago'
  },
  {
    id: 'req-3',
    title: 'Sleep Timer with Auto-Pause',
    desc: 'Smart 30min / 60min sleep timer to gently fade out and pause music audio automatically at night.',
    type: 'FEATURE',
    status: 'IN_PROGRESS',
    author: 'Arjun Mehta',
    authorAvatar: getAvatarUrl('Arjun'),
    votes: 35,
    createdAt: '4 days ago'
  },
  {
    id: 'req-4',
    title: '90s Evergreen Bollywood Hits 24/7 Station',
    desc: 'Continuous synchronized station for golden 90s Kishore Kumar, Kumar Sanu, and Alka Yagnik classics.',
    type: 'SONG',
    status: 'PLANNED',
    author: 'Pooja Roy',
    authorAvatar: getAvatarUrl('Pooja'),
    votes: 24,
    createdAt: '1 week ago'
  }
]

const STORAGE_KEY = '@hangloop_requests_data'
const VOTES_KEY = '@hangloop_request_upvotes'

export default function RequestsPage() {
  useScrollReveal()

  const [requests, setRequests] = useState<RequestItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        let list: RequestItem[] = JSON.parse(stored)
        list = list.filter(r => !(r.title && r.title.toLowerCase().includes('private room')))
        return list.length > 0 ? list : DEFAULT_REQUESTS
      }
      return DEFAULT_REQUESTS
    } catch {
      return DEFAULT_REQUESTS
    }
  })

  const [votedList, setVotedList] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(VOTES_KEY) || '[]')
    } catch {
      return []
    }
  })

  const [activeFilter, setActiveFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  // Form State
  const [reqType, setReqType] = useState<'YOUTUBE_LIVE' | 'FEATURE' | 'SONG' | 'UI'>('YOUTUBE_LIVE')
  const [reqUrl, setReqUrl] = useState('')
  const [reqTitle, setReqTitle] = useState('')
  const [reqDesc, setReqDesc] = useState('')
  const [reqName, setReqName] = useState('')

  const handleUpvote = (id: string) => {
    const hasVoted = votedList.includes(id)
    let newVoted: string[]
    let newRequests: RequestItem[]

    if (hasVoted) {
      newVoted = votedList.filter(v => v !== id)
      newRequests = requests.map(r => r.id === id ? { ...r, votes: Math.max(0, r.votes - 1) } : r)
    } else {
      newVoted = [...votedList, id]
      newRequests = requests.map(r => r.id === id ? { ...r, votes: r.votes + 1 } : r)
    }

    setVotedList(newVoted)
    setRequests(newRequests)
    try {
      localStorage.setItem(VOTES_KEY, JSON.stringify(newVoted))
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newRequests))
    } catch {}
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reqTitle.trim() || !reqDesc.trim() || !reqName.trim()) return

    const newItem: RequestItem = {
      id: 'req-' + Date.now(),
      title: reqTitle.trim(),
      desc: reqDesc.trim(),
      type: reqType,
      status: 'REVIEW',
      youtubeUrl: reqUrl.trim() || undefined,
      author: reqName.trim(),
      authorAvatar: getAvatarUrl(reqName.trim()),
      votes: 1,
      createdAt: 'Just now'
    }

    const updated = [newItem, ...requests]
    const updatedVotes = [...votedList, newItem.id]

    setRequests(updated)
    setVotedList(updatedVotes)

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      localStorage.setItem(VOTES_KEY, JSON.stringify(updatedVotes))
    } catch {}

    setReqTitle('')
    setReqDesc('')
    setReqUrl('')
    setReqName('')
    setModalOpen(false)
  }

  const filteredRequests = requests.filter(r => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.author.toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false

    if (activeFilter === 'ALL') return true
    if (activeFilter === 'YOUTUBE_LIVE') return r.type === 'YOUTUBE_LIVE' || (r.title && r.title.includes('Stream'))
    if (activeFilter === 'FEATURE') return r.type === 'FEATURE'
    if (activeFilter === 'SONG') return r.type === 'SONG'
    if (activeFilter === 'IN_PROGRESS') return r.status === 'IN_PROGRESS'
    if (activeFilter === 'PLANNED') return r.status === 'PLANNED'
    return true
  })

  return (
    <main style={{ paddingTop: '80px' }}>
      {/* Requests Hero */}
      <section className="requests-hero">
        <div className="container">
          <span className="requests-badge">Community Roadmap &amp; Stream Requests</span>
          <h1 className="display requests-title">
            Feature &amp; Live Stream Roadmap
          </h1>
          <p className="requests-sub">
            Shape the future of Hangloop. Request your favorite YouTube live streams, propose new features, and upvote community ideas.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section style={{ paddingBottom: '60px' }}>
        <div className="container">
          {/* Search & Action Bar */}
          <div className="requests-bar-row">
            <div className="requests-search-wrap">
              <Search className="requests-search-icon" />
              <input
                type="text"
                className="form-input requests-search-input"
                placeholder="Search ideas &amp; streams..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <button className="btn btn-gold btn-sm" onClick={() => setModalOpen(true)}>
              <Plus className="w-4 h-4" />
              <span>Submit New Request</span>
            </button>
          </div>

          {/* Filter Pills */}
          <div className="requests-controls">
            <div className="filter-tabs">
              {[
                { id: 'ALL', label: 'All Requests' },
                { id: 'YOUTUBE_LIVE', label: '🔴 YouTube Live' },
                { id: 'FEATURE', label: '✨ Features' },
                { id: 'SONG', label: '🎵 Songs' },
                { id: 'IN_PROGRESS', label: '⚡ In Progress' },
                { id: 'PLANNED', label: '📌 Planned' }
              ].map(tab => (
                <button
                  key={tab.id}
                  className={`filter-btn${activeFilter === tab.id ? ' active' : ''}`}
                  onClick={() => setActiveFilter(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Requests Grid */}
          <div className="requests-grid" id="requests-container">
            {filteredRequests.length === 0 ? (
              <div className="streams-empty-box" style={{ gridColumn: '1/-1' }}>
                <p className="streams-empty-title">No matching requests found.</p>
                <p className="streams-empty-text">Be the first to submit this request!</p>
                <button className="btn btn-gold btn-sm" onClick={() => setModalOpen(true)}>
                  <Plus className="w-4 h-4" />
                  <span>Submit New Request</span>
                </button>
              </div>
            ) : (
              filteredRequests.map(req => {
                const isVoted = votedList.includes(req.id)
                let typeBadgeClass = 'badge-feature'
                let typeLabel = 'FEATURE'

                if (req.type === 'YOUTUBE_LIVE') { typeBadgeClass = 'badge-live'; typeLabel = '🔴 YOUTUBE LIVE' }
                else if (req.type === 'SONG') { typeBadgeClass = 'badge-song'; typeLabel = '🎵 SONG' }
                else if (req.type === 'UI') { typeBadgeClass = 'badge-ui'; typeLabel = '🎨 UI' }

                let statusClass = 'status-review'
                let statusLabel = 'Under Review'
                if (req.status === 'IN_PROGRESS') { statusClass = 'status-in-progress'; statusLabel = 'In Progress' }
                else if (req.status === 'PLANNED') { statusClass = 'status-planned'; statusLabel = 'Planned' }

                return (
                  <div className="request-card" key={req.id}>
                    <div className="request-card-header">
                      <span className={`request-type-badge ${typeBadgeClass}`}>{typeLabel}</span>
                      <span className={`request-status-pill ${statusClass}`}>● {statusLabel}</span>
                    </div>

                    <h3 className="request-card-title">{req.title}</h3>
                    <p className="request-card-desc">{req.desc}</p>

                    {req.youtubeUrl && (
                      <div className="request-link-box">
                        <span style={{ color: 'var(--text-dim)' }}>Stream:</span>
                        <a href={req.youtubeUrl} target="_blank" rel="noreferrer" className="flex-link">
                          <span>{req.youtubeUrl}</span>
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      </div>
                    )}

                    <div className="request-card-footer">
                      <div className="request-user-info">
                        <img src={req.authorAvatar || getAvatarUrl(req.author)} className="request-avatar" alt={req.author} />
                        <div>
                          <div className="request-username">{req.author}</div>
                          <div className="request-time">{req.createdAt}</div>
                        </div>
                      </div>

                      <button
                        className={`upvote-btn${isVoted ? ' voted' : ''}`}
                        onClick={() => handleUpvote(req.id)}
                        title={isVoted ? 'Remove upvote' : 'Upvote this request'}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{req.votes}</span>
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer-wrap">
        <div className="container">
          <div className="footer-inner">
            <div className="footer-brand">
              <img src="/logo-gold.png" alt="Hangloop" width={22} height={22} />
              <span className="footer-brand-name">Hangloop Requests</span>
            </div>
            <p className="footer-copy">&copy; 2026 Hangloop. Built for synchronized music streaming.</p>
            <Link to="/" className="btn btn-ghost btn-sm">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </footer>

      {/* Submit Modal */}
      <div className={`modal-backdrop${modalOpen ? ' active' : ''}`} onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
        <div className="modal-card">
          <div className="modal-header">
            <div className="modal-title-wrap">
              <h3>Submit Feature / Stream Request</h3>
              <p>Your suggestion will be added to the public roadmap</p>
            </div>
            <button className="modal-close-btn" onClick={() => setModalOpen(false)}>&times;</button>
          </div>

          <div className="modal-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Request Type</label>
                <select className="form-select" value={reqType} onChange={e => setReqType(e.target.value as any)}>
                  <option value="YOUTUBE_LIVE">🔴 YouTube Live Stream Request</option>
                  <option value="FEATURE">✨ New App Feature</option>
                  <option value="SONG">🎵 Song / Playlist Request</option>
                  <option value="UI">🎨 UI / Design Enhancement</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">YouTube Live Stream URL (Optional)</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://www.youtube.com/watch?v=... or https://youtube.com/live/..."
                  value={reqUrl}
                  onChange={e => setReqUrl(e.target.value)}
                />
                <div className="form-hint">Enter the YouTube live link you want added to Hangloop.</div>
              </div>

              <div className="form-group">
                <label className="form-label">Request Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 24/7 Lofi Girl / Bass Boost Equalizer"
                  value={reqTitle}
                  onChange={e => setReqTitle(e.target.value)}
                  required
                  maxLength={60}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Details / Description *</label>
                <textarea
                  className="form-textarea"
                  placeholder="Describe why this stream or feature should be added..."
                  value={reqDesc}
                  onChange={e => setReqDesc(e.target.value)}
                  required
                  maxLength={250}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Your Name / Username *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Aman Sharma"
                  value={reqName}
                  onChange={e => setReqName(e.target.value)}
                  required
                  maxLength={25}
                />
              </div>

              <button type="submit" className="btn btn-gold btn-full mt-2">
                Submit Request
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}
