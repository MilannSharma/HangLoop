import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { api, UserProfile } from '../services/api';

export interface QueueItem {
  id: string;
  videoId: string;
  title: string;
  artist?: string;
  thumbnail: string;
  addedBy: string;
  durationSeconds: number;
}

interface QueueModalProps {
  visible: boolean;
  onClose: () => void;
  currentVideo: QueueItem | null;
  queue: QueueItem[];
  onAddToQueue: (video: QueueItem) => void;
  roomTheme?: string;
  currentUser?: UserProfile;
}

export const QueueModal: React.FC<QueueModalProps> = ({
  visible,
  onClose,
  currentVideo,
  queue,
  onAddToQueue,
  roomTheme = 'BOLLYWOOD',
  currentUser,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [quickSuggestions, setQuickSuggestions] = useState<any[]>([]);

  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load quick suggestions from database on mount / when modal opens
  useEffect(() => {
    if (visible) {
      loadQuickSuggestions();
    } else {
      setSearchQuery('');
      setSearchResults([]);
      setHasSearched(false);
    }
  }, [visible, roomTheme]);

  const loadQuickSuggestions = async () => {
    try {
      const res = await api.searchCatalogSongs('', roomTheme);
      if (res.success && res.songs && res.songs.length > 0) {
        setQuickSuggestions(res.songs.slice(0, 4));
      }
    } catch (e) {
      console.warn('Failed loading quick suggestions:', e);
    }
  };

  // Live Debounced Database Search
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    if (!text.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await api.searchCatalogSongs(text.trim(), roomTheme);
        if (res.success) {
          setSearchResults(res.songs || []);
        } else {
          setSearchResults([]);
        }
      } catch (e) {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
        setHasSearched(true);
      }
    }, 350);
  };

  // Add DB Song to Queue
  const handleQueueDbSong = (song: any) => {
    const queueItem: QueueItem = {
      id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      videoId: song.youtube_video_id,
      title: song.title || `${song.song_name} - ${song.artist}`,
      artist: song.artist || 'Official',
      thumbnail: song.thumbnail_url || `https://img.youtube.com/vi/${song.youtube_video_id}/hqdefault.jpg`,
      addedBy: currentUser?.username || 'You',
      durationSeconds: song.duration_seconds || 240,
    };

    onAddToQueue(queueItem);
    Alert.alert('Queued!', `"${queueItem.title}" was added to the room queue.`);
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
  };

  // Request Missing Song from Super Admin
  const handleRequestSong = async () => {
    if (!searchQuery.trim()) return;

    setIsSubmittingRequest(true);
    try {
      const username = currentUser?.username || 'Anonymous';
      const email = currentUser?.email || undefined;
      const res = await api.requestSong(searchQuery.trim(), username, email);

      if (res.success) {
        Alert.alert(
          'Request Submitted',
          res.message || `Song request for "${searchQuery}" submitted to Super Admin! It will be verified and synced shortly.`
        );
        setSearchQuery('');
        setSearchResults([]);
        setHasSearched(false);
      } else {
        Alert.alert('Notice', res.message || res.error || 'Could not submit song request');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to submit request');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.dismissOverlay} onPress={onClose} activeOpacity={1} />

        <View style={[styles.modalSheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Fixed Sheet Header */}
          <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="list" size={22} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Room Music Queue</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Full Scrollable Content */}
          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
          >
            {/* 1. Now Playing Banner */}
            {currentVideo && (
              <View style={[styles.nowPlayingBox, { backgroundColor: 'rgba(99,102,241,0.12)', borderColor: colors.primary }]}>
                <View style={styles.nowPlayingBadge}>
                  <Ionicons name="radio" size={13} color={colors.primary} style={{ marginRight: 5 }} />
                  <Text style={[styles.nowPlayingBadgeText, { color: colors.primary }]}>NOW PLAYING</Text>
                </View>
                <Text style={[styles.nowPlayingTitle, { color: colors.text }]} numberOfLines={1}>
                  {currentVideo.title}
                </Text>
                <Text style={[styles.nowPlayingSub, { color: colors.textSecondary }]} numberOfLines={1}>
                  {currentVideo.artist ? `Artist: ${currentVideo.artist} • ` : ''}Requested by @{currentVideo.addedBy || 'Hangloop Auto'}
                </Text>
              </View>
            )}

            {/* 2. Add Song to Queue (Database Search Only) */}
            <View style={styles.sectionWrapper}>
              <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>Add Song to Queue</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <Ionicons name="search" size={18} color={colors.textMuted} style={{ marginLeft: 12 }} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Search songs from database…"
                  placeholderTextColor={colors.textMuted}
                  value={searchQuery}
                  onChangeText={handleSearchChange}
                  autoCorrect={false}
                />
                {isSearching ? (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 12 }} />
                ) : searchQuery.length > 0 ? (
                  <TouchableOpacity onPress={() => handleSearchChange('')} style={{ padding: 8, marginRight: 4 }}>
                    <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {/* 3. Search Results or "Song Not Found -> Request This Song" */}
            {searchQuery.trim().length > 0 && (
              <View style={styles.searchResultsWrapper}>
                {isSearching ? (
                  <View style={styles.searchLoadingBox}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.searchLoadingText, { color: colors.textSecondary }]}>Searching database...</Text>
                  </View>
                ) : searchResults.length > 0 ? (
                  <View style={styles.resultsList}>
                    <Text style={[styles.resultsCountText, { color: colors.primary }]}>
                      Found {searchResults.length} verified songs:
                    </Text>
                    {searchResults.map((song) => (
                      <View
                        key={song.id || song.youtube_video_id}
                        style={[styles.songResultCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
                      >
                        <Image
                          source={{ uri: song.thumbnail_url || `https://img.youtube.com/vi/${song.youtube_video_id}/hqdefault.jpg` }}
                          style={styles.songResultThumb}
                        />
                        <View style={styles.songResultMeta}>
                          <Text style={[styles.songResultTitle, { color: colors.text }]} numberOfLines={1}>
                            {song.title || song.song_name}
                          </Text>
                          <Text style={[styles.songResultArtist, { color: colors.textSecondary }]} numberOfLines={1}>
                            {song.artist} {song.album_or_movie ? `• ${song.album_or_movie}` : ''}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={[styles.queueAddBtn, { backgroundColor: colors.primary }]}
                          onPress={() => handleQueueDbSong(song)}
                        >
                          <Ionicons name="add" size={16} color="#FFF" />
                          <Text style={styles.queueAddBtnText}>Queue</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                ) : hasSearched ? (
                  /* SONG NOT FOUND IN DB -> REQUEST THIS SONG */
                  <View style={[styles.notFoundCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                    <Ionicons name="alert-circle-outline" size={26} color="#F59E0B" />
                    <Text style={[styles.notFoundTitle, { color: colors.text }]}>No song exists, bro. Request this song.</Text>
                    <Text style={[styles.notFoundSubtitle, { color: colors.textSecondary }]}>
                      Submit "{searchQuery}" to Super Admin. It will be verified and added to the database.
                    </Text>
                    <TouchableOpacity
                      style={[styles.requestBtn, { backgroundColor: '#8B5CF6' }]}
                      onPress={handleRequestSong}
                      disabled={isSubmittingRequest}
                    >
                      {isSubmittingRequest ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <>
                          <Ionicons name="paper-plane" size={15} color="#FFF" style={{ marginRight: 6 }} />
                          <Text style={styles.requestBtnText}>Request This Song</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            )}

            {/* 4. Quick Add Suggestions (From Database) */}
            {searchQuery.trim().length === 0 && quickSuggestions.length > 0 && (
              <View style={styles.sectionWrapper}>
                <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>Quick Add Suggestions</Text>
                <View style={styles.suggestionsList}>
                  {quickSuggestions.map((sug) => (
                    <TouchableOpacity
                      key={sug.id || sug.youtube_video_id}
                      style={[styles.chip, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
                      onPress={() => handleQueueDbSong(sug)}
                    >
                      <Image
                        source={{ uri: sug.thumbnail_url || `https://img.youtube.com/vi/${sug.youtube_video_id}/hqdefault.jpg` }}
                        style={styles.chipThumb}
                      />
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={[styles.chipText, { color: colors.text }]} numberOfLines={1}>
                          {sug.song_name || sug.title}
                        </Text>
                        <Text style={[styles.chipSubText, { color: colors.textSecondary }]} numberOfLines={1}>
                          {sug.artist}
                        </Text>
                      </View>
                      <Ionicons name="add-circle" size={22} color={colors.primary} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* 5. Up Next User Queue Section (App Queue plays in background silently) */}
            {(() => {
              const userQueue = (queue || []).filter(
                (item) => item.addedBy !== 'Auto Theme Bot' && item.addedBy !== 'Hangloop Auto'
              );

              return (
                <View style={styles.sectionWrapper}>
                  <View style={styles.upNextHeaderRow}>
                    <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
                      Up Next ({userQueue.length})
                    </Text>
                    {userQueue.length > 0 && (
                      <Text style={[styles.queueLiveBadge, { color: '#10B981' }]}>• Playing Next</Text>
                    )}
                  </View>

                  {userQueue.length === 0 ? (
                    <View style={[styles.emptyBox, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                      <Ionicons name="musical-notes-outline" size={36} color={colors.textMuted} />
                      <Text style={[styles.emptyTitle, { color: colors.text }]}>Queue is empty</Text>
                      <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                        Continuous music is active. Search and queue any song above to play next!
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.queueCardsList}>
                      {userQueue.map((item, index) => (
                        <View
                          key={`${item.id || item.videoId}-${index}`}
                          style={[styles.queueCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
                        >
                          <View style={[styles.queueBadgeIndex, { backgroundColor: 'rgba(99,102,241,0.15)' }]}>
                            <Text style={[styles.queueIndexText, { color: colors.primary }]}>#{index + 1}</Text>
                          </View>
                          <Image
                            source={{ uri: item.thumbnail || `https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg` }}
                            style={styles.itemThumb}
                          />
                          <View style={styles.itemInfo}>
                            <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={1}>
                              {item.title}
                            </Text>
                            <Text style={[styles.itemSub, { color: colors.textSecondary }]} numberOfLines={1}>
                              {item.artist ? `${item.artist} • ` : ''}Added by @{item.addedBy || 'You'}
                            </Text>
                          </View>
                          <View style={styles.upNextPlayingIcon}>
                            <Ionicons name="musical-notes" size={16} color={colors.primary} />
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })()}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  dismissOverlay: {
    flex: 1,
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    height: '88%',
    display: 'flex',
    flexDirection: 'column',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '900',
  },
  closeBtn: {
    padding: 4,
  },
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  nowPlayingBox: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  nowPlayingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  nowPlayingBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  nowPlayingTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  nowPlayingSub: {
    fontSize: 12,
    marginTop: 3,
  },
  sectionWrapper: {
    marginBottom: 18,
  },
  sectionHeading: {
    fontSize: 11.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
  },
  searchResultsWrapper: {
    marginBottom: 18,
  },
  searchLoadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  searchLoadingText: {
    fontSize: 13,
  },
  resultsList: {
    gap: 8,
  },
  resultsCountText: {
    fontSize: 11.5,
    fontWeight: '800',
    marginBottom: 4,
  },
  songResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  songResultThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 10,
  },
  songResultMeta: {
    flex: 1,
    marginRight: 8,
  },
  songResultTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  songResultArtist: {
    fontSize: 11.5,
    marginTop: 2,
  },
  queueAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  queueAddBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  notFoundCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    textAlign: 'center',
    gap: 8,
  },
  notFoundTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  notFoundSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },
  requestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  requestBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  suggestionsList: {
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipThumb: {
    width: 38,
    height: 38,
    borderRadius: 8,
    marginRight: 10,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  chipSubText: {
    fontSize: 11,
    marginTop: 2,
  },
  upNextHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  queueLiveBadge: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyBox: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
  },
  queueCardsList: {
    gap: 8,
  },
  queueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  queueBadgeIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  queueIndexText: {
    fontSize: 12,
    fontWeight: '900',
  },
  itemThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 10,
  },
  itemInfo: {
    flex: 1,
    marginRight: 6,
  },
  itemTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  itemSub: {
    fontSize: 11.5,
    marginTop: 2,
  },
  upNextPlayingIcon: {
    padding: 4,
  },
});
