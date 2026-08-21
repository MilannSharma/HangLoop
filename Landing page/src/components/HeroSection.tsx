import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Download } from 'lucide-react';
import { User } from '../types';

/* ---------------- WavyLetterAnimation ---------------- */
interface WavyTitleProps {
  text: string;
  showAsterisk?: boolean;
}

export const WavyTitle = ({ text, showAsterisk = true }: WavyTitleProps) => {
  const letters = text.split("");

  return (
    <span className="prisma-wavy-title">
      {letters.map((char, i) => (
        <motion.span
          key={i}
          className="prisma-wavy-char"
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 3.8,
            repeat: Infinity,
            repeatType: "loop",
            ease: "easeInOut",
            delay: i * 0.2,
          }}
        >
          {char}
        </motion.span>
      ))}
      {showAsterisk && (
        <motion.span
          className="prisma-asterisk"
          animate={{
            y: [0, -12, 0],
            rotate: [0, 12, 0],
            scale: [1, 1.08, 1],
          }}
          transition={{
            duration: 3.8,
            repeat: Infinity,
            repeatType: "loop",
            ease: "easeInOut",
            delay: letters.length * 0.2,
          }}
        >
          *
        </motion.span>
      )}
    </span>
  );
};

interface HeroProps {
  onOpenDownload: () => void;
  onOpenAuth?: (tab?: 'login' | 'register') => void;
  currentUser?: User | null;
}

export default function HeroSection({ onOpenDownload }: HeroProps) {
  return (
    <section className="prisma-hero-container">
      <div className="prisma-hero-card">
        
        {/* 3D Cinematic Dreamscape Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="prisma-video-bg"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_170732_8a9ccda6-5cff-4628-b164-059c500a2b41.mp4"
        />

        {/* High-res cinematic noise texture overlay */}
        <div className="prisma-noise-overlay" />

        {/* Gradient vignette for text contrast */}
        <div className="prisma-gradient-overlay" />

        {/* Hero Bottom Content: Giant Title on Left, Editorial Copy + Buttons on Right */}
        <div className="prisma-hero-bottom">
          <div className="prisma-hero-grid">
            
            {/* Left Column: Massive Display Typography with slow letter wave */}
            <div className="prisma-hero-title-col">
              <h1 className="prisma-hero-title">
                <WavyTitle text="Hangloop" showAsterisk />
              </h1>
            </div>

            {/* Right Column: Editorial Description & Action Buttons */}
            <div className="prisma-hero-info-col">
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="prisma-hero-desc"
              >
                Hangloop is a worldwide network of synchronized music rooms connecting music lovers, artists and friends in real-time zero-lag audio harmony with live chat &amp; reactions.
              </motion.p>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="prisma-hero-actions"
              >
                {/* Main Cream Pill CTA Button */}
                <a href="#live-streams" className="btn-prisma-primary">
                  <span>Join live rooms</span>
                  <span className="btn-prisma-icon-wrap">
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </a>

                {/* Download App Button */}
                <button onClick={onOpenDownload} className="btn-prisma-secondary">
                  <Download className="w-4 h-4" />
                  <span>Download App</span>
                </button>
              </motion.div>
            </div>

          </div>
        </div>

      </div>

      {/* Infinite Ticker Strip in Prisma Obsidian Aesthetic */}
      <div className="prisma-ticker-wrapper">
        <div className="ticker-stream-track">
          {[...Array(2)].map((_, i) => (
            <span key={i} style={{ display: 'contents' }}>
              <div className="ticker-item"><span style={{ color: '#E1E0CC' }}>🎵 REAL-TIME AUDIO SYNCHRONIZATION</span></div>
              <div className="ticker-item"><span style={{ color: 'rgba(225,224,204,0.55)' }}>⚡ ZERO-LAG CLOUDFLARE EDGE</span></div>
              <div className="ticker-item"><span style={{ color: '#E1E0CC' }}>🎶 LISTEN TOGETHER IN LIVE ROOMS</span></div>
              <div className="ticker-item"><span style={{ color: 'rgba(225,224,204,0.55)' }}>🎧 BACKGROUND AUDIO PLAY ON MOBILE</span></div>
              <div className="ticker-item"><span style={{ color: '#E1E0CC' }}>🔥 LIVE CHAT &amp; EMOJI REACTIONS</span></div>
              <div className="ticker-item"><span style={{ color: 'rgba(225,224,204,0.55)' }}>📱 ANDROID APK &bull; IOS WEB APP</span></div>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
