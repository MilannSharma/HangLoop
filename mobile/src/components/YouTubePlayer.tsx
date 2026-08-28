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
            .ytp-title-link,
            .ytp-share-button,
            .ytp-overflow-button,
            .ytp-cards-button,
            .ytp-contextmenu,
            .ytp-subtitles-button,
            .ytp-larger-tap-buttons,
            .ytp-copylink-button,
            .ytp-impression-link,
            .ytp-paid-content-overlay,
            .ytm-engagement-panel,
            .engagement-panel-container,
            .comment-section,
            ytm-comment-section-renderer,
            ytd-engagement-panel-section-list-renderer,
            #player-control-overlay,
            .ytp-expand-pause-overlay,
            .ytp-cued-thumbnail-overlay {
              display: none !important;
              opacity: 0 !important;
              visibility: hidden !important;
              pointer-events: none !important;
            }
            body, html {
              overflow: hidden !important;
              user-select: none !important;
              -webkit-user-select: none !important;
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
  const targetSeekPositionRef = useRef(seekPosition);

  // Keep target seek position synchronized with latest props
  useEffect(() => {
    targetSeekPositionRef.current = seekPosition;
  }, [seekPosition]);

  const [containerHeight, setContainerHeight] = useState(220);

  const onTrackEndedRef = useRef(onTrackEnded);
  const onTrackFailedRef = useRef(onTrackFailed);
  useEffect(() => { onTrackEndedRef.current = onTrackEnded; }, [onTrackEnded]);
  useEffect(() => { onTrackFailedRef.current = onTrackFailed; }, [onTrackFailed]);

  const [playerStatus, setPlayerStatus] = useState<RealPlayerStatus>('PLAYING');
  const [errorCode, setErrorCode] = useState<number | null>(null);
  const [needUserGesture, setNeedUserGesture] = useState(false);

  // ── Auto-hide controls after 3 seconds ──
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeVideoId = videoId || 'BddP6PYo2gs';
  const loadedVideoRef = useRef<string>('');

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
    }, 3000);
  }, [controlsOpacity]);

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
            start: Math.max(0, Math.floor(targetSeekPositionRef.current || seekPosition)),
          },
          events: {
            onReady: (event: any) => {
              if (!isMounted) return;
              playerReadyRef.current = true;
              loadedVideoRef.current = activeVideoId;
              try {
                const targetSec = Math.max(0, Math.floor(targetSeekPositionRef.current || seekPosition));
                if (targetSec > 0) {
                  event.target.seekTo(targetSec, true);
                }
                event.target.playVideo();
                if (typeof event.target.unMute === 'function') event.target.unMute();
              } catch (e) {
                setNeedUserGesture(true);
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
                // Auto-recover if supposed to be playing
                if (isPlaying && !isStreamEnded) {
                  try { event.target.playVideo(); } catch (e) {}
                }
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
  }, [playerContainerId, activeVideoId]);

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

    const targetSec = Math.max(0, Math.floor(seekPosition));

    if (Platform.OS === 'web') {
      const player = webPlayerInstanceRef.current;
      if (player && playerReadyRef.current && typeof player.loadVideoById === 'function') {
        try {
          player.loadVideoById({
            videoId: activeVideoId,
            startSeconds: targetSec,
          });
          player.playVideo();
          if (typeof player.unMute === 'function') player.unMute();
        } catch (e) {}
      }
    } else {
      if (nativePlayerRef.current && typeof (nativePlayerRef.current as any).seekTo === 'function') {
        try {
          (nativePlayerRef.current as any).seekTo(targetSec, true);
        } catch (e) {}
      }
    }
  }, [activeVideoId, seekPosition, resetHideTimer]);

  // ──────────────────────────────────────────────────────────────
  // 3. LIVE SEEK SYNC EFFECT (Auto-syncs on unpause, unlock, etc.)
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (seekPosition >= 0 && playerReadyRef.current) {
      const targetSec = Math.max(0, Math.floor(seekPosition));
      if (Platform.OS === 'web') {
        const player = webPlayerInstanceRef.current;
        if (player && typeof player.seekTo === 'function') {
          try {
            const current = typeof player.getCurrentTime === 'function' ? player.getCurrentTime() : -1;
            if (current < 0 || Math.abs(current - targetSec) > 2) {
              player.seekTo(targetSec, true);
            }
            if (isPlaying && !isStreamEnded) {
              player.playVideo();
              if (typeof player.unMute === 'function') player.unMute();
            }
          } catch (e) {}
        }
      } else {
        try {
          const player = nativePlayerRef.current as any;
          if (player && typeof player.getCurrentTime === 'function') {
            player.getCurrentTime().then((current: number) => {
              if (Math.abs(current - targetSec) > 2) {
                player.seekTo(targetSec, true);
              }
            }).catch(() => {
              player.seekTo(targetSec, true);
            });
          } else if (player && typeof player.seekTo === 'function') {
            player.seekTo(targetSec, true);
          }
        } catch (e) {}
      }
    }
  }, [seekPosition, isPlaying, isStreamEnded]);

  // ──────────────────────────────────────────────────────────────
  // 4. Native State Handlers
  // ──────────────────────────────────────────────────────────────
  const handleNativeStateChange = useCallback((state: string) => {
    console.log('[Native YT State]:', state);
    if (state === 'playing') {
      setPlayerStatus('PLAYING');
      setErrorCode(null);
      setNeedUserGesture(false);
    } else if (state === 'paused') {
      setPlayerStatus('PAUSED');
      // If the song should be playing and wasn't paused by player controls, auto-resume
      if (isPlaying && !isStreamEnded && nativePlayerRef.current) {
        // Player will remain playing via `play={isPlaying && !isStreamEnded}`
      }
    } else if (state === 'buffering') {
      setPlayerStatus('BUFFERING');
    } else if (state === 'ended') {
      setPlayerStatus('ENDED');
      if (onTrackEndedRef.current) onTrackEndedRef.current();
    }
  }, [isPlaying, isStreamEnded]);

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
    // Instant Auto Live-Seek on entry
    const targetSec = Math.max(0, Math.floor(targetSeekPositionRef.current));
    if (targetSec > 0) {
      try {
        (nativePlayerRef.current as any)?.seekTo(targetSec, true);
      } catch (e) {}
    }
  }, []);

  // ──────────────────────────────────────────────────────────────
  // 5. Play/Pause Sync
  // ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (Platform.OS === 'web') {
      const player = webPlayerInstanceRef.current;
      if (player && playerReadyRef.current && typeof player.playVideo === 'function') {
        try {
          if (isPlaying && !isStreamEnded) {
            player.playVideo();
            if (typeof player.unMute === 'function') player.unMute();
          } else {
            player.pauseVideo();
          }
        } catch (e) {}
      }
    }
  }, [isPlaying, isStreamEnded]);

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
    const targetSec = Math.max(0, Math.floor(targetSeekPositionRef.current || seekPosition));
    if (Platform.OS === 'web') {
      const player = webPlayerInstanceRef.current;
      if (player && playerReadyRef.current) {
        try {
          if (typeof player.seekTo === 'function') {
            player.seekTo(targetSec, true);
          }
          player.playVideo();
          if (typeof player.unMute === 'function') player.unMute();
        } catch (e) {}
      }
    } else {
      try {
        (nativePlayerRef.current as any)?.seekTo(targetSec, true);
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

  const handleOverlayTap = useCallback(() => {
    if (controlsVisible) {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      Animated.timing(controlsOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setControlsVisible(false);
      });
    } else {
      resetHideTimer();
    }
  }, [controlsVisible, resetHideTimer, controlsOpacity]);

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
        <View style={styles.playerWrapper} pointerEvents="none">
          {Platform.OS === 'web' ? (
            React.createElement('div', {
              id: playerContainerId,
              style: { width: '100%', height: '100%', pointerEvents: 'none' }
            })
          ) : (
            <YoutubePlayer
              ref={nativePlayerRef}
              height={isListenOnly ? 1 : containerHeight}
              play={isPlaying && !isStreamEnded}
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
                start: Math.max(0, Math.floor(seekPosition)),
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

            {/* HANGLOOP CONTROL BAR — auto-hides after 3 seconds */}
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
    elevation: 10,
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
