import React from 'react';
import { PoemAnimation } from "@/components/ui/3d-animation";
import "@/components/ui/3d-animation.css";


// --- Data Configuration for Hangloop ---
const ANIMATION_DATA = {
    poemHTML: `
        <p>🎵 <span>Hangloop Live</span> — Doston ke saath suno <span>real-time</span> synchronized music. Clash with beats, dance in <span>zero-lag harmony</span>. Har gaana ek nayi <span>dosti ki dhun</span>, background audio play with <span>limitless joy</span>. YouTube live music rooms mein judo, <span>real-time chat</span> karo, animated emoji <span>bursts</span> bhejo — <span>bina kisi lag ke</span>.</p>
    `,
    // Unsplash: Concert / stage atmosphere
    backgroundImageUrl: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80",
    // Unsplash: Music performer silhouette
    boyImageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80"
};


/**
 * Demo application showing the PoemAnimation component 
 * with Hangloop-themed data.
 */
export default function App() {
    return (
        <PoemAnimation
            poemHTML={ANIMATION_DATA.poemHTML}
            backgroundImageUrl={ANIMATION_DATA.backgroundImageUrl}
            boyImageUrl={ANIMATION_DATA.boyImageUrl}
        />
    );
}
