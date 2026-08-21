import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { api, RoomData } from '../services/api';

interface EditRoomModalProps {
  visible: boolean;
  onClose: () => void;
  room: RoomData | null;
  onRoomUpdated: (updatedRoom: RoomData) => void;
  onRoomDeleted?: (roomId: string) => void;
}

const PRESET_TAGS = [
  'Bollywood',
  'Punjabi',
  'Trending',
  'Lofi & Chill',
  'Retro',
  'Late Night',
  '90s Hits',
  'Arijit Singh',
  'DJ Night',
  'Romantic',
  'EDM & Dance',
  'Party Mix'
];

export const EditRoomModal: React.FC<EditRoomModalProps> = ({
  visible,
  onClose,
  room,
  onRoomUpdated,
  onRoomDeleted,
}) => {
  const { colors } = useTheme();

  const [name, setName] = useState('');
  const [sourceYoutubeUrl, setSourceYoutubeUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (room) {
      setName(room.name || '');
      setSourceYoutubeUrl(room.source_youtube_url || (room.current_video_id ? `https://www.youtube.com/watch?v=${room.current_video_id}` : ''));
      setThumbnailUrl(room.thumbnail_url || room.current_thumbnail || '');
      setTags(room.tags && room.tags.length > 0 ? room.tags : (room.theme ? [room.theme] : ['Bollywood']));
      setErrorMsg('');
      setCustomTagInput('');
    }
  }, [room, visible]);

  const handleTogglePresetTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    const trimmed = customTagInput.trim();
    if (!trimmed) return;
    if (!tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setCustomTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSave = async () => {
    if (!room) return;
    if (!name.trim()) {
      setErrorMsg('Room name cannot be empty.');
      return;
    }
    if (room.play_source_type === 'YOUTUBE_URL' && !sourceYoutubeUrl.trim()) {
      setErrorMsg('YouTube URL is required for dedicated live streams.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    try {
      const res = await api.editAdminLiveRoom({
        roomId: room.id,
        name: name.trim(),
        source_youtube_url: sourceYoutubeUrl.trim(),
        thumbnail_url: thumbnailUrl.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
      });

      if (res.success && res.room) {
        onRoomUpdated(res.room);
        onClose();
      } else {
        setErrorMsg(res.error || 'Failed to update live room.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!room) return;

    Alert.alert(
      'Delete Live Room',
      `Are you sure you want to permanently delete "${room.name}"? All connected viewers will be disconnected.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Room',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            setErrorMsg('');
            try {
              const res = await api.deleteAdminLiveRoom(room.id);
              if (res.success) {
                if (onRoomDeleted) onRoomDeleted(room.id);
                onClose();
                Alert.alert('Room Deleted', 'The live room has been successfully deleted.');
              } else {
                setErrorMsg(res.error || 'Failed to delete live room.');
              }
            } catch (err: any) {
              setErrorMsg(err.message || 'Error deleting live room.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (!room) return null;

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <View style={styles.badgeRow}>
                <View style={styles.adminBadge}>
                  <Text style={styles.adminBadgeText}>SUPER ADMIN</Text>
                </View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Live Room</Text>
              </View>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                Update stream video, thumbnail & tags
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {errorMsg ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" style={{ marginRight: 6 }} />
              <Text style={styles.errorBannerText}>{errorMsg}</Text>
            </View>
          ) : null}

          <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
            {/* Room Name */}
            <Text style={[styles.inputLabel, { color: colors.text }]}>Room Name *</Text>
            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              placeholder="e.g. 2000s Bollywood Hits Live"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
            />

            {/* YouTube Live Stream URL (for YOUTUBE_URL mode) */}
            {room.play_source_type === 'YOUTUBE_URL' && (
              <View style={{ marginTop: 14 }}>
                <View style={styles.labelWithBadge}>
                  <Text style={[styles.inputLabel, { color: colors.text, marginTop: 0 }]}>YouTube Live URL / Video ID *</Text>
                  <View style={styles.liveLockedBadge}>
                    <Ionicons name="lock-closed" size={11} color="#EF4444" style={{ marginRight: 3 }} />
                    <Text style={styles.liveLockedText}>Locked Stream</Text>
                  </View>
                </View>
                <TextInput
                  style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
                  placeholder="https://www.youtube.com/watch?v=..."
                  placeholderTextColor={colors.textSecondary}
                  value={sourceYoutubeUrl}
                  onChangeText={setSourceYoutubeUrl}
                />
                <Text style={styles.fieldHelpText}>
                  Changing this URL will switch the live stream for all connected viewers immediately.
                </Text>
              </View>
            )}

            {/* Thumbnail URL */}
            <Text style={[styles.inputLabel, { color: colors.text, marginTop: 14 }]}>Thumbnail URL (Optional)</Text>
            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
              placeholder="https://images.unsplash.com/..."
              placeholderTextColor={colors.textSecondary}
              value={thumbnailUrl}
              onChangeText={setThumbnailUrl}
            />

            {/* Selected Tags Display */}
            <Text style={[styles.inputLabel, { color: colors.text, marginTop: 14 }]}>Active Room Tags ({tags.length})</Text>
            <View style={styles.selectedTagsRow}>
              {tags.map((t) => (
                <View key={t} style={[styles.activeTagPill, { backgroundColor: colors.primary }]}>
                  <Text style={styles.activeTagText}>{t}</Text>
                  <TouchableOpacity onPress={() => handleRemoveTag(t)} style={styles.tagRemoveBtn}>
                    <Ionicons name="close" size={14} color="#FFF" />
                  </TouchableOpacity>
                </View>
              ))}
              {tags.length === 0 && (
                <Text style={[styles.noTagsText, { color: colors.textSecondary }]}>No tags selected yet</Text>
              )}
            </View>

            {/* Add Custom Tag Input */}
            <Text style={[styles.inputLabel, { color: colors.text, marginTop: 12 }]}>+ Add Custom Tag</Text>
            <View style={styles.customTagInputRow}>
              <TextInput
                style={[
                  styles.modalInput,
                  styles.customTagInput,
                  { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }
                ]}
                placeholder="e.g. Late Night, 90s Hits, Arijit Singh..."
                placeholderTextColor={colors.textSecondary}
                value={customTagInput}
                onChangeText={setCustomTagInput}
                onSubmitEditing={handleAddCustomTag}
              />
              <TouchableOpacity
                style={[styles.addTagBtn, { backgroundColor: colors.primary }]}
                onPress={handleAddCustomTag}
              >
                <Ionicons name="add" size={20} color="#FFF" />
                <Text style={styles.addTagBtnText}>Add</Text>
              </TouchableOpacity>
            </View>

            {/* Preset Tags Quick-Select */}
            <Text style={[styles.inputLabel, { color: colors.text, marginTop: 12 }]}>Quick Select Preset Tags</Text>
            <View style={styles.presetTagsRow}>
              {PRESET_TAGS.map((pt) => {
                const isSelected = tags.includes(pt);
                return (
                  <TouchableOpacity
                    key={pt}
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor: isSelected ? 'rgba(99,102,241,0.15)' : colors.background,
                        borderColor: isSelected ? colors.primary : colors.border,
                      }
                    ]}
                    onPress={() => handleTogglePresetTag(pt)}
                  >
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'add-circle-outline'}
                      size={14}
                      color={isSelected ? colors.primary : colors.textSecondary}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.presetChipText, { color: isSelected ? colors.primary : colors.textSecondary }]}>
                      {pt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={onClose}
                disabled={isSaving || isDeleting}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={handleSave}
                disabled={isSaving || isDeleting}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Danger Zone: Delete Live Room */}
            <View style={[styles.dangerZoneWrapper, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.deleteBtn, { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderColor: '#EF4444' }]}
                onPress={handleDelete}
                disabled={isSaving || isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={17} color="#EF4444" style={{ marginRight: 6 }} />
                    <Text style={styles.deleteBtnText}>Delete Live Room</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  adminBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  adminBadgeText: {
    color: '#EF4444',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 12.5,
  },
  closeBtn: {
    padding: 4,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.12)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  errorBannerText: {
    color: '#EF4444',
    fontSize: 12.5,
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  labelWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  liveLockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveLockedText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '700',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  fieldHelpText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic',
  },
  selectedTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    minHeight: 32,
    alignItems: 'center',
  },
  activeTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activeTagText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    marginRight: 4,
  },
  tagRemoveBtn: {
    padding: 2,
  },
  noTagsText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  customTagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customTagInput: {
    flex: 1,
  },
  addTagBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addTagBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 2,
  },
  presetTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    marginBottom: 10,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  dangerZoneWrapper: {
    marginTop: 10,
    paddingTop: 14,
    borderTopWidth: 1,
    marginBottom: 6,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
  },
  deleteBtnText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
  },
});
