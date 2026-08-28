import { Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import Navbar from './components/Navbar'
import ScrollProgress from './components/ScrollProgress'
import ScrollToTop from './components/ScrollToTop'
import DownloadModal from './components/DownloadModal'
import FeedbackModal from './components/FeedbackModal'

// Page Imports
import HomePage from './pages/HomePage'
import ListenTogetherPage from './pages/ListenTogetherPage'
import MusicRoomsPage from './pages/MusicRoomsPage'
import SynchronizedMusicPage from './pages/SynchronizedMusicPage'
import HowItWorksPage from './pages/HowItWorksPage'
import FeaturesPage from './pages/FeaturesPage'
import FAQPage from './pages/FAQPage'
import AboutPage from './pages/AboutPage'
import ChangelogPage from './pages/ChangelogPage'
import ContactPage from './pages/ContactPage'
import PrivacyPage from './pages/PrivacyPage'
import TermsPage from './pages/TermsPage'
import RequestsPage from './pages/RequestsPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  const [downloadOpen, setDownloadOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  const handleOpenDownload = () => setDownloadOpen(true)
  const handleOpenFeedback = () => setFeedbackOpen(true)

  return (
    <>
      <ScrollToTop />
      <ScrollProgress />

      {/* Ambient Glow Nebulas */}
      <div className="glow-blob glow-1" aria-hidden="true" />
      <div className="glow-blob glow-2" aria-hidden="true" />
      <div className="glow-blob glow-3" aria-hidden="true" />

      <Navbar onOpenDownload={handleOpenDownload} />

      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              onOpenDownload={handleOpenDownload}
              onOpenFeedback={handleOpenFeedback}
            />
          }
        />
        <Route
          path="/listen-to-music-with-friends"
          element={<ListenTogetherPage onOpenDownload={handleOpenDownload} />}
        />
        <Route
          path="/music-rooms"
          element={<MusicRoomsPage onOpenDownload={handleOpenDownload} />}
        />
        <Route
          path="/synchronized-music"
          element={<SynchronizedMusicPage onOpenDownload={handleOpenDownload} />}
        />
        <Route
          path="/how-it-works"
          element={<HowItWorksPage onOpenDownload={handleOpenDownload} />}
        />
        <Route
          path="/features"
          element={<FeaturesPage onOpenDownload={handleOpenDownload} />}
        />
        <Route
          path="/faq"
          element={<FAQPage onOpenDownload={handleOpenDownload} />}
        />
        <Route
          path="/about"
          element={<AboutPage onOpenDownload={handleOpenDownload} />}
        />
        <Route
          path="/changelog"
          element={<ChangelogPage onOpenDownload={handleOpenDownload} />}
        />
        <Route
          path="/contact"
          element={
            <ContactPage
              onOpenDownload={handleOpenDownload}
              onOpenFeedback={handleOpenFeedback}
            />
          }
        />
        <Route
          path="/privacy"
          element={<PrivacyPage onOpenDownload={handleOpenDownload} />}
        />
        <Route
          path="/terms"
          element={<TermsPage onOpenDownload={handleOpenDownload} />}
        />
        <Route path="/requests" element={<RequestsPage />} />
        
        {/* 404 Catch-All */}
        <Route
          path="*"
          element={<NotFoundPage onOpenDownload={handleOpenDownload} />}
        />
      </Routes>

      {/* Global Modals */}
      <DownloadModal open={downloadOpen} onClose={() => setDownloadOpen(false)} />
      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </>
  )
}
