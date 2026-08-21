import React, { useState, useEffect, useRef } from 'react'
import { LiveRoom, User, ChatMessage, WSMessage } from '../types'
import { WS_BASE } from '../config'
import { getAvatarUrl, getThumbnail } from '../utils/helpers'
import { Radio, Users, Send, Sparkles } from 'lucide-react'

interface Props {
  open: boolean
  room: LiveRoom
  currentUser: User | null
  authToken: string | null
  onClose: () => void
}

export default function PlayerModal({ open, room, currentUser, onClose }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [viewersCount, setViewersCount] = useState<number>(room.active_viewers || 1)
  const [trackTitle, setTrackTitle] = useState(room.current_title || 'Loading live song...')
  const [trackArtist, setTrackArtist] = useState(room.current_artist || 'Live Synced')
  const [trackThumb, setTrackThumb] = useState(getThumbnail(room))
  const [connected, setConnected] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)
  const chatBoxRef = useRef<HTMLDivElement>(null)
  const playerContainerRef = useRef<HTMLDivElement>(null)
  const flyingContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll chat box
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight
    }
  }, [messages])

  // Setup WebSocket & YouTube embed
  useEffect(() => {
    if (!open) return

    setMessages([
      {
        text: `Welcome to ${room.name}! Jamming synchronously in real-time.`,
        isSystem: true
      }
    ])

    const user = currentUser || {
      id: 'guest-' + Date.now(),
      username: 'Guest',
      full_name: 'Guest User',
      avatar_url: getAvatarUrl('Guest')
    }

    const wsUrl = `${WS_BASE}/${room.id}?userId=${encodeURIComponent(user.id)}&username=${encodeURIComponent(user.username)}&fullName=${encodeURIComponent(user.full_name || user.username)}&avatarUrl=${encodeURIComponent(user.avatar_url || '')}`

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => setConnected(true)
      ws.onclose = () => setConnected(false)
      ws.onerror = () => setConnected(false)

      ws.onmessage = (event) => {
        try {
          const data: WSMessage = JSON.parse(event.data)
          handleWSMessage(data)
        } catch {}
      }
    } catch {}

    return () => {
      if (wsRef.current) {
        try { wsRef.current.close() } catch {}
        wsRef.current = null
      }
    }
  }, [open, room.id])

  const handleWSMessage = (msg: WSMessage) => {
    if (!msg || !msg.type) return

    switch (msg.type) {
      case 'INIT_STATE':
        if (msg.playbackState?.currentVideo) {
          const v = msg.playbackState.currentVideo
          setTrackTitle(v.title || 'Live Track')
          setTrackArtist(v.artist ? `${v.artist} • Synced` : 'Hangloop Live')
          if (v.thumbnail) setTrackThumb(v.thumbnail)
        }
        if (msg.members) {
          setViewersCount(Math.max(1, msg.members.length))
        }
        if (msg.chatLogs && Array.isArray(msg.chatLogs)) {
          setMessages(prev => [...prev, ...msg.chatLogs!])
        }
        break

      case 'TRACK_CHANGED':
      case 'SYNC_TIMELINE':
        if (msg.playbackState?.currentVideo) {
          const v = msg.playbackState.currentVideo
          setTrackTitle(v.title || 'Live Track')
          setTrackArtist(v.artist ? `${v.artist} • Synced` : 'Hangloop Live')
          if (v.thumbnail) setTrackThumb(v.thumbnail)
        }
        break

      case 'CHAT_MESSAGE':
        if (msg.message) {
          setMessages(prev => [...prev, msg.message!])
        }
        break

      case 'MEMBER_JOINED':
      case 'MEMBER_LEFT':
        if (typeof msg.activeCount === 'number') {
          setViewersCount(Math.max(1, msg.activeCount))
        }
        break

      case 'REACTION_BURST':
        triggerFlyingEmoji(msg.emoji || '🔥')
        break
    }
  }

  const triggerFlyingEmoji = (emoji: string) => {
    if (!flyingContainerRef.current) return
    const el = document.createElement('div')
    el.className = 'flying-reaction'
    el.innerText = emoji
    el.style.left = `${Math.floor(Math.random() * 60) + 20}%`
    flyingContainerRef.current.appendChild(el)
    setTimeout(() => {
      try { el.remove() } catch {}
    }, 2100)
  }

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault()
    const text = chatInput.trim()
    if (!text || !wsRef.current) return

    wsRef.current.send(JSON.stringify({
      type: 'CHAT_MESSAGE',
      text,
      clientMessageId: 'web-' + Date.now()
    }))

    setChatInput('')
  }

  const sendReaction = (emoji: string) => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({
        type: 'REACTION_BURST',
        emoji
      }))
    }
    triggerFlyingEmoji(emoji)
  }

  const videoId = room.current_video_id || 'jfKfPfyJRdk'

  return (
    <div className={`modal-backdrop${open ? ' active' : ''}`} id="player-modal" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-card player-modal-card">
        <div className="player-header">
          <div className="player-room-info">
            <span className="live-tag">
              <span className="live-tag-dot" /> LIVE
            </span>
            <span className="player-room-title">{room.name}</span>
            <span className="stream-theme-tag" style={{ margin: 0, padding: '2px 8px', borderRadius: 4, background: 'rgba(225,224,204,0.08)' }}>
              {room.theme || 'MUSIC'}
            </span>
          </div>
          <div className="player-header-actions">
            <div className="player-live-count">
              <Users className="w-3.5 h-3.5" />
              <span>{viewersCount} Listening</span>
            </div>
            <button className="modal-close-btn" onClick={onClose}>&times;</button>
          </div>
        </div>

        <div className="player-main-layout">
          {/* Left Player Side */}
          <div className="player-left">
            <div className="video-container" ref={playerContainerRef}>
              <iframe
                id="yt-embed-player"
                src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&enablejsapi=1&rel=0&playsinline=1`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={room.name}
              />
            </div>

            <div className="player-track-bar">
              <div className="player-track-left">
                <img src={trackThumb} alt="Track" className="player-track-img" onError={e => (e.target as HTMLImageElement).src = '/logo-gold.png'} />
                <div style={{ minWidth: 0 }}>
                  <div className="player-track-name">{trackTitle}</div>
                  <div className="player-track-sub">{trackArtist}</div>
                </div>
              </div>
              <div className="player-track-right">
                <div className="card-soundwave-bars" style={{ position: 'static' }}>
                  <span className="sw-bar bar-1" />
                  <span className="sw-bar bar-2" />
                  <span className="sw-bar bar-3" />
                  <span className="sw-bar bar-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Live Chat Side */}
          <div className="player-right" ref={flyingContainerRef}>
            <div className="chat-header">
              <span>💬 Live Room Chat</span>
              <span className={`chat-status-pill ${connected ? 'connected' : 'connecting'}`}>
                {connected ? '● Connected' : '○ Connecting...'}
              </span>
            </div>

            <div className="chat-messages" ref={chatBoxRef}>
              {messages.map((m, idx) => {
                if (m.isSystem) {
                  return (
                    <div className="chat-msg-row" key={idx}>
                      <div className="chat-msg-content">
                        <div className="chat-msg-text system">{m.text}</div>
                      </div>
                    </div>
                  )
                }

                const sender: User = m.sender || { id: 'guest', username: 'Guest' }
                const isKira = m.aiName === 'Kira' || sender.username === 'Kira' || sender.id === 'kira-ai';
                const isBen = m.aiName === 'Ben' || sender.username === 'Ben' || sender.id === 'ben-ai';
                const isAI = isKira || isBen || m.isAI;
                const avatar = isKira
                  ? 'https://api.dicebear.com/7.x/bottts/svg?seed=kira-ai'
                  : (isBen ? 'https://api.dicebear.com/7.x/bottts/svg?seed=ben-ai' : (sender.avatar_url || getAvatarUrl(sender.username)));
                const timeStr = m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
                const badge = isAI ? (
                  <span className={`chat-msg-badge ${isBen ? 'ben-ai' : 'kira-ai'}`} style={{ background: isBen ? 'rgba(6,182,212,0.2)' : 'rgba(139,92,246,0.2)', color: isBen ? '#38BDF8' : '#A78BFA', border: `1px solid ${isBen ? '#06B6D4' : '#8B5CF6'}` }}>
                    {isBen ? 'BEN 🤖' : 'KIRA 🤖'}
                  </span>
                ) : (
                  sender.is_super_admin ? (
                    <span className="chat-msg-badge admin">ADMIN</span>
                  ) : (
                    sender.is_moderator ? <span className="chat-msg-badge mod">MOD</span> : null
                  )
                );

                return (
                  <div className="chat-msg-row" key={idx}>
                    <img src={avatar} className="chat-msg-avatar" alt="Avatar" />
                    <div className="chat-msg-content">
                      <div className="chat-msg-meta">
                        <span className="chat-msg-sender" style={{ color: isAI ? (isBen ? '#38BDF8' : '#A78BFA') : undefined }}>{sender.full_name || sender.username}</span>
                        {badge}
                        <span className="chat-msg-time">{timeStr}</span>
                      </div>
                      <div className="chat-msg-text">{m.text}</div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="chat-quick-emojis">
              {['🔥', '❤️', '👏', '🎉', '🎵', '🚀'].map(emoji => (
                <button key={emoji} className="emoji-pill" onClick={() => sendReaction(emoji)}>
                  {emoji}
                </button>
              ))}
            </div>

            <form className="chat-input-row" onSubmit={handleSendChat}>
              <input
                type="text"
                className="chat-input"
                placeholder="Send a live message..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                autoComplete="off"
              />
              <button type="submit" className="btn btn-gold btn-sm">
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
