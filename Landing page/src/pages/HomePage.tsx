import { useState, useEffect, useCallback } from 'react'
import HeroSection from '../components/HeroSection'
import LiveStreamsSection from '../components/LiveStreamsSection'
import RequestStreamSection from '../components/RequestStreamSection'
import FeedbackSection from '../components/FeedbackSection'
import FeaturesSection from '../components/FeaturesSection'
import SpotlightSection from '../components/SpotlightSection'
import Footer from '../components/Footer'
import { LiveRoom, User } from '../types'
import { API_BASE } from '../config'

interface Props {
  onOpenDownload: () => void
  onOpenFeedback: () => void
  onJoinStream: (roomId: string, rooms: LiveRoom[]) => void
  currentUser: User | null
  onOpenAuth?: (tab?: 'login' | 'register') => void
}

export default function HomePage({ onOpenDownload, onOpenFeedback, onJoinStream, currentUser, onOpenAuth }: Props) {
  const [rooms, setRooms] = useState<LiveRoom[]>([])

  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/rooms`)
      const data = await res.json()
      if (data && data.rooms) {
        setRooms(data.rooms)
      } else {
        setRooms([])
      }
    } catch {
      // keep current rooms or empty
    }
  }, [])

  useEffect(() => {
    fetchRooms()
    const timer = setInterval(() => {
      fetchRooms()
    }, 10000)
    return () => clearInterval(timer)
  }, [fetchRooms])

  return (
    <main>
      <HeroSection
        onOpenDownload={onOpenDownload}
        onOpenAuth={onOpenAuth}
        currentUser={currentUser}
      />
      <LiveStreamsSection rooms={rooms} onJoinStream={id => onJoinStream(id, rooms)} onRefresh={fetchRooms} />
      <RequestStreamSection />
      <FeedbackSection onOpenFeedback={onOpenFeedback} />
      <FeaturesSection />
      <SpotlightSection />
      <Footer onOpenDownload={onOpenDownload} />
    </main>
  )
}
