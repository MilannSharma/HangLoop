import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Image, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { api, SUPER_ADMIN_EMAIL } from '../services/api';

export interface ProfileModalProps {
  user: {
    id: string;
    username: string;
    full_name?: string;
    avatar_url: string;
    bio?: string;
    is_subscribed?: number;
    is_moderator?: boolean;
    is_super_admin?: boolean;
    photos?: string[];
  } | null;
  currentUser?: {
    id: string;
    is_moderator?: boolean;
    is_super_admin?: boolean;
  };
  isHost?: boolean;
  onClose: () => void;
  onViewProfile?: (user: any) => void;
  onHideUser?: (userId: string) => void;
  onBlockUser?: (userId: string, username: string) => void;
  onReportUser?: (user: any) => void;
  onTimeoutUser?: (userId: string, durationMinutes: number, reason: string) => void;
  onKickUser?: (userId: string) => void;
  onSendEmoji?: (username: string) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  user,
  currentUser,
  isHost = false,
  onClose,
  onViewProfile,
  onBlockUser,
  onReportUser,
  onTimeoutUser,
  onKickUser,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [showTimeoutPicker, setShowTimeoutPicker] = useState(false);

  if (!user) return null;

  const isViewerModerator = !!(currentUser?.is_moderator || currentUser?.is_super_admin || isHost);
  const isTargetModerator = !!(user.is_moderator || user.is_super_admin);
  const isMe = currentUser?.id === user.id;

  const defaultPhotos = [
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&q=80',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&q=80',
  ];

  const gallery = user.photos && user.photos.length > 0 ? user.photos : defaultPhotos;
  const bottomPadding = insets.bottom > 0 ? insets.bottom + 16 : 24;

