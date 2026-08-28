import { useState, useEffect, useCallback } from 'react'
import HeroSection from '../components/HeroSection'
import AboutSection from '../components/AboutSection'
import LiveStreamsSection from '../components/LiveStreamsSection'
import RequestStreamSection from '../components/RequestStreamSection'
import FeedbackSection from '../components/FeedbackSection'
import FeaturesSection from '../components/FeaturesSection'
import SpotlightSection from '../components/SpotlightSection'
import Footer from '../components/Footer'
import { LiveRoom } from '../types'
import { API_BASE } from '../config'

const DEFAULT_OFFICIAL_ROOMS: LiveRoom[] = [
  {
    id: 'room-bollywood-hindi',
    name: 'Bollywood Hindi Music Live',
    theme: 'BOLLYWOOD',
    category: 'Bollywood Superhits',
    current_title: 'Kesariya — Brahmāstra',
    current_artist: 'Arijit Singh, Pritam',
    current_video_id: 'BddP6PYo2gs',
    thumbnail_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    current_thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    active_viewers: 1,
    is_private: false,
    music_enabled: true,
    max_members: 500,
    created_by: 'system'
  },
  {
    id: 'room-punjabi-hits',
    name: 'Punjabi Hits Live',
    theme: 'PUNJABI',
    category: 'Punjabi Chartbusters',
    current_title: 'Excuses — AP Dhillon',
    current_artist: 'AP Dhillon, Gurinder Gill',
    current_video_id: 'vX2cDW8LUWk',
    thumbnail_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    current_thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    active_viewers: 1,
    is_private: false,
    music_enabled: true,
    max_members: 500,
    created_by: 'system'
  },
  {
    id: 'room-lofi-chill',
    name: 'Lo-Fi Chill Beats Live',
    theme: 'LOFI_CHILL',
    category: 'Lo-Fi Study & Relax',
    current_title: 'Lofi Hip Hop Radio — 24/7 Beats',
    current_artist: 'Lofi Girl',
    current_video_id: 'jfKfPfyJRdk',
    thumbnail_url: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&auto=format&fit=crop&q=80',
    current_thumbnail: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&auto=format&fit=crop&q=80',
    active_viewers: 1,
    is_private: false,
    music_enabled: true,
    max_members: 500,
    created_by: 'system'
  },
  {
    id: 'room-instagram-trending',
    name: 'Instagram Trending Songs Live',
    theme: 'TRENDING',
    category: 'Reels & Viral Hits',
    current_title: 'Big Dawgs — Hanumankind',
    current_artist: 'Hanumankind, Kalmi',
    current_video_id: 'hOHKltAiKXQ',
    thumbnail_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    current_thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80',
    active_viewers: 1,
    is_private: false,
    music_enabled: true,
    max_members: 500,
    created_by: 'system'
  }
];

interface Props {
  onOpenDownload: () => void
  onOpenFeedback: () => void
}

export default function HomePage({ onOpenDownload, onOpenFeedback }: Props) {
  const [rooms, setRooms] = useState<LiveRoom[]>(DEFAULT_OFFICIAL_ROOMS)

  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/rooms`)
      const data = await res.json()
      if (data && data.rooms && Array.isArray(data.rooms) && data.rooms.length > 0) {
        setRooms(data.rooms)
      }
    } catch {
      // Keep default official stations
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
      <HeroSection onOpenDownload={onOpenDownload} />
      <AboutSection onOpenDownload={onOpenDownload} />
      <LiveStreamsSection rooms={rooms} onOpenDownload={onOpenDownload} onRefresh={fetchRooms} />
      <RequestStreamSection />
      <FeedbackSection onOpenFeedback={onOpenFeedback} />
      <FeaturesSection />
      <SpotlightSection />
      <Footer onOpenDownload={onOpenDownload} />
    </main>
  )
}
