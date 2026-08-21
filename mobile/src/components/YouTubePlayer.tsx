import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Image, ActivityIndicator, Animated, Platform, LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import YoutubePlayer, { YoutubeIframeRef } from 'react-native-youtube-iframe';
import { useTheme } from '../theme/ThemeContext';

interface YouTubePlayerProps {
  videoId: string;
  title?: string;
  artist?: string;
  thumbnail?: string;
  isPlaying: boolean;
  seekPosition: number;
  isListenOnly?: boolean;
  isLiveStream?: boolean;
  isStreamEnded?: boolean;
  onTogglePlay?: () => void;
  onToggleListenOnly?: () => void;
  onResyncLive?: () => void;
  onTrackEnded?: () => void;
  onTrackFailed?: (videoId: string, errorCode: number) => void;
}

export type RealPlayerStatus = 'UNSTARTED' | 'BUFFERING' | 'PLAYING' | 'PAUSED' | 'ENDED' | 'ERROR';

const INJECTED_HIDE_YT_CSS_JS = `
  (function() {
    function injectCleanStyles() {
      try {
        var style = document.getElementById('hangloop-clean-style');
        if (!style) {
          style = document.createElement('style');
          style.id = 'hangloop-clean-style';
          style.innerHTML = \`
            .ytp-chrome-top,
            .ytp-chrome-bottom,
            .ytp-watermark,
            .ytp-pause-overlay,
            .ytp-youtube-button,
            .ytp-show-cards-title,
            .ytp-ce-element,
            .ytp-gradient-top,
            .ytp-gradient-bottom,
            .ytp-title-channel,
            .ytp-title,
            .ytp-share-button,
            .ytp-overflow-button,
            .ytp-cards-button,
            .ytp-contextmenu,
            .ytp-subtitles-button,
            .ytp-larger-tap-buttons,
            .ytp-copylink-button,
            .ytp-impression-link,
            .ytp-paid-content-overlay {
              display: none !important;
              opacity: 0 !important;
              visibility: hidden !important;
              pointer-events: none !important;
            }
          \`;
          if (document.head) document.head.appendChild(style);
        }
      } catch(e) {}
    }
    injectCleanStyles();
    setInterval(injectCleanStyles, 500);
  })();
  true;
`;

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  videoId,
  title = 'Live Music Stream',
  artist = 'Featured Artist',
  thumbnail = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80',
  isPlaying,
  seekPosition,
  isListenOnly = false,
  isLiveStream = false,
  isStreamEnded = false,
  onTogglePlay,
  onToggleListenOnly,
  onResyncLive,
  onTrackEnded,
  onTrackFailed,
}) => {
  const { colors } = useTheme();
  const playerContainerId = useRef(`yt-player-${Math.random().toString(36).substring(7)}`).current;
  const webPlayerInstanceRef = useRef<any>(null);
  const nativePlayerRef = useRef<YoutubeIframeRef>(null);
  const playerReadyRef = useRef(false);

  const [containerHeight, setContainerHeight] = useState(220);

  const onTrackEndedRef = useRef(onTrackEnded);
  const onTrackFailedRef = useRef(onTrackFailed);
  useEffect(() => { onTrackEndedRef.current = onTrackEnded; }, [onTrackEnded]);
  useEffect(() => { onTrackFailedRef.current = onTrackFailed; }, [onTrackFailed]);

  const [playerStatus, setPlayerStatus] = useState<RealPlayerStatus>('UNSTARTED');
  const [errorCode, setErrorCode] = useState<number | null>(null);
  const [needUserGesture, setNeedUserGesture] = useState(false);
  // Force-play toggle: briefly flips play prop false→true to make react-native-youtube-iframe
  // re-send playVideo() to the WebView (library only calls playVideo on false→true transition)
  const [forcePlayPaused, setForcePlayPaused] = useState(false);

  // ── Auto-hide controls after 3 seconds ──
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeVideoId = videoId || 'BddP6PYo2gs';
  const loadedVideoRef = useRef<string>('');

  // ── Autoplay retry mechanism for live streams ──
  // react-native-youtube-iframe's play prop may silently fail for live streams
  // because the YouTube IFrame API's playVideo() fires before the live buffer is ready.
  // We detect when the player reports 'paused'/'unstarted' but isPlaying=true and force-retry.
  const isPlayingRef = useRef(isPlaying);
  const isLiveStreamRef = useRef(isLiveStream);
  const autoplayRetryCountRef = useRef(0);
  const autoplayRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const MAX_AUTOPLAY_RETRIES = 6;

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { isLiveStreamRef.current = isLiveStream; }, [isLiveStream]);

  // Reset retry count when videoId changes (new video loaded)
  useEffect(() => {
    autoplayRetryCountRef.current = 0;
    if (autoplayRetryTimerRef.current) {
      clearTimeout(autoplayRetryTimerRef.current);
      autoplayRetryTimerRef.current = null;
    }
  }, [activeVideoId]);

  const resetHideTimer = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      Animated.timing(controlsOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setControlsVisible(false);
      });
    }, 4500);
  }, [controlsOpacity]);

  const handleOverlayTap = useCallback(() => {
    if (controlsVisible) {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      Animated.timing(controlsOpacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
        setControlsVisible(false);
      });
    } else {
      setControlsVisible(true);
      Animated.timing(controlsOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      resetHideTimer();
    }
  }, [controlsVisible, resetHideTimer, controlsOpacity]);

  // ── MediaSession API (Lock Screen & System Notification Controls) ──
  useEffect(() => {
    if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
      try {
        (navigator as any).mediaSession.metadata = new (window as any).MediaMetadata({
          title: title || 'Hangloop Live Music',
          artist: artist || 'Hangloop Radio',
          album: 'Hangloop Live Stream',
          artwork: thumbnail ? [
            { src: thumbnail, sizes: '96x96', type: 'image/jpeg' },
            { src: thumbnail, sizes: '128x128', type: 'image/jpeg' },
            { src: thumbnail, sizes: '192x192', type: 'image/jpeg' },
            { src: thumbnail, sizes: '256x256', type: 'image/jpeg' },
            { src: thumbnail, sizes: '384x384', type: 'image/jpeg' },
            { src: thumbnail, sizes: '512x512', type: 'image/jpeg' },
          ] : []
        });

        (navigator as any).mediaSession.setActionHandler('play', () => {
          if (onTogglePlay) onTogglePlay();
        });
        (navigator as any).mediaSession.setActionHandler('pause', () => {
          if (onTogglePlay) onTogglePlay();
        });
      } catch (e) {
        console.warn('[MediaSession] Setup error:', e);
      }
    }
  }, [title, artist, thumbnail, onTogglePlay]);

  useEffect(() => {
    resetHideTimer();
    return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); };
  }, [activeVideoId, resetHideTimer]);

  const handleLayout = (e: LayoutChangeEvent) => {
    const { height, width } = e.nativeEvent.layout;
    if (height > 0) {
      setContainerHeight(height);
    } else if (width > 0) {
      setContainerHeight(Math.round((width * 9) / 16));
    }
  };

  // ──────────────────────────────────────────────────────────────
  // 1. WEB INIT EFFECT (Web Only)
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    let isMounted = true;

    const initYTPlayer = () => {
      if (typeof window === 'undefined' || !(window as any).YT || !(window as any).YT.Player) return;
      if (webPlayerInstanceRef.current && playerReadyRef.current) return;

      try {
        webPlayerInstanceRef.current = new (window as any).YT.Player(playerContainerId, {
          height: '100%',
          width: '100%',
          videoId: activeVideoId,
          playerVars: {
            autoplay: 1,
            controls: 0,
            playsinline: 1,
            rel: 0,
            modestbranding: 1,
            enablejsapi: 1,
            disablekb: 1,
            iv_load_policy: 3,
            fs: 0,
            cc_load_policy: 0,
            cc_lang_pref: 'none',
            showinfo: 0,
            start: (!isLiveStream && seekPosition > 0) ? Math.floor(seekPosition) : undefined,
          },
          events: {
            onReady: (event: any) => {
              if (!isMounted) return;
              playerReadyRef.current = true;
              loadedVideoRef.current = activeVideoId;
              setPlayerStatus('PLAYING');
              setErrorCode(null);
              setNeedUserGesture(false);
              try {
                event.target.playVideo();
                if (typeof event.target.unMute === 'function') event.target.unMute();
              } catch (e) {
                try {
                  if (typeof event.target.mute === 'function') event.target.mute();
                  event.target.playVideo();
                } catch (e2) {}
              }
            },
            onStateChange: (event: any) => {
              if (!isMounted) return;
              const state = event.data;
              if (state === 1) {
                setPlayerStatus('PLAYING');
                setErrorCode(null);
                setNeedUserGesture(false);
              } else if (state === 2) {
                setPlayerStatus('PAUSED');
              } else if (state === 3) {
                setPlayerStatus('BUFFERING');
              } else if (state === 0) {
                setPlayerStatus('ENDED');
                if (onTrackEndedRef.current) onTrackEndedRef.current();
              }
            },
            onError: (event: any) => {
              if (!isMounted) return;
              const err = event.data;
              const failedId = loadedVideoRef.current;
              console.warn('[YT Player Web] Error:', err, 'video:', failedId);
              if (!isLiveStream) {
                setPlayerStatus('ERROR');
                setErrorCode(err);
                if (onTrackFailedRef.current) onTrackFailedRef.current(failedId, err);
              } else {
                setErrorCode(err);
              }
            },
          },
        });
      } catch (e) {
        console.warn('[YT Player Web] Init error:', e);
      }
    };

    if (typeof window !== 'undefined') {
      if (!(window as any).YT || !(window as any).YT.Player) {
        const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
        if (!existingScript) {
          const tag = document.createElement('script');
          tag.src = 'https://www.youtube.com/iframe_api';
          const first = document.getElementsByTagName('script')[0];
          if (first && first.parentNode) first.parentNode.insertBefore(tag, first);
          else document.head.appendChild(tag);
        }
        (window as any).onYouTubeIframeAPIReady = () => { initYTPlayer(); };
      } else {
        initYTPlayer();
      }
    }

    return () => { isMounted = false; };
  }, [playerContainerId, activeVideoId, seekPosition, isLiveStream]);

  // ──────────────────────────────────────────────────────────────
  // 2. VIDEO CHANGE EFFECT (Web & Native)
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeVideoId) return;
    if (loadedVideoRef.current === activeVideoId) return;

    loadedVideoRef.current = activeVideoId;
    setPlayerStatus('PLAYING');
    setErrorCode(null);
    setNeedUserGesture(false);
    resetHideTimer();

    if (Platform.OS === 'web') {
      const player = webPlayerInstanceRef.current;
      if (player && playerReadyRef.current && typeof player.loadVideoById === 'function') {
        try {
          player.loadVideoById({
            videoId: activeVideoId,
            startSeconds: (!isLiveStream && seekPosition > 0) ? Math.floor(seekPosition) : 0,
          });
          player.playVideo();
          if (typeof player.unMute === 'function') player.unMute();
        } catch (e) {}
      }
    } else {
      if (!isLiveStream && seekPosition > 0 && nativePlayerRef.current && typeof (nativePlayerRef.current as any).seekTo === 'function') {
        try {
          (nativePlayerRef.current as any).seekTo(Math.floor(seekPosition), true);
        } catch (e) {}
      }
    }
  }, [activeVideoId, seekPosition, isLiveStream, resetHideTimer]);

  // ──────────────────────────────────────────────────────────────
  // 3. LIVE SEEK SYNC EFFECT (Auto-syncs on unpause, unlock, etc.)
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLiveStream && seekPosition > 0 && playerReadyRef.current) {
      if (Platform.OS === 'web') {
        const player = webPlayerInstanceRef.current;
        if (player && typeof player.seekTo === 'function') {
          try {
            player.seekTo(Math.floor(seekPosition), true);
          } catch (e) {}
        }
      } else {
        try {
          (nativePlayerRef.current as any)?.seekTo(Math.floor(seekPosition), true);
        } catch (e) {}
      }
    }
  }, [seekPosition, isLiveStream]);

  // ──────────────────────────────────────────────────────────────
  // 4. Native State Handlers (with autoplay retry for live streams)
  // ──────────────────────────────────────────────────────────────

  // Helper: schedule a retry to force-play if the player auto-paused
  const scheduleAutoplayRetry = useCallback(() => {
    if (autoplayRetryCountRef.current >= MAX_AUTOPLAY_RETRIES) return;
    if (!isPlayingRef.current || !playerReadyRef.current) return;
    if (autoplayRetryTimerRef.current) clearTimeout(autoplayRetryTimerRef.current);

    // Escalating delay: 800ms → 1.2s → 2s → 3s → 5s → 8s
    const delays = [800, 1200, 2000, 3000, 5000, 8000];
    const delay = delays[Math.min(autoplayRetryCountRef.current, delays.length - 1)];

    autoplayRetryTimerRef.current = setTimeout(() => {
      autoplayRetryTimerRef.current = null;
      if (!isPlayingRef.current || !playerReadyRef.current) return;

      autoplayRetryCountRef.current++;
      console.log(`[YT Autoplay Retry] Attempt ${autoplayRetryCountRef.current}/${MAX_AUTOPLAY_RETRIES} — forcing playVideo()`);

      if (Platform.OS === 'web') {
        const player = webPlayerInstanceRef.current;
        if (player && typeof player.playVideo === 'function') {
          try {
            player.playVideo();
            if (typeof player.unMute === 'function') player.unMute();
          } catch (e) {}
        }
      } else {
        // Native: react-native-youtube-iframe only calls playVideo() when
        // the play prop transitions false→true. We briefly set play=false
        // then back to true to force this transition.
        setForcePlayPaused(true);
        setTimeout(() => setForcePlayPaused(false), 100);
      }
    }, delay);
  }, []);

  const handleNativeStateChange = useCallback((state: string) => {
    console.log('[Native YT State]:', state);
    if (state === 'playing') {
      setPlayerStatus('PLAYING');
      setErrorCode(null);
      setNeedUserGesture(false);
      // Player is actually playing — cancel any pending retry
      autoplayRetryCountRef.current = MAX_AUTOPLAY_RETRIES; // stop retries
      if (autoplayRetryTimerRef.current) {
        clearTimeout(autoplayRetryTimerRef.current);
        autoplayRetryTimerRef.current = null;
      }
    } else if (state === 'paused') {
      // CRITICAL FIX: If we want the video playing but the player paused itself,
      // schedule a retry. This happens with live streams that buffer-then-pause.
      if (isPlayingRef.current && playerReadyRef.current && autoplayRetryCountRef.current < MAX_AUTOPLAY_RETRIES) {
        console.log('[Native YT State] Player auto-paused but isPlaying=true — scheduling retry');
        setPlayerStatus('BUFFERING'); // show buffering, not paused (user expects it to load)
        scheduleAutoplayRetry();
      } else {
        setPlayerStatus('PAUSED');
      }
    } else if (state === 'buffering') {
      setPlayerStatus('BUFFERING');
    } else if (state === 'unstarted') {
      // Live streams may report 'unstarted' — treat as buffering and schedule retry
      if (isPlayingRef.current && playerReadyRef.current && autoplayRetryCountRef.current < MAX_AUTOPLAY_RETRIES) {
        setPlayerStatus('BUFFERING');
        scheduleAutoplayRetry();
      }
    } else if (state === 'ended') {
      setPlayerStatus('ENDED');
      if (onTrackEndedRef.current) onTrackEndedRef.current();
    }
  }, [scheduleAutoplayRetry]);

  const handleNativeError = useCallback((error: string) => {
    console.warn('[Native YT Error]:', error, 'video:', activeVideoId);
    if (!isLiveStream) {
      setPlayerStatus('ERROR');
      setErrorCode(150);
      if (onTrackFailedRef.current) onTrackFailedRef.current(activeVideoId, 150);
    } else {
      setErrorCode(150);
    }
  }, [activeVideoId, isLiveStream]);

  const handleNativeReady = useCallback(() => {
    playerReadyRef.current = true;
    setPlayerStatus('PLAYING');
    setErrorCode(null);
    setNeedUserGesture(false);
    autoplayRetryCountRef.current = 0; // reset retries for this video

    // Instant Auto Live-Seek on entry (only for catalog tracks with real seek offset)
    if (!isLiveStream && seekPosition > 0) {
      try {
        (nativePlayerRef.current as any)?.seekTo(Math.floor(seekPosition), true);
      } catch (e) {}
    }

    // Schedule a verification check — ensure the player ACTUALLY started playing
    // after the YouTube IFrame API reports ready. Live streams often report ready
    // but then fail to start playback immediately.
    if (isPlayingRef.current) {
      setTimeout(() => {
        if (!isPlayingRef.current || !playerReadyRef.current) return;
        // If status hasn't reached PLAYING yet, trigger retry cycle
        scheduleAutoplayRetry();
      }, 1500);
    }
  }, [seekPosition, isLiveStream, scheduleAutoplayRetry]);

  // ──────────────────────────────────────────────────────────────
  // 5. Play/Pause Sync (Web + Native autoplay enforcement)
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (Platform.OS === 'web') {
      const player = webPlayerInstanceRef.current;
      if (player && playerReadyRef.current && typeof player.playVideo === 'function') {
        try {
          if (isPlaying) {
            player.playVideo();
            if (typeof player.unMute === 'function') player.unMute();
          } else {
            player.pauseVideo();
          }
        } catch (e) {}
      }
    } else {
      // Native: When isPlaying becomes true, reset retry counter so autoplay
      // retry mechanism can kick in if the player doesn't start
      if (isPlaying && playerReadyRef.current) {
        autoplayRetryCountRef.current = 0;
      }
    }
  }, [isPlaying]);

  // Cleanup retry timer on unmount
  useEffect(() => {
    return () => {
      if (autoplayRetryTimerRef.current) {
        clearTimeout(autoplayRetryTimerRef.current);
      }
    };
  }, []);

  // ──────────────────────────────────────────────────────────────
  // Handlers
  // ──────────────────────────────────────────────────────────────
  const handlePlayPause = useCallback(() => {
    setNeedUserGesture(false);
    resetHideTimer();
    if (Platform.OS === 'web') {
      const player = webPlayerInstanceRef.current;
      if (player && playerReadyRef.current) {
        try {
          const cs = player.getPlayerState?.();
          if (cs === 1) player.pauseVideo();
          else {
            player.playVideo();
            if (typeof player.unMute === 'function') player.unMute();
          }
        } catch (e) {}
      }
    }
    if (onTogglePlay) onTogglePlay();
  }, [onTogglePlay, resetHideTimer]);

  const handleResyncLive = useCallback(() => {
    resetHideTimer();
    if (Platform.OS === 'web') {
      const player = webPlayerInstanceRef.current;
      if (player && playerReadyRef.current) {
        try {
          if (typeof player.seekTo === 'function') {
            player.seekTo(Math.max(0, Math.floor(seekPosition)), true);
          }
          player.playVideo();
          if (typeof player.unMute === 'function') player.unMute();
        } catch (e) {}
      }
    } else {
      try {
        (nativePlayerRef.current as any)?.seekTo(Math.max(0, Math.floor(seekPosition)), true);
      } catch (e) {}
    }
    setNeedUserGesture(false);
    if (onResyncLive) onResyncLive();
  }, [seekPosition, onResyncLive, resetHideTimer]);

  const handleUserTapToPlay = useCallback(() => {
    setNeedUserGesture(false);
    resetHideTimer();
    if (Platform.OS === 'web') {
      const player = webPlayerInstanceRef.current;
      if (player && playerReadyRef.current) {
        try {
          player.playVideo();
          if (typeof player.unMute === 'function') player.unMute();
        } catch (e) {}
      }
    }
    if (onTogglePlay) onTogglePlay();
  }, [onTogglePlay, resetHideTimer]);

  // ══════════════════════════════════════════════════════════════
  // RENDER (Platform-aware Player Engine)
  // ══════════════════════════════════════════════════════════════
  return (
    <View style={{ width: '100%' }}>
      {/* LISTEN-ONLY MODE HEADER BAR */}
      {isListenOnly ? (
        <View style={[styles.listenOnlyContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Image source={{ uri: thumbnail }} style={styles.miniThumbnail} />
          <View style={styles.miniMeta}>
            <Text style={[styles.miniTitle, { color: colors.text }]} numberOfLines={1}>{title}</Text>
            <Text style={[styles.miniArtist, { color: colors.textSecondary }]} numberOfLines={1}>{artist}</Text>
          </View>
          <TouchableOpacity style={[styles.miniPlayBtn, { backgroundColor: colors.primary }]} onPress={handlePlayPause} activeOpacity={0.8}>
            <Ionicons name={playerStatus === 'PLAYING' ? 'pause' : 'play'} size={18} color="#FFF" style={{ marginLeft: playerStatus === 'PLAYING' ? 0 : 2 }} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.watchVideoBtn, { backgroundColor: colors.badgeBg, borderColor: colors.primary }]} onPress={onToggleListenOnly} activeOpacity={0.8}>
            <Ionicons name="videocam" size={14} color={colors.primary} style={{ marginRight: 5 }} />
            <Text style={[styles.watchVideoText, { color: colors.primary }]}>Watch</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* FULL VIDEO CONTAINER (Kept mounted off-screen in listen-only mode to preserve audio) */}
      <View
        style={[
          styles.container,
          { borderColor: colors.border },
          isListenOnly && styles.hiddenPlayerContainer
        ]}
        onLayout={handleLayout}
      >
        {/* YouTube Player Container (Platform-aware) */}
        <View style={styles.playerWrapper}>
          {Platform.OS === 'web' ? (
            React.createElement('div', {
              id: playerContainerId,
              style: { width: '100%', height: '100%', pointerEvents: 'none' }
            })
          ) : (
            <YoutubePlayer
              ref={nativePlayerRef}
              height={isListenOnly ? 1 : containerHeight}
              play={isPlaying && !isStreamEnded && !forcePlayPaused}
              videoId={activeVideoId}
              webViewProps={{
                allowsInlineMediaPlayback: true,
                mediaPlaybackRequiresUserAction: false,
                pointerEvents: 'none',
                scrollEnabled: false,
                androidHardwareAccelerationDisabled: false,
                androidLayerType: 'hardware',
                domStorageEnabled: true,
                javaScriptEnabled: true,
                injectedJavaScript: INJECTED_HIDE_YT_CSS_JS,
                automaticallyAdjustContentInsets: false,
              }}
              initialPlayerParams={{
                controls: false,
                modestbranding: true,
                rel: false,
                preventFullScreen: true,
                cc_lang_pref: 'none',
                showClosedCaptions: false,
                iv_load_policy: 3,
                start: (!isLiveStream && seekPosition > 0) ? Math.floor(seekPosition) : undefined,
              }}
              onChangeState={handleNativeStateChange}
              onError={handleNativeError}
              onReady={handleNativeReady}
            />
          )}
        </View>

        {!isListenOnly && (
          <>
            {/* Transparent interaction blocker — absorbs all touch, TAP toggles Hangloop controls */}
            <TouchableOpacity
              style={styles.interactionBlocker}
              activeOpacity={1}
              onPress={handleOverlayTap}
            />

            {/* ERROR OVERLAY */}
            {playerStatus === 'ERROR' && (
              <View style={styles.errorOverlay}>
                <Ionicons name="warning-outline" size={28} color="#EF4444" style={{ marginBottom: 6 }} />
                <Text style={styles.errorTitle}>Video Unavailable</Text>
                <Text style={styles.errorSubtitle}>
                  {errorCode === 100 ? 'This video was removed or is private.'
                    : errorCode === 101 || errorCode === 150 ? 'Embedding disabled by video owner.'
                    : `Player error (code ${errorCode || 'unknown'}).`}
                </Text>
                <View style={styles.recoveringBadge}>
                  <ActivityIndicator size="small" color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={styles.recoveringText}>Finding playable song...</Text>
                </View>
              </View>
            )}

            {/* USER GESTURE AUTOPLAY UNBLOCKER OVERLAY */}
            {needUserGesture && !isStreamEnded && (
              <TouchableOpacity
                style={styles.gestureOverlay}
                activeOpacity={0.9}
                onPress={handlePlayPause}
              >
                <View style={styles.gesturePlayCircle}>
                  <Ionicons name="play" size={32} color="#FFF" style={{ marginLeft: 3 }} />
                </View>
                <Text style={styles.gestureText}>Tap to Sync Live Music</Text>
                <Text style={styles.gestureSubtext}>{title}</Text>
              </TouchableOpacity>
            )}

            {/* STREAM ENDED OVERLAY */}
            {isStreamEnded && (
              <View style={styles.streamEndedOverlay}>
                <View style={styles.streamEndedBadge}>
                  <Ionicons name="radio-outline" size={32} color="#EF4444" />
                </View>
                <Text style={styles.streamEndedTitle}>Live Stream Has Ended</Text>
                <Text style={styles.streamEndedSub}>This live broadcast session has concluded.</Text>
              </View>
            )}

            {/* CENTER QUICK ACTION CONTROLS ON TAP */}
            <Animated.View
              style={[styles.centerControlsOverlay, { opacity: controlsOpacity }]}
              pointerEvents={controlsVisible ? 'box-none' : 'none'}
            >
              <TouchableOpacity
                style={styles.centerMainBtn}
                onPress={handlePlayPause}
                activeOpacity={0.8}
                disabled={playerStatus === 'ERROR'}
              >
                <Ionicons
                  name={playerStatus === 'PLAYING' ? 'pause' : 'play'}
                  size={30}
                  color="#FFF"
                  style={{ marginLeft: playerStatus === 'PLAYING' ? 0 : 3 }}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.centerResyncBtn}
                onPress={handleResyncLive}
                activeOpacity={0.8}
              >
                <Ionicons name="sync" size={20} color="#FFF" />
              </TouchableOpacity>
            </Animated.View>

            {/* HANGLOOP CONTROL BAR — auto-hides after interaction */}
            <Animated.View style={[styles.controlBar, { opacity: controlsOpacity }]} pointerEvents={controlsVisible ? 'auto' : 'none'}>
              {/* Song metadata */}
              <View style={styles.controlMeta}>
                <Text style={styles.controlTitle} numberOfLines={1}>{title}</Text>
                <Text style={styles.controlArtist} numberOfLines={1}>{artist}</Text>
              </View>

              {/* Control buttons */}
              <View style={styles.controlButtons}>
                {/* Play/Pause */}
                <TouchableOpacity
                  style={[styles.controlBtn, playerStatus === 'ERROR' && { opacity: 0.4 }]}
                  onPress={handlePlayPause}
                  activeOpacity={0.7}
                  disabled={playerStatus === 'ERROR'}
                >
                  <Ionicons
                    name={playerStatus === 'PLAYING' ? 'pause' : 'play'}
                    size={18}
                    color="#FFF"
                  />
                </TouchableOpacity>

                {/* Re-sync Live */}
                <TouchableOpacity
                  style={styles.controlBtn}
                  onPress={handleResyncLive}
                  activeOpacity={0.7}
                >
                  <Ionicons name="sync" size={16} color="#FFF" />
                </TouchableOpacity>

                {/* Listen Only mode */}
                <TouchableOpacity
                  style={[styles.controlBtn, isListenOnly && { backgroundColor: colors.primary }]}
                  onPress={onToggleListenOnly}
                  activeOpacity={0.7}
                >
                  <Ionicons name="headset" size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
            </Animated.View>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    overflow: 'hidden',
    position: 'relative',
    borderBottomWidth: 1,
  },
  hiddenPlayerContainer: {
    height: 1,
    aspectRatio: undefined,
    opacity: 0.01,
    overflow: 'hidden',
    position: 'absolute',
    left: -9999,
  },
  playerWrapper: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  interactionBlocker: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  controlBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 20,
  },
  controlMeta: {
    flex: 1,
    marginRight: 10,
  },
  controlTitle: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  controlArtist: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    marginTop: 1,
  },
  controlButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  centerControlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    zIndex: 25,
  },
  centerMainBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(10, 11, 15, 0.75)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerResyncBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(10, 11, 15, 0.75)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 30,
  },
  errorTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  errorSubtitle: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
  },
  recoveringBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  recoveringText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  gestureOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 25,
  },
  gesturePlayCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  gestureText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  gestureSubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 3,
  },
  streamEndedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 15, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 40,
  },
  streamEndedBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  streamEndedTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  streamEndedSub: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 13,
    textAlign: 'center',
  },
  listenOnlyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  miniThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#1E1E2E',
  },
  miniMeta: {
    flex: 1,
    marginRight: 8,
  },
  miniTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  miniArtist: {
    fontSize: 11,
    marginTop: 2,
  },
  miniPlayBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  watchVideoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  watchVideoText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