  const handleConfirmBlock = () => {
    Alert.alert(
      `Block @${user.username}?`,
      `Are you sure you want to block @${user.username}? Their chat messages will be hidden immediately and they will be added to your Blocked Users list.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block User',
          style: 'destructive',
          onPress: () => {
            onClose();
            if (onBlockUser) onBlockUser(user.id, user.username);
          },
        },
      ]
    );
  };

  const handleSelectTimeout = (durationMinutes: number) => {
    setShowTimeoutPicker(false);
    Alert.alert(
      `Timeout @${user.username}?`,
      `Place @${user.username} on a ${durationMinutes}-minute chat timeout?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Timeout (${durationMinutes}m)`,
          style: 'destructive',
          onPress: () => {
            onClose();
            if (onTimeoutUser) onTimeoutUser(user.id, durationMinutes, 'Chat rule violation');
          },
        },
      ]
    );
  };

  const handleConfirmKick = () => {
    Alert.alert(
      `Kick @${user.username}?`,
      `Remove @${user.username} from this live room?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Kick from Room',
          style: 'destructive',
          onPress: () => {
            onClose();
            if (onKickUser) onKickUser(user.id);
          },
        },
      ]
    );
  };

  return (
    <Modal transparent animationType="slide" visible={!!user} onRequestClose={onClose}>
      <View style={styles.modalBg}>
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: colors.surface,
              borderColor: isTargetModerator ? '#D4A017' : colors.border,
              paddingBottom: bottomPadding,
            },
          ]}
        >
          {/* Header Bar */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>User Profile</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollBody}>
            {/* Avatar & Badges */}
            <View style={styles.avatarSection}>
              <Image
                source={{ uri: user.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.username }}
                style={[
                  styles.avatarImage,
                  {
                    borderColor: isTargetModerator ? '#F0C040' : colors.primary,
                    borderWidth: isTargetModerator ? 3 : 2,
                  },
                ]}
              />

              {/* Display Name & Username */}
              <View style={styles.nameRow}>
                <Text style={[styles.displayNameText, { color: colors.text }]}>
                  {user.full_name || user.username}
                </Text>

                {isTargetModerator && (
                  <View style={[styles.goldBadge, { backgroundColor: '#F0C040' }]}>
                    <Ionicons name="shield-checkmark" size={10} color="#0A0A0A" />
                    <Text style={styles.goldBadgeText}>MODERATOR</Text>
                  </View>
                )}
              </View>

              <Text style={[styles.usernameText, { color: isTargetModerator ? '#F0C040' : colors.textMuted }]}>
                @{user.username} • ID: {user.id}
              </Text>

              <Text style={[styles.bioText, { color: colors.textSecondary }]}>
                {user.bio || 'Listening to music on Hangloop'}
              </Text>
            </View>

            {/* ── MODERATOR CONTROLS SECTION (Visible to Admins / Mods viewing others) ── */}
            {isViewerModerator && !isMe && (
              <View style={[styles.modControlsSection, { backgroundColor: 'rgba(212, 160, 23, 0.08)', borderColor: '#D4A017' }]}>
                <View style={styles.modSectionHeader}>
                  <Ionicons name="shield-checkmark" size={14} color="#F0C040" style={{ marginRight: 6 }} />
                  <Text style={[styles.modSectionTitle, { color: '#F0C040' }]}>LIVE CHAT MODERATION</Text>
                </View>

                <View style={styles.modBtnRow}>
                  {/* Super Admin: Toggle Moderator Role */}
                  {(currentUser?.is_super_admin || (currentUser as any)?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) && (
                    <TouchableOpacity
                      style={[styles.modActionBtn, { backgroundColor: isTargetModerator ? '#EF4444' : '#F0C040' }]}
                      onPress={async () => {
                        try {
                          if (isTargetModerator) {
                            const res = await api.removeModerator(user.id);
                            if (res.success) {
                              Alert.alert('Success', `${user.full_name || user.username} is no longer a Moderator.`);
                              onClose();
                            }
                          } else {
                            const res = await api.addModerator(user.id, {
                              userId: user.id,
                              username: user.username,
                              full_name: user.full_name,
                              avatar_url: user.avatar_url,
                              can_delete_messages: true,
                              can_timeout_users: true,
                              can_kick_users: true,
                            });
                            if (res.success) {
                              Alert.alert('Success 🎉', `${user.full_name || user.username} is now a Live Chat Moderator!`);
                              onClose();
                            } else {
                              Alert.alert('Error', res.error || 'Failed to assign moderator role.');
                            }
                          }
                        } catch (e: any) {
                          Alert.alert('Error', e.message);
                        }
                      }}
                    >
                      <Ionicons name={isTargetModerator ? "shield-outline" : "shield-checkmark"} size={15} color={isTargetModerator ? "#FFFFFF" : "#0A0A0A"} />
                      <Text style={[styles.modActionBtnText, { color: isTargetModerator ? "#FFFFFF" : "#0A0A0A" }]}>
                        {isTargetModerator ? "Remove Mod" : "Make Mod"}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {/* Timeout User Button */}
                  <TouchableOpacity
                    style={[styles.modActionBtn, { backgroundColor: '#D4A017' }]}
                    onPress={() => setShowTimeoutPicker(!showTimeoutPicker)}
                  >
                    <Ionicons name="time-outline" size={15} color="#0A0A0A" />
                    <Text style={styles.modActionBtnText}>Timeout User</Text>
                  </TouchableOpacity>

                  {/* Kick from Room */}
                  <TouchableOpacity
                    style={[styles.modActionBtn, { backgroundColor: colors.liveRed }]}
                    onPress={handleConfirmKick}
                  >
                    <Ionicons name="person-remove-outline" size={15} color="#FFFFFF" />
                    <Text style={[styles.modActionBtnText, { color: '#FFFFFF' }]}>Kick Room</Text>
                  </TouchableOpacity>
                </View>

                {/* Timeout Picker Options */}
                {showTimeoutPicker && (
                  <View style={styles.timeoutOptionsRow}>
                    <TouchableOpacity style={styles.timeoutChip} onPress={() => handleSelectTimeout(5)}>
                      <Text style={styles.timeoutChipText}>5 Mins</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.timeoutChip} onPress={() => handleSelectTimeout(15)}>
                      <Text style={styles.timeoutChipText}>15 Mins</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.timeoutChip} onPress={() => handleSelectTimeout(60)}>
                      <Text style={styles.timeoutChipText}>1 Hour</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.timeoutChip} onPress={() => handleSelectTimeout(1440)}>
                      <Text style={styles.timeoutChipText}>24 Hours</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Standard User Actions (Block & Report) */}
            {!isMe && (
              <View style={styles.actionsContainer}>
                {onViewProfile && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: colors.buttonPrimaryBg }]}
                    onPress={() => {
                      onClose();
                      onViewProfile(user);
                    }}
                  >
                    <Ionicons name="person-outline" size={16} color={colors.buttonPrimaryText} />
                    <Text style={[styles.actionBtnText, { color: colors.buttonPrimaryText }]}>View Full Profile</Text>
                  </TouchableOpacity>
                )}

                {/* Report User */}
                {onReportUser && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: '#F59E0B', borderWidth: 1 }]}
                    onPress={() => {
                      onClose();
                      onReportUser(user);
                    }}
                  >
                    <Ionicons name="flag-outline" size={16} color="#F59E0B" />
                    <Text style={[styles.actionBtnText, { color: '#F59E0B' }]}>Report Inappropriate Content</Text>
                  </TouchableOpacity>
                )}

                {/* Block User */}
                {onBlockUser && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: '#EF4444', borderWidth: 1 }]}
                    onPress={handleConfirmBlock}
                  >
                    <Ionicons name="ban-outline" size={16} color="#EF4444" />
                    <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Block User</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Photo Gallery */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Photo Gallery</Text>
                <Text style={[styles.photoCount, { color: colors.textMuted }]}>{gallery.length}/5 Free Photos</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryScroll}>
                {gallery.map((photo, index) => (
                  <Image key={index} source={{ uri: photo }} style={[styles.galleryImage, { backgroundColor: colors.surfaceLight }]} />
                ))}
              </ScrollView>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    padding: 20,
    borderWidth: 1.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  scrollBody: {
    paddingBottom: 16,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 4,
  },
  displayNameText: {
    fontSize: 18,
    fontWeight: '800',
  },
  goldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  goldBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#0A0A0A',
    letterSpacing: 0.5,
  },
  usernameText: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  bioText: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  modControlsSection: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 16,
  },
  modSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  modSectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  modBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  modActionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0A0A0A',
  },
  timeoutOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 160, 23, 0.2)',
  },
  timeoutChip: {
    flex: 1,
    backgroundColor: '#F0C040',
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  timeoutChipText: {
    color: '#0A0A0A',
    fontSize: 11,
    fontWeight: '800',
  },
  actionsContainer: {
    gap: 10,
    marginBottom: 20,
  },
  actionBtn: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnText: {
    fontWeight: '800',
    fontSize: 13,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  photoCount: {
    fontSize: 12,
  },
  galleryScroll: {
    flexDirection: 'row',
  },
  galleryImage: {
    width: 110,
    height: 140,
    borderRadius: 12,
    marginRight: 10,
  },
});
