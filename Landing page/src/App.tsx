import { Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import RequestsPage from './pages/RequestsPage'
import DownloadModal from './components/DownloadModal'
import FeedbackModal from './components/FeedbackModal'
import ScrollProgress from './components/ScrollProgress'

export default function App() {
  const [downloadOpen, setDownloadOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  return (
    <>
      <ScrollProgress />
      {/* Ambient Glow Nebulas */}
      <div className="glow-blob glow-1" aria-hidden="true" />
      <div className="glow-blob glow-2" aria-hidden="true" />
      <div className="glow-blob glow-3" aria-hidden="true" />

      <Navbar onOpenDownload={() => setDownloadOpen(true)} />

      <Routes>
        <Route path="/" element={
          <HomePage
            onOpenDownload={() => setDownloadOpen(true)}
            onOpenFeedback={() => setFeedbackOpen(true)}
          />
        } />
        <Route path="/requests" element={<RequestsPage />} />
      </Routes>

      {/* Official Download & Feedback Modals */}
      <DownloadModal open={downloadOpen} onClose={() => setDownloadOpen(false)} />
      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </>
  )
}
