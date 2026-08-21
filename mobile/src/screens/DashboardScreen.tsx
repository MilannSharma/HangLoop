import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Linking,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { api, RoomData, UserProfile, SUPER_ADMIN_EMAIL } from '../services/api';
import { EditRoomModal } from '../components/EditRoomModal';

interface DashboardScreenProps {
  user: UserProfile;
  currentTab: 'HOME' | 'CHATS' | 'PROFILE';
  onSelectTab: (tab: 'HOME' | 'CHATS' | 'PROFILE') => void;
  onJoinRoom: (room: RoomData) => void;
  onLogout: () => void;
  onOpenProfile?: () => void;
}

const THEMES = ['BOLLYWOOD', 'PUNJABI', 'LOFI_CHILL', 'TRENDING'];

const getRoomThumbnailSource = (item: RoomData) => {
  const theme = (item.theme || '').toUpperCase();
  const roomId = (item.id || '').toLowerCase();

  if (theme === 'PUNJABI' || roomId.includes('punjabi')) {
    return require('../../assets/room_punjabi_3d.jpg');
  }
  if (theme === 'LOFI_CHILL' || roomId.includes('lofi')) {
    return require('../../assets/room_lofi_3d.jpg');
  }
  if (theme === 'TRENDING' || roomId.includes('trending')) {
    return require('../../assets/room_trending_3d.jpg');
  }
  // Default / BOLLYWOOD
  return require('../../assets/room_bollywood_3d.jpg');
};

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  user,
  currentTab,
  onSelectTab,
  onJoinRoom,
  onLogout,
  onOpenProfile,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const isSuperAdmin = (user.email || '').toLowerCase().trim() === SUPER_ADMIN_EMAIL.toLowerCase();

  const [liveRooms, setLiveRooms] = useState<RoomData[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Super Admin Create Live Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [liveName, setLiveName] = useState('');
  const [liveTheme, setLiveTheme] = useState('BOLLYWOOD');
  const [liveTags, setLiveTags] = useState<string[]>(['Bollywood']);
  const [customTagInput, setCustomTagInput] = useState('');
  const [liveThumbnail, setLiveThumbnail] = useState('');
  const [playSourceType, setPlaySourceType] = useState<'APP_DB' | 'YOUTUBE_URL'>('APP_DB');
  const [sourceYoutubeUrl, setSourceYoutubeUrl] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  // Edit Room Modal State
  const [editingRoom, setEditingRoom] = useState<RoomData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const rooms = await api.fetchRooms();
      setLiveRooms(rooms);
    } catch (e: any) {
      setErrorMsg('Failed to load live rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenMilanSharmaChannel = () => {
    const channelUrl = 'https://www.youtube.com/@milansharmamusic';
    Linking.openURL(channelUrl).catch((err) => {
      console.warn('Could not open YouTube channel link:', err);
    });
  };

  const handleOpenAppleMusicSingle = () => {
    const appleMusicUrl = 'https://music.apple.com/us/album/teri-yaad-single/1826124407';
    Linking.openURL(appleMusicUrl).catch((err) => {
      console.warn('Could not open Apple Music link:', err);
    });
  };

  const handleToggleTag = (tag: string) => {
    if (liveTags.includes(tag)) {
      setLiveTags(liveTags.filter((t) => t !== tag));
    } else {
      setLiveTags([...liveTags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    const trimmed = customTagInput.trim();
    if (!trimmed) return;
    if (!liveTags.includes(trimmed)) {
      setLiveTags([...liveTags, trimmed]);
    }
    setCustomTagInput('');
  };

  const handleCreateLiveRoom = async () => {
    if (!liveName.trim()) {
      Alert.alert('Missing Field', 'Please enter a Live Room Name');
      return;
    }

    if (playSourceType === 'YOUTUBE_URL' && !sourceYoutubeUrl.trim()) {
      Alert.alert('Missing URL', 'Please enter a YouTube URL for dedicated stream mode');
      return;
    }

    setIsCreatingRoom(true);
    try {
      const res = await api.createAdminLiveRoom({
        name: liveName.trim(),
        theme: liveTheme,
        tags: liveTags.length > 0 ? liveTags : [liveTheme],
        play_source_type: playSourceType,
        source_youtube_url: sourceYoutubeUrl.trim() || undefined,
        thumbnail_url: liveThumbnail.trim() || undefined,
      });

      if (res.success) {
        Alert.alert('Live Created', `Room "${liveName}" created successfully!`);
        setShowCreateModal(false);
        setLiveName('');
        setSourceYoutubeUrl('');
        setLiveThumbnail('');
        setLiveTags(['Bollywood']);
        setCustomTagInput('');
        loadRooms();
      } else {
        Alert.alert('Creation Failed', res.error || 'Could not create live room');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const renderRoomCard = ({ item }: { item: RoomData }) => (
    <TouchableOpacity
      activeOpacity={0.88}
      style={[styles.roomCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
      onPress={() => onJoinRoom(item)}
    >
      <View style={styles.thumbnailWrapper}>
        <Image
          source={getRoomThumbnailSource(item)}
          style={styles.thumbnail}
        />
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveBadgeText}>LIVE</Text>
        </View>

        {item.play_source_type === 'YOUTUBE_URL' && (
          <View style={[styles.sourceBadgeOverlay, { backgroundColor: '#EF4444' }]}>
            <Ionicons name="radio" size={10} color="#FFF" style={{ marginRight: 3 }} />
            <Text style={styles.sourceBadgeText}>STREAM</Text>
          </View>
        )}

        {item.theme && (
          <View style={styles.themeBadgeOverlay}>
            <Text style={styles.themeBadgeOverlayText}>{item.theme}</Text>
          </View>
        )}

        <View style={styles.viewerBadge}>
          <Ionicons name="headset" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
          <Text style={styles.viewerText}>{item.active_viewers || 1} listening</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Text style={[styles.roomTitle, { color: colors.text, flex: 1, marginRight: 8 }]} numberOfLines={1}>
            {item.name}
          </Text>
          {(isSuperAdmin || item.created_by === user.id) && (
            <TouchableOpacity
              style={styles.cardEditBtn}
              onPress={(e) => {
                e.stopPropagation?.();
                setEditingRoom(item);
                setShowEditModal(true);
              }}
            >
              <Ionicons name="create-outline" size={15} color={colors.primary} />
              <Text style={[styles.cardEditBtnText, { color: colors.primary }]}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Room Tags Pills */}
        {item.tags && item.tags.length > 0 && (
          <View style={styles.roomCardTagsRow}>
            {item.tags.slice(0, 3).map((tag) => (
              <View key={tag} style={[styles.roomCardTagPill, { backgroundColor: 'rgba(99,102,241,0.12)', borderColor: 'rgba(99,102,241,0.25)' }]}>
                <Text style={[styles.roomCardTagText, { color: colors.primary }]}>#{tag}</Text>
              </View>
            ))}
            {item.tags.length > 3 && (
              <Text style={[styles.moreTagsText, { color: colors.textSecondary }]}>+{item.tags.length - 3}</Text>
            )}
          </View>
        )}

        {item.current_title ? (
          <View style={styles.nowPlayingRow}>
            <Ionicons name="musical-notes" size={13} color={colors.primary} style={{ marginRight: 5 }} />
            <Text style={[styles.nowPlayingText, { color: colors.textSecondary }]} numberOfLines={1}>
              Now Playing: {item.current_title} {item.current_artist ? `• ${item.current_artist}` : ''}
            </Text>
          </View>
        ) : (
          <Text style={[styles.hostText, { color: colors.textSecondary }]} numberOfLines={1}>
            Host: @{item.created_by}
          </Text>
        )}

        <View style={[styles.cardJoinBtn, { backgroundColor: colors.buttonPrimaryBg }]}>
          <Text style={[styles.cardJoinBtnText, { color: colors.buttonPrimaryText }]}>Join Live Song Room</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.buttonPrimaryText} />
        </View>
      </View>
    </TouchableOpacity>
  );

  const headerPaddingTop = insets.top > 0 ? insets.top + 8 : 16;
  const bottomNavPaddingBottom = insets.bottom > 0 ? insets.bottom + 8 : 12;

  return (
    <View style={[styles.mainWrapper, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: headerPaddingTop, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.brandRow}>
          <Image
            source={require('../../assets/logo-white.png')}
            style={[styles.logoImage, !isDark && { tintColor: colors.text }]}
          />
          <Text style={[styles.brandTitle, { color: colors.text }]}>HANGLOOP</Text>
        </View>
        <TouchableOpacity onPress={onOpenProfile || onLogout} style={[styles.avatarBtn, { borderColor: colors.primary }]}>
          <Image source={{ uri: user.avatar_url || 'https://i.pravatar.cc/100' }} style={styles.headerAvatar} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* TOP FEATURED SINGLE BANNER — Teri Yaad by Milan Sharma */}
        <View style={styles.adBannerSection}>
          <View style={[styles.adCard, { backgroundColor: '#0D111D', borderColor: '#818CF8' }]}>
            <View style={styles.adTagRow}>
              <View style={styles.adBadge}>
                <Ionicons name="disc" size={12} color="#818CF8" style={{ marginRight: 4 }} />
                <Text style={styles.adBadgeText}>NEW SINGLE RELEASE</Text>
              </View>

              <View style={styles.platformPillsRow}>
                <TouchableOpacity style={styles.applePill} onPress={handleOpenAppleMusicSingle}>
                  <Ionicons name="logo-apple" size={13} color="#FFFFFF" style={{ marginRight: 3 }} />
                  <Text style={styles.applePillText}>Apple Music</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.ytPill} onPress={handleOpenMilanSharmaChannel}>
                  <Ionicons name="logo-youtube" size={13} color="#EF4444" style={{ marginRight: 3 }} />
                  <Text style={styles.ytPillText}>YouTube</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity activeOpacity={0.92} onPress={handleOpenAppleMusicSingle}>
              <View style={styles.adThumbnailWrapper}>
                <Image
                  source={require('../../assets/milan_sharma_banner.jpg')}
                  style={styles.adBannerImg}
                />
                <View style={styles.adOverlayGradient} />
              </View>
            </TouchableOpacity>

            <View style={styles.adContent}>
              <View style={styles.channelMeta}>
                <Text style={styles.channelTitle} numberOfLines={1}>
                  Teri Yaad — Single
                </Text>
                <Text style={styles.channelSubtitle} numberOfLines={1}>
                  by Milan Sharma • Available Now
                </Text>
              </View>

              <View style={styles.ctaButtonsRow}>
                <TouchableOpacity style={styles.appleCtaBtn} onPress={handleOpenAppleMusicSingle}>
                  <Ionicons name="logo-apple" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.ctaBtnText}>Apple Music</Text>
                  <Ionicons name="open-outline" size={12} color="#FFFFFF" style={{ marginLeft: 4 }} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.ytCtaBtn} onPress={handleOpenMilanSharmaChannel}>
                  <Ionicons name="logo-youtube" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.ctaBtnText}>YouTube</Text>
                  <Ionicons name="open-outline" size={12} color="#FFFFFF" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Section Header: Trending Live Song Rooms */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="flame" size={22} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Trending Live Song Rooms</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {isSuperAdmin && (
              <TouchableOpacity
                style={[styles.createLiveBtn, { backgroundColor: '#8B5CF6' }]}
                onPress={() => setShowCreateModal(true)}
              >
                <Ionicons name="add" size={16} color="#FFF" style={{ marginRight: 4 }} />
                <Text style={styles.createLiveBtnText}>Create Live</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={loadRooms}>
              <Ionicons name="refresh" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Live Song Rooms List */}
        {loading ? (
          <View style={styles.statusBox}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={[styles.statusText, { color: colors.textSecondary }]}>Loading live song rooms...</Text>
          </View>
        ) : errorMsg ? (
          <View style={styles.statusBox}>
            <Ionicons name="alert-circle-outline" size={36} color="#EF4444" />
            <Text style={[styles.statusText, { color: colors.textSecondary }]}>{errorMsg}</Text>
            <TouchableOpacity style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={loadRooms}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : liveRooms.length === 0 ? (
          <View style={styles.statusBox}>
            <Ionicons name="radio-outline" size={36} color={colors.textMuted} />
            <Text style={[styles.statusText, { color: colors.textSecondary }]}>No public live rooms active right now.</Text>
          </View>
        ) : (
          <FlatList
            data={liveRooms}
            keyExtractor={(item) => item.id}
            renderItem={renderRoomCard}
            scrollEnabled={false}
            contentContainerStyle={styles.roomsList}
          />
        )}
      </ScrollView>

      {/* ── SUPER ADMIN CREATE LIVE MODAL (APP DB vs YOUTUBE URL) ── */}
      <Modal visible={showCreateModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Create Super Admin Live Room</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                  Configure playback mode & room settings
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Live Room Name *</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
                placeholder="e.g. 2000s Bollywood Hits Live"
                placeholderTextColor={colors.textSecondary}
                value={liveName}
                onChangeText={setLiveName}
              />

              <Text style={[styles.inputLabel, { color: colors.text, marginTop: 12 }]}>Room Theme / Genre</Text>
              <View style={styles.themeSelectorRow}>
                {THEMES.map((theme) => (
                  <TouchableOpacity
                    key={theme}
                    style={[
                      styles.themeChip,
                      {
                        backgroundColor: liveTheme === theme ? colors.primary : colors.background,
                        borderColor: liveTheme === theme ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => {
                      setLiveTheme(theme);
                      if (!liveTags.includes(theme)) {
                        setLiveTags([...liveTags, theme]);
                      }
                    }}
                  >
                    <Text style={[styles.themeChipText, { color: liveTheme === theme ? '#FFF' : colors.textSecondary }]}>
                      {theme}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Room Tags */}
              <Text style={[styles.inputLabel, { color: colors.text, marginTop: 12 }]}>Room Tags ({liveTags.length})</Text>
              <View style={styles.selectedTagsRow}>
                {liveTags.map((tag) => (
                  <View key={tag} style={[styles.activeTagPill, { backgroundColor: colors.primary }]}>
                    <Text style={styles.activeTagText}>{tag}</Text>
                    <TouchableOpacity onPress={() => setLiveTags(liveTags.filter((t) => t !== tag))}>
                      <Ionicons name="close" size={13} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {/* Add Custom Tag */}
              <View style={styles.customTagRow}>
                <TextInput
                  style={[styles.modalInput, { flex: 1, color: colors.text, borderColor: colors.border }]}
                  placeholder="e.g. Late Night, 90s Hits, Arijit Singh..."
                  placeholderTextColor={colors.textSecondary}
                  value={customTagInput}
                  onChangeText={setCustomTagInput}
                  onSubmitEditing={handleAddCustomTag}
                />
                <TouchableOpacity
                  style={[styles.addTagSmallBtn, { backgroundColor: colors.primary }]}
                  onPress={handleAddCustomTag}
                >
                  <Text style={styles.addTagSmallBtnText}>+ Add</Text>
                </TouchableOpacity>
              </View>

              {/* SONG PLAY FROM: OPTION 1 (APP DB) vs OPTION 2 (YOUTUBE URL) */}
              <Text style={[styles.inputLabel, { color: colors.text, marginTop: 14 }]}>Song Play From *</Text>
              <View style={styles.sourceSelectorRow}>
                <TouchableOpacity
                  style={[
                    styles.sourceOptionCard,
                    {
                      backgroundColor: playSourceType === 'APP_DB' ? 'rgba(99,102,241,0.12)' : colors.background,
                      borderColor: playSourceType === 'APP_DB' ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setPlaySourceType('APP_DB')}
                >
                  <Ionicons name="library" size={20} color={playSourceType === 'APP_DB' ? colors.primary : colors.textSecondary} />
                  <Text style={[styles.sourceOptionTitle, { color: colors.text }]}>App DB</Text>
                  <Text style={[styles.sourceOptionSub, { color: '#10B981' }]}>Queue: ENABLED</Text>
                  <Text style={[styles.sourceOptionDesc, { color: colors.textSecondary }]}>
                    Continuous play from Music Catalog
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.sourceOptionCard,
                    {
                      backgroundColor: playSourceType === 'YOUTUBE_URL' ? 'rgba(239,68,68,0.12)' : colors.background,
                      borderColor: playSourceType === 'YOUTUBE_URL' ? '#EF4444' : colors.border,
                    },
                  ]}
                  onPress={() => setPlaySourceType('YOUTUBE_URL')}
                >
                  <Ionicons name="logo-youtube" size={20} color={playSourceType === 'YOUTUBE_URL' ? '#EF4444' : colors.textSecondary} />
                  <Text style={[styles.sourceOptionTitle, { color: colors.text }]}>YouTube URL</Text>
                  <Text style={[styles.sourceOptionSub, { color: '#EF4444' }]}>Queue: DISABLED</Text>
                  <Text style={[styles.sourceOptionDesc, { color: colors.textSecondary }]}>
                    Dedicated single video / live stream
                  </Text>
                </TouchableOpacity>
              </View>

              {playSourceType === 'YOUTUBE_URL' && (
                <View style={{ marginTop: 12 }}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>YouTube URL / Video ID *</Text>
                  <TextInput
                    style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
                    placeholder="https://www.youtube.com/watch?v=..."
                    placeholderTextColor={colors.textSecondary}
                    value={sourceYoutubeUrl}
                    onChangeText={setSourceYoutubeUrl}
                  />
                </View>
              )}

              <Text style={[styles.inputLabel, { color: colors.text, marginTop: 12 }]}>Thumbnail URL (Optional)</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
                placeholder="https://..."
                placeholderTextColor={colors.textSecondary}
                value={liveThumbnail}
                onChangeText={setLiveThumbnail}
              />

              <TouchableOpacity
                style={[styles.createSubmitBtn, { backgroundColor: colors.primary }]}
                onPress={handleCreateLiveRoom}
                disabled={isCreatingRoom}
              >
                {isCreatingRoom ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.createSubmitText}>Start Live Room</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Room Modal for Super Admin / Room Host */}
      <EditRoomModal
        visible={showEditModal}
        room={editingRoom}
        onClose={() => {
          setShowEditModal(false);
          setEditingRoom(null);
        }}
        onRoomUpdated={(updatedRoom) => {
          setLiveRooms((prev) =>
            prev.map((r) => (r.id === updatedRoom.id ? { ...r, ...updatedRoom } : r))
          );
        }}
        onRoomDeleted={(deletedRoomId) => {
          setLiveRooms((prev) => prev.filter((r) => r.id !== deletedRoomId));
        }}
      />

      {/* Bottom Navigation Bar */}
      <View style={[
        styles.bottomNav,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: bottomNavPaddingBottom,
        },
      ]}>
        <TouchableOpacity style={styles.navItem} onPress={() => onSelectTab('HOME')}>
          <Ionicons name="home" size={22} color={currentTab === 'HOME' ? colors.primary : colors.textMuted} />
          <Text style={[styles.navText, { color: currentTab === 'HOME' ? colors.primary : colors.textMuted }]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => onSelectTab('CHATS')}>
          <Ionicons name="chatbubbles-outline" size={22} color={currentTab === 'CHATS' ? colors.primary : colors.textMuted} />
          <Text style={[styles.navText, { color: currentTab === 'CHATS' ? colors.primary : colors.textMuted }]}>Chats</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => onSelectTab('PROFILE')}>
          <Ionicons name="person-outline" size={22} color={currentTab === 'PROFILE' ? colors.primary : colors.textMuted} />
          <Text style={[styles.navText, { color: currentTab === 'PROFILE' ? colors.primary : colors.textMuted }]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainWrapper: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  logoImage: { width: 28, height: 28, resizeMode: 'contain', marginRight: 8 },
  brandTitle: { fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  avatarBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, overflow: 'hidden' },
  headerAvatar: { width: '100%', height: '100%' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 24 },

  adBannerSection: { marginTop: 14, marginBottom: 16 },
  adCard: { borderRadius: 16, borderWidth: 1.5, overflow: 'hidden', padding: 12 },
  adTagRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  adBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(129, 140, 248, 0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  adBadgeText: { color: '#818CF8', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  platformPillsRow: { flexDirection: 'row', gap: 6 },
  applePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.12)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  applePillText: { color: '#FFFFFF', fontSize: 10.5, fontWeight: '700' },
  ytPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.12)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  ytPillText: { color: '#FFFFFF', fontSize: 10.5, fontWeight: '700' },

  adThumbnailWrapper: { width: '100%', height: 160, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  adBannerImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  adOverlayGradient: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.15)' },
  adContent: { marginTop: 10 },
  channelMeta: { marginBottom: 10 },
  channelTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  channelSubtitle: { color: '#94A3B8', fontSize: 12, fontWeight: '600', marginTop: 2 },
  ctaButtonsRow: { flexDirection: 'row', gap: 8 },
  appleCtaBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FA2D48', paddingVertical: 10, borderRadius: 8 },
  ytCtaBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#CC0000', paddingVertical: 10, borderRadius: 8 },
  ctaBtnText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '800' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  createLiveBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  createLiveBtnText: { color: '#FFF', fontSize: 11, fontWeight: '800' },

  roomsList: { gap: 14 },
  roomCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  thumbnailWrapper: { width: '100%', height: 170, position: 'relative' },
  thumbnail: { width: '100%', height: '100%', resizeMode: 'cover' },
  liveBadge: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: '#EF4444', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF', marginRight: 5 },
  liveBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  sourceBadgeOverlay: { position: 'absolute', top: 10, left: 70, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6 },
  sourceBadgeText: { color: '#FFF', fontSize: 9.5, fontWeight: '900' },
  themeBadgeOverlay: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  themeBadgeOverlayText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  viewerBadge: { position: 'absolute', bottom: 10, left: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  viewerText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },

  cardContent: { padding: 14 },
  roomTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  cardEditBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(99,102,241,0.12)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, gap: 3 },
  cardEditBtnText: { fontSize: 11, fontWeight: '700' },
  roomCardTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4, marginBottom: 8, alignItems: 'center' },
  roomCardTagPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1 },
  roomCardTagText: { fontSize: 10.5, fontWeight: '700' },
  moreTagsText: { fontSize: 10.5, fontWeight: '600' },
  nowPlayingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  nowPlayingText: { fontSize: 12.5, fontWeight: '600' },
  hostText: { fontSize: 13, marginBottom: 12 },
  cardJoinBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 11, borderRadius: 10, gap: 6 },
  cardJoinBtnText: { fontSize: 13.5, fontWeight: '800' },

  statusBox: { padding: 32, alignItems: 'center', justifyContent: 'center', gap: 12 },
  statusText: { fontSize: 14, textAlign: 'center' },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, marginTop: 8 },
  retryBtnText: { color: '#FFFFFF', fontWeight: '700' },

  bottomNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingTop: 12, borderTopWidth: 1 },
  navItem: { alignItems: 'center', justifyContent: 'center' },
  navText: { fontSize: 10, fontWeight: '700', marginTop: 4 },

  // Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 16 },
  modalCard: { borderRadius: 20, borderWidth: 1, padding: 18 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 17, fontWeight: '800' },
  modalSubtitle: { fontSize: 11.5, marginTop: 2 },
  inputLabel: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
  modalInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13 },
  selectedTagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  activeTagPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  activeTagText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  customTagRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  addTagSmallBtn: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10 },
  addTagSmallBtnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  themeSelectorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  themeChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, borderWidth: 1 },
  themeChipText: { fontSize: 11, fontWeight: '700' },
  sourceSelectorRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  sourceOptionCard: { flex: 1, padding: 10, borderRadius: 12, borderWidth: 1.5, alignItems: 'center' },
  sourceOptionTitle: { fontSize: 13, fontWeight: '800', marginTop: 4 },
  sourceOptionSub: { fontSize: 10, fontWeight: '900', marginTop: 2 },
  sourceOptionDesc: { fontSize: 9.5, textAlign: 'center', marginTop: 2 },
  createSubmitBtn: { paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 18 },
  createSubmitText: { color: '#FFF', fontSize: 13.5, fontWeight: '800' },
});
