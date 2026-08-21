import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Modal,
  Alert,
  FlatList,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { api, CatalogStats, CatalogSongItem } from '../services/api';

interface MusicCatalogScreenProps {
  onBack: () => void;
}

const THEMES = ['ALL', 'BOLLYWOOD', 'PUNJABI', 'TRENDING'];
const STATUSES = ['ALL', 'PLAYABLE', 'FAILED', 'DISABLED'];

export const MusicCatalogScreen: React.FC<MusicCatalogScreenProps> = ({ onBack }) => {
  const { colors } = useTheme();

  // State: Stats
  const [stats, setStats] = useState<CatalogStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // State: Songs List
  const [songs, setSongs] = useState<CatalogSongItem[]>([]);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // State: Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [geminiPrompt, setGeminiPrompt] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryPreview, setDiscoveryPreview] = useState<any>(null);
  const [isAddingBatch, setIsAddingBatch] = useState(false);
  const [isResyncing, setIsResyncing] = useState(false);

  // Manual Add Fields
  const [manualUrl, setManualUrl] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [manualArtist, setManualArtist] = useState('');
  const [manualMovie, setManualMovie] = useState('');
  const [manualYear, setManualYear] = useState('2023');
  const [manualTheme, setManualTheme] = useState('BOLLYWOOD');
  const [isAddingManual, setIsAddingManual] = useState(false);

  // Active Screen Tab: 'CATALOG' | 'REQUESTS'
  const [activeTab, setActiveTab] = useState<'CATALOG' | 'REQUESTS'>('CATALOG');
  const [songRequests, setSongRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [syncingRequestId, setSyncingRequestId] = useState<string | null>(null);

  // ──────────────────────────────────────────────────────────────
  // Load Metrics
  // ──────────────────────────────────────────────────────────────
  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await api.fetchCatalogStats();
      if (res.success && res.stats) {
        setStats(res.stats);
      }
    } catch (e) {
      console.warn('Error loading stats:', e);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // ──────────────────────────────────────────────────────────────
  // Load Songs
  // ──────────────────────────────────────────────────────────────
  const loadSongs = useCallback(async (currentPage = 1) => {
    setLoadingSongs(true);
    try {
      const res = await api.fetchCatalogSongs({
        page: currentPage,
        limit: 15,
        search: searchQuery,
        theme: selectedTheme,
        status: selectedStatus,
      });
      if (res.success && res.songs) {
        setSongs(res.songs);
        if (res.pagination) {
          setPage(res.pagination.page);
          setTotalPages(res.pagination.totalPages || 1);
        }
      }
    } catch (e) {
      console.warn('Error loading songs:', e);
    } finally {
      setLoadingSongs(false);
    }
  }, [searchQuery, selectedTheme, selectedStatus]);

  // ──────────────────────────────────────────────────────────────
  // Load Song Requests (From Room Users)
  // ──────────────────────────────────────────────────────────────
  const loadRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const res = await api.fetchAdminSongRequests('ALL');
      if (res.success && res.requests) {
        setSongRequests(res.requests);
        setPendingRequestsCount(res.pendingCount || 0);
      }
    } catch (e) {
      console.warn('Error loading song requests:', e);
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    loadSongs(1);
    loadRequests();
  }, [loadStats, loadSongs, loadRequests]);

  // Super Admin: Sync & Add Requested Song
  const handleSyncSongRequest = async (requestItem: any) => {
    setSyncingRequestId(requestItem.id);
    try {
      const res = await api.syncAdminSongRequest(requestItem.id);
      if (res.success) {
        Alert.alert(
          'Song Synced & Added!',
          `"${res.songTitle || requestItem.query}" was verified, added to the database, and is now searchable!`
        );
        loadRequests();
        loadStats();
        loadSongs(1);
      } else {
        Alert.alert('Sync Failed', res.error || 'Could not verify a playable source for this song.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to sync requested song');
    } finally {
      setSyncingRequestId(null);
    }
  };

  // ──────────────────────────────────────────────────────────────
  // Handle Resync Catalog
  // ──────────────────────────────────────────────────────────────
  const handleResync = async () => {
    Alert.alert(
      'Resync Catalog',
      'This will re-validate existing catalog songs and update playback status without wiping the database. Proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Resync',
          onPress: async () => {
            setIsResyncing(true);
            try {
              const res = await api.resyncCatalog(geminiApiKey);
              if (res.success) {
                Alert.alert(
                  'Resync Complete',
                  `Rechecked: ${res.result?.recheckedCount || 0}, Newly Added: ${res.result?.newlyAddedCount || 0}, Marked Failed: ${res.result?.markedFailedCount || 0}`
                );
                loadStats();
                loadSongs(page);
              } else {
                Alert.alert('Resync Failed', res.error || 'Unknown error');
              }
            } catch (e: any) {
              Alert.alert('Error', e.message);
            } finally {
              setIsResyncing(false);
            }
          },
        },
      ]
    );
  };

  // ──────────────────────────────────────────────────────────────
  // Handle Gemini Discovery & Preview
  // ──────────────────────────────────────────────────────────────
  const handleRunDiscovery = async () => {
    if (!geminiApiKey && !geminiPrompt) {
      Alert.alert('API Key Required', 'Please provide a valid Gemini API Key to discover songs.');
      return;
    }

    setIsDiscovering(true);
    try {
      const res = await api.discoverCatalogPreview(geminiApiKey, geminiPrompt);
      if (res.success && res.preview) {
        setDiscoveryPreview(res.preview);
      } else {
        Alert.alert('Discovery Failed', res.error || 'Could not fetch songs from Gemini');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleConfirmAddBatch = async () => {
    if (!discoveryPreview || !discoveryPreview.playable || discoveryPreview.playable.length === 0) {
      Alert.alert('No Songs', 'No verified playable songs to add.');
      return;
    }

    setIsAddingBatch(true);
    try {
      const res = await api.addCatalogBatch(discoveryPreview.playable);
      if (res.success) {
        Alert.alert('Success', `Added ${res.result?.addedCount || 0} songs to the Music Catalog!`);
        setShowAddModal(false);
        setDiscoveryPreview(null);
        setGeminiPrompt('');
        loadStats();
        loadSongs(1);
      } else {
        Alert.alert('Add Failed', res.error || 'Failed adding songs batch');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setIsAddingBatch(false);
    }
  };

  // ──────────────────────────────────────────────────────────────
  // Handle Manual Add Single Song
  // ──────────────────────────────────────────────────────────────
  const handleAddManualSong = async () => {
    if (!manualUrl.trim()) {
      Alert.alert('Missing Field', 'Please enter a YouTube URL or Video ID');
      return;
    }

    setIsAddingManual(true);
    try {
      const res = await api.addCatalogSingle({
        youtube_url: manualUrl.trim(),
        song_name: manualTitle.trim() || undefined,
        artist: manualArtist.trim() || undefined,
        album_or_movie: manualMovie.trim() || undefined,
        release_year: Number(manualYear) || 2023,
        theme: manualTheme,
      });

      if (res.success) {
        Alert.alert('Success', 'Song validated and added to catalog!');
        setShowManualModal(false);
        setManualUrl('');
        setManualTitle('');
        setManualArtist('');
        setManualMovie('');
        loadStats();
        loadSongs(1);
      } else {
        Alert.alert('Validation Failed', res.message || res.error || 'YouTube video is not embeddable');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setIsAddingManual(false);
    }
  };

  // ──────────────────────────────────────────────────────────────
  // Toggle / Delete Song
  // ──────────────────────────────────────────────────────────────
  const handleToggleStatus = async (song: CatalogSongItem) => {
    const nextStatus = song.playable_status === 'PLAYABLE' ? 'DISABLED' : 'PLAYABLE';
    try {
      await api.toggleCatalogStatus(song.id, nextStatus);
      loadSongs(page);
      loadStats();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleDeleteSong = (song: CatalogSongItem) => {
    Alert.alert(
      'Remove Song',
      `Are you sure you want to remove "${song.song_name || song.title}" from the catalog?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteCatalogSong(song.id);
              loadSongs(page);
              loadStats();
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Music Catalog</Text>
          <Text style={[styles.headerSubtitle, { color: colors.primary }]}>Super Admin Portal</Text>
        </View>
        <TouchableOpacity
          style={[styles.headerActionBtn, { backgroundColor: colors.badgeBg }]}
          onPress={() => {
            loadStats();
            loadSongs(page);
          }}
        >
          <Ionicons name="refresh" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ── 1. METRICS DASHBOARD ── */}
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="musical-notes" size={22} color={colors.primary} />
            <Text style={[styles.metricNumber, { color: colors.text }]}>
              {loadingStats ? '-' : stats?.totalSongs?.toLocaleString() || 0}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Total Songs</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="checkmark-circle" size={22} color="#10B981" />
            <Text style={[styles.metricNumber, { color: '#10B981' }]}>
              {loadingStats ? '-' : stats?.playable?.toLocaleString() || 0}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Playable</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="alert-circle" size={22} color="#EF4444" />
            <Text style={[styles.metricNumber, { color: '#EF4444' }]}>
              {loadingStats ? '-' : stats?.failedOrDisabled?.toLocaleString() || 0}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Failed / Disabled</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="flame" size={22} color="#F59E0B" />
            <Text style={[styles.metricNumber, { color: '#F59E0B' }]}>
              {loadingStats ? '-' : stats?.bollywood?.toLocaleString() || 0}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Bollywood</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="flash" size={22} color="#3B82F6" />
            <Text style={[styles.metricNumber, { color: '#3B82F6' }]}>
              {loadingStats ? '-' : stats?.punjabi?.toLocaleString() || 0}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Punjabi Hits</Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="trending-up" size={22} color="#8B5CF6" />
            <Text style={[styles.metricNumber, { color: '#8B5CF6' }]}>
              {loadingStats ? '-' : stats?.trending?.toLocaleString() || 0}
            </Text>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Trending</Text>
          </View>
        </View>

        {/* Resync Info banner */}
        <View style={[styles.syncBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="time-outline" size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
          <Text style={[styles.syncText, { color: colors.textSecondary }]}>
            Last Resync: {stats?.lastResync ? new Date(stats.lastResync).toLocaleString() : 'Never'}
          </Text>
        </View>

        {/* ── 2. ACTIONS BAR ── */}
        <View style={styles.actionsBar}>
          <TouchableOpacity
            style={[styles.mainActionBtn, { backgroundColor: colors.primary }]}
            onPress={handleResync}
            disabled={isResyncing}
          >
            {isResyncing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="sync" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.mainActionText}>Resync Catalog</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mainActionBtn, { backgroundColor: '#8B5CF6' }]}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="sparkles" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.mainActionText}>AI Add Songs</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mainActionBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
            onPress={() => setShowManualModal(true)}
          >
            <Ionicons name="add" size={18} color={colors.text} style={{ marginRight: 4 }} />
            <Text style={[styles.mainActionText, { color: colors.text }]}>Add Song</Text>
          </TouchableOpacity>
        </View>

        {/* ── 3. TAB SWITCHER (CATALOG vs SONG REQUESTS) ── */}
        <View style={[styles.tabSwitcher, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'CATALOG' && { backgroundColor: colors.primary },
            ]}
            onPress={() => setActiveTab('CATALOG')}
          >
            <Ionicons
              name="musical-notes"
              size={16}
              color={activeTab === 'CATALOG' ? '#FFF' : colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.tabBtnText, { color: activeTab === 'CATALOG' ? '#FFF' : colors.textSecondary }]}>
              Catalog Songs ({stats?.totalSongs || songs.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'REQUESTS' && { backgroundColor: '#8B5CF6' },
            ]}
            onPress={() => {
              setActiveTab('REQUESTS');
              loadRequests();
            }}
          >
            <Ionicons
              name="mail"
              size={16}
              color={activeTab === 'REQUESTS' ? '#FFF' : colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.tabBtnText, { color: activeTab === 'REQUESTS' ? '#FFF' : colors.textSecondary }]}>
              Song Requests {pendingRequestsCount > 0 ? `(${pendingRequestsCount})` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── 4A. TAB: SONG REQUESTS ── */}
        {activeTab === 'REQUESTS' && (
          <View style={styles.requestsSection}>
            <View style={styles.songsHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>User Song Requests</Text>
              <TouchableOpacity onPress={loadRequests}>
                <Ionicons name="refresh" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {loadingRequests ? (
              <View style={styles.loaderWrap}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : songRequests.length === 0 ? (
              <View style={[styles.emptyWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Ionicons name="mail-open-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.text }]}>No Song Requests</Text>
                <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                  When live room users search for missing songs and click "Request This Song", they will appear here.
                </Text>
              </View>
            ) : (
              songRequests.map((req) => {
                const isPending = req.status === 'PENDING';
                const isSyncing = syncingRequestId === req.id;

                return (
                  <View
                    key={req.id}
                    style={[styles.requestCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <View style={styles.requestCardHeader}>
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={[styles.requestQueryTitle, { color: colors.text }]}>
                          "{req.query}"
                        </Text>
                        <Text style={[styles.requestMetaText, { color: colors.textSecondary }]}>
                          By @{req.requested_by} • {req.created_at ? new Date(req.created_at).toLocaleDateString() : 'Recent'}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.requestStatusBadge,
                          { backgroundColor: isPending ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.requestStatusBadgeText,
                            { color: isPending ? '#F59E0B' : '#10B981' },
                          ]}
                        >
                          {req.status}
                        </Text>
                      </View>
                    </View>

                    {req.failure_reason && (
                      <Text style={styles.requestFailureText}>
                        ⚠️ {req.failure_reason}
                      </Text>
                    )}

                    {isPending && (
                      <TouchableOpacity
                        style={[styles.syncReqBtn, { backgroundColor: colors.primary }]}
                        onPress={() => handleSyncSongRequest(req)}
                        disabled={isSyncing}
                      >
                        {isSyncing ? (
                          <ActivityIndicator size="small" color="#FFF" />
                        ) : (
                          <>
                            <Ionicons name="sparkles" size={15} color="#FFF" style={{ marginRight: 6 }} />
                            <Text style={styles.syncReqBtnText}>Re-sync / Add Song</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ── 4B. TAB: CATALOG SONGS ── */}
        {activeTab === 'CATALOG' && (
          <>
            {/* Search & Filters */}
            <View style={[styles.searchWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="search" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search song, artist, movie, or YouTube ID..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={(t) => setSearchQuery(t)}
                onSubmitEditing={() => loadSongs(1)}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              ) : null}
            </View>

        {/* Theme Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {THEMES.map((theme) => (
            <TouchableOpacity
              key={theme}
              style={[
                styles.chip,
                { backgroundColor: selectedTheme === theme ? colors.primary : colors.surface, borderColor: colors.border },
              ]}
              onPress={() => setSelectedTheme(theme)}
            >
              <Text style={[styles.chipText, { color: selectedTheme === theme ? '#FFF' : colors.textSecondary }]}>
                {theme}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Status Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.filterRow, { marginTop: 6 }]}>
          {STATUSES.map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.chip,
                { backgroundColor: selectedStatus === status ? '#6366F1' : colors.surface, borderColor: colors.border },
              ]}
              onPress={() => setSelectedStatus(status)}
            >
              <Text style={[styles.chipText, { color: selectedStatus === status ? '#FFF' : colors.textSecondary }]}>
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── 4. SONGS LIST ── */}
        <View style={styles.songsSection}>
          <View style={styles.songsHeaderRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Catalog Songs</Text>
            <Text style={[styles.pageIndicator, { color: colors.textSecondary }]}>
              Page {page} of {totalPages}
            </Text>
          </View>

          {loadingSongs ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : songs.length === 0 ? (
            <View style={[styles.emptyWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="musical-note-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.text }]}>No songs found in catalog</Text>
              <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
                Click "AI Add Songs" or "Resync Catalog" to populate tracks.
              </Text>
            </View>
          ) : (
            songs.map((song) => {
              const isPlayable = song.playable_status === 'PLAYABLE' && song.is_active === 1;
              const isFailed = song.playable_status === 'FAILED';

              return (
                <View
                  key={song.id || song.youtube_video_id}
                  style={[styles.songCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <Image source={{ uri: song.thumbnail_url }} style={styles.songThumb} />

                  <View style={styles.songMeta}>
                    <View style={styles.songTitleRow}>
                      <Text style={[styles.songName, { color: colors.text }]} numberOfLines={1}>
                        {song.song_name || song.title}
                      </Text>
                    </View>

                    <Text style={[styles.songArtist, { color: colors.textSecondary }]} numberOfLines={1}>
                      {song.artist} {song.album_or_movie ? `• ${song.album_or_movie}` : ''} ({song.release_year})
                    </Text>

                    <View style={styles.tagsRow}>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: isPlayable ? 'rgba(16,185,129,0.15)' : isFailed ? 'rgba(239,68,68,0.15)' : 'rgba(148,163,184,0.15)',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            { color: isPlayable ? '#10B981' : isFailed ? '#EF4444' : '#94A3B8' },
                          ]}
                        >
                          {song.playable_status}
                        </Text>
                      </View>

                      <View style={[styles.themeBadge, { backgroundColor: colors.badgeBg }]}>
                        <Text style={[styles.themeBadgeText, { color: colors.primary }]}>{song.theme}</Text>
                      </View>

                      <Text style={[styles.vidIdText, { color: colors.textSecondary }]}>{song.youtube_video_id}</Text>
                    </View>

                    {song.last_failure_reason ? (
                      <Text style={styles.failureReasonText} numberOfLines={1}>
                        ⚠️ {song.last_failure_reason}
                      </Text>
                    ) : null}
                  </View>

                  {/* Actions */}
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={[
                        styles.toggleBtn,
                        { backgroundColor: isPlayable ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)' },
                      ]}
                      onPress={() => handleToggleStatus(song)}
                    >
                      <Ionicons
                        name={isPlayable ? 'pause-circle' : 'play-circle'}
                        size={20}
                        color={isPlayable ? '#EF4444' : '#10B981'}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.deleteBtn, { backgroundColor: 'rgba(239,68,68,0.08)' }]}
                      onPress={() => handleDeleteSong(song)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}

          {/* Pagination buttons */}
          {totalPages > 1 ? (
            <View style={styles.paginationRow}>
              <TouchableOpacity
                style={[styles.pageBtn, { opacity: page <= 1 ? 0.4 : 1, backgroundColor: colors.surface, borderColor: colors.border }]}
                disabled={page <= 1}
                onPress={() => loadSongs(page - 1)}
              >
                <Ionicons name="chevron-back" size={18} color={colors.text} />
                <Text style={[styles.pageBtnText, { color: colors.text }]}>Previous</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.pageBtn, { opacity: page >= totalPages ? 0.4 : 1, backgroundColor: colors.surface, borderColor: colors.border }]}
                disabled={page >= totalPages}
                onPress={() => loadSongs(page + 1)}
              >
                <Text style={[styles.pageBtnText, { color: colors.text }]}>Next</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
        </>
      )}
      </ScrollView>

      {/* ── MODAL: AI ADD SONGS (GEMINI DISCOVERY) ── */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>AI Song Discovery</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  Gemini-powered 2000+ Bollywood song discovery & validation
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Gemini API Key (Optional if configured on backend)</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
                placeholder="Enter Gemini API Key..."
                placeholderTextColor={colors.textSecondary}
                value={geminiApiKey}
                onChangeText={setGeminiApiKey}
                secureTextEntry
              />

              <Text style={[styles.inputLabel, { color: colors.text, marginTop: 12 }]}>
                Custom Discovery Prompt (Optional)
              </Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, borderColor: colors.border, height: 70 }]}
                placeholder="e.g. Find 40 romantic Arijit Singh & Pritam Bollywood hits from 2015-2024"
                placeholderTextColor={colors.textSecondary}
                value={geminiPrompt}
                onChangeText={setGeminiPrompt}
                multiline
              />

              <TouchableOpacity
                style={[styles.discoveryRunBtn, { backgroundColor: '#8B5CF6' }]}
                onPress={handleRunDiscovery}
                disabled={isDiscovering}
              >
                {isDiscovering ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="search" size={16} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={styles.discoveryRunText}>Discover & Validate Candidates</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Discovery Results Preview */}
              {discoveryPreview ? (
                <View style={[styles.previewBox, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <Text style={[styles.previewTitle, { color: colors.text }]}>Validation Results Preview</Text>
                  <View style={styles.previewStatsRow}>
                    <Text style={[styles.previewStatItem, { color: '#10B981' }]}>
                      ✓ Playable: {discoveryPreview.playable?.length || 0}
                    </Text>
                    <Text style={[styles.previewStatItem, { color: colors.textSecondary }]}>
                      • Existing: {discoveryPreview.alreadyExisting?.length || 0}
                    </Text>
                    <Text style={[styles.previewStatItem, { color: '#EF4444' }]}>
                      ✕ Failed: {discoveryPreview.failed?.length || 0}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.addBatchBtn, { backgroundColor: colors.primary }]}
                    onPress={handleConfirmAddBatch}
                    disabled={isAddingBatch}
                  >
                    {isAddingBatch ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={styles.addBatchText}>
                        Add {discoveryPreview.playable?.length || 0} Verified Songs to Catalog
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── MODAL: MANUAL ADD SINGLE SONG ── */}
      <Modal visible={showManualModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Song Manually</Text>
              <TouchableOpacity onPress={() => setShowManualModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>YouTube URL or Video ID *</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
                placeholder="https://www.youtube.com/watch?v=..."
                placeholderTextColor={colors.textSecondary}
                value={manualUrl}
                onChangeText={setManualUrl}
              />

              <Text style={[styles.inputLabel, { color: colors.text, marginTop: 10 }]}>Song Name</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
                placeholder="e.g. Kesariya"
                placeholderTextColor={colors.textSecondary}
                value={manualTitle}
                onChangeText={setManualTitle}
              />

              <Text style={[styles.inputLabel, { color: colors.text, marginTop: 10 }]}>Artist / Singer</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
                placeholder="e.g. Arijit Singh, Pritam"
                placeholderTextColor={colors.textSecondary}
                value={manualArtist}
                onChangeText={setManualArtist}
              />

              <Text style={[styles.inputLabel, { color: colors.text, marginTop: 10 }]}>Movie / Album</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
                placeholder="e.g. Brahmāstra"
                placeholderTextColor={colors.textSecondary}
                value={manualMovie}
                onChangeText={setManualMovie}
              />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Release Year</Text>
                  <TextInput
                    style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
                    placeholder="2022"
                    placeholderTextColor={colors.textSecondary}
                    value={manualYear}
                    onChangeText={setManualYear}
                    keyboardType="numeric"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Theme</Text>
                  <TextInput
                    style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
                    placeholder="BOLLYWOOD"
                    placeholderTextColor={colors.textSecondary}
                    value={manualTheme}
                    onChangeText={setManualTheme}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.addBatchBtn, { backgroundColor: colors.primary, marginTop: 20 }]}
                onPress={handleAddManualSong}
                disabled={isAddingManual}
              >
                {isAddingManual ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.addBatchText}>Validate & Add to Catalog</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 6, marginRight: 8 },
  headerTitleWrap: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerSubtitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: { padding: 16, paddingBottom: 60 },

  // Metrics
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    minWidth: '47%',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  metricNumber: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: 6,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 10,
  },
  syncText: {
    fontSize: 11.5,
    fontWeight: '600',
  },

  // Actions
  actionsBar: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  mainActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  mainActionText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },

  // Search & Filters
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  filterRow: {
    paddingVertical: 6,
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Songs Section
  songsSection: { marginTop: 14 },
  songsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  pageIndicator: {
    fontSize: 12,
    fontWeight: '600',
  },
  loaderWrap: { padding: 40, alignItems: 'center' },
  emptyWrap: {
    padding: 30,
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 10,
  },
  emptyText: { fontSize: 15, fontWeight: '800', marginTop: 10 },
  emptySubtext: { fontSize: 12, textAlign: 'center', marginTop: 4 },

  songCard: {
    flexDirection: 'row',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    alignItems: 'center',
  },
  songThumb: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 10,
  },
  songMeta: { flex: 1 },
  songTitleRow: { flexDirection: 'row', alignItems: 'center' },
  songName: { fontSize: 13.5, fontWeight: '800' },
  songArtist: { fontSize: 11.5, marginTop: 2 },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  themeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  themeBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  vidIdText: {
    fontSize: 10,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  failureReasonText: {
    fontSize: 10.5,
    color: '#EF4444',
    marginTop: 3,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 6,
  },
  toggleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 10,
  },
  pageBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  pageBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Modals
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 11.5,
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  discoveryRunBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 14,
  },
  discoveryRunText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  previewBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  previewStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  previewStatItem: {
    fontSize: 12,
    fontWeight: '700',
  },
  addBatchBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  addBatchText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  // Tab Switcher
  tabSwitcher: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    marginBottom: 16,
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  // Requests Section
  requestsSection: {
    marginTop: 4,
  },
  requestCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  requestCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  requestQueryTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  requestMetaText: {
    fontSize: 12,
  },
  requestStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  requestStatusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  requestFailureText: {
    color: '#EF4444',
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 8,
  },
  syncReqBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  syncReqBtnText: {
    color: '#FFF',
    fontSize: 12.5,
    fontWeight: '800',
  },
});
