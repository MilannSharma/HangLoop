import { Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import RequestsPage from './pages/RequestsPage'
import DownloadModal from './components/DownloadModal'
import AuthModal from './components/AuthModal'
import PlayerModal from './components/PlayerModal'
import FeedbackModal from './components/FeedbackModal'
import MobileRestrictedModal from './components/MobileRestrictedModal'
import ScrollProgress from './components/ScrollProgress'
import { User, LiveRoom } from './types'
import { isMobileDevice } from './utils/helpers'

// Declare global YouTube API callback
declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function App() {
  const [downloadOpen, setDownloadOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login')
  const [playerOpen, setPlayerOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [mobileRestrictedOpen, setMobileRestrictedOpen] = useState(false)

  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [activeRoom, setActiveRoom] = useState<LiveRoom | null>(null)
  const [pendingRoomId, setPendingRoomId] = useState<string | null>(null)

  function openAuth(tab: 'login' | 'register' = 'login') {
    // Check if user is on a mobile device / screen
    if (isMobileDevice()) {
      setMobileRestrictedOpen(true)
      return
    }
    setAuthTab(tab)
    setAuthOpen(true)
  }

  function onLogin(user: User, token: string) {
    setCurrentUser(user)
    setAuthToken(token)
    localStorage.setItem('@hangloop_auth_token', token)
    localStorage.setItem('@hangloop_auth_user', JSON.stringify(user))
    setAuthOpen(false)
    if (pendingRoomId) {
      const rid = pendingRoomId
      setPendingRoomId(null)
      // defer opening the player
      setTimeout(() => handleJoinStream(rid), 100)
    }
  }

  function onLogout() {
    setCurrentUser(null)
    setAuthToken(null)
    localStorage.removeItem('@hangloop_auth_token')
    localStorage.removeItem('@hangloop_auth_user')
    setPlayerOpen(false)
  }

  function handleJoinStream(roomId: string, rooms?: LiveRoom[]) {
    // Check if user is on mobile
    if (isMobileDevice()) {
      setMobileRestrictedOpen(true)
      return
    }

    if (!currentUser) {
      setPendingRoomId(roomId)
      openAuth('login')
      return
    }

    const allRooms = rooms || []
    const room = allRooms.find(r => r.id === roomId)
    if (room) {
      setActiveRoom(room)
      setPlayerOpen(true)
    }
  }

  return (
    <>
      <ScrollProgress />
      {/* Ambient Glow Nebulas */}
      <div className="glow-blob glow-1" aria-hidden="true" />
      <div className="glow-blob glow-2" aria-hidden="true" />
      <div className="glow-blob glow-3" aria-hidden="true" />

      <Navbar
        currentUser={currentUser}
        onOpenAuth={openAuth}
        onOpenDownload={() => setDownloadOpen(true)}
        onLogout={onLogout}
      />

      <Routes>
        <Route path="/" element={
          <HomePage
            onOpenDownload={() => setDownloadOpen(true)}
            onOpenFeedback={() => setFeedbackOpen(true)}
            onJoinStream={handleJoinStream}
            currentUser={currentUser}
            onOpenAuth={openAuth}
          />
        } />
        <Route path="/requests" element={<RequestsPage />} />
      </Routes>

      {/* Modals */}
      <DownloadModal open={downloadOpen} onClose={() => setDownloadOpen(false)} />
      <MobileRestrictedModal
        open={mobileRestrictedOpen}
        onClose={() => setMobileRestrictedOpen(false)}
      />
      <AuthModal
        open={authOpen}
        tab={authTab}
        onClose={() => setAuthOpen(false)}
        onTabChange={setAuthTab}
        onLogin={onLogin}
      />
      {activeRoom && (
        <PlayerModal
          open={playerOpen}
          room={activeRoom}
          currentUser={currentUser}
          authToken={authToken}
          onClose={() => { setPlayerOpen(false); setActiveRoom(null); }}
        />
      )}
      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </>
  )
}
