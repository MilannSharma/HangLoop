import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Share,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { api, RoomData, UserProfile } from '../services/api';

interface CreatePrivateRoomModalProps {
  visible: boolean;
  user: UserProfile;
  onClose: () => void;
  onRoomCreated: (room: RoomData) => void;
}

export const CreatePrivateRoomModal: React.FC<CreatePrivateRoomModalProps> = ({
  visible,
  user,
  onClose,
  onRoomCreated,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [roomName, setRoomName] = useState(`${user.username}'s Chat`);
  const [durationMinutes, setDurationMinutes] = useState(30); // Default 30 mins
  const [maxMembers, setMaxMembers] = useState(10);
  const [loading, setLoading] = useState(false);
  const [createdRoom, setCreatedRoom] = useState<RoomData | null>(null);

  const handleCreate = async () => {
    if (!roomName.trim()) {
      Alert.alert('Required', 'Please enter a room name.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.createPrivateRoom({
        name: roomName.trim(),
        durationMinutes: Math.min(durationMinutes, 60), // Capped at 1 hour
        maxMembers,
        createdBy: user.username,
      });

      if (res.success && res.room) {
        setCreatedRoom(res.room);
      } else {
        Alert.alert('Error', res.error || 'Could not create private room');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPin = async () => {
    if (!createdRoom) return;
    try {
      await Share.share({ message: createdRoom.id });
    } catch (e) {
      console.log('Share error:', e);
    }
  };

  const handleSharePin = async () => {
    if (!createdRoom) return;
    try {
      await Share.share({
        message: `Join my private Hangloop room "${createdRoom.name}" using PIN: ${createdRoom.id}`,
      });
    } catch (e) {
      console.log('Share error:', e);
    }
  };

  const handleEnterRoom = () => {
    if (createdRoom) {
      const target = createdRoom;
      setCreatedRoom(null);
      onClose();
      onRoomCreated(target);
    }
  };

  const bottomPadding = insets.bottom > 0 ? insets.bottom + 16 : 24;

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={styles.modalBg}>
        <View style={[
          styles.modalContainer, 
          { 
            backgroundColor: colors.surface, 
            borderColor: colors.border,
            paddingBottom: bottomPadding 
          }
        ]}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Create Private Chat Room</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {!createdRoom ? (
            <View style={styles.body}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Room Name *</Text>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    backgroundColor: colors.inputBg, 
                    color: colors.text, 
                    borderColor: colors.border 
                  }
                ]}
                placeholder="e.g. Late Night Hangout"
                placeholderTextColor={colors.textMuted}
                value={roomName}
                onChangeText={setRoomName}
              />

              {/* Room Duration Picker - Max 1 Hour */}
              <Text style={[styles.label, { color: colors.textSecondary }]}>Duration (Max 1 Hour)</Text>
              <View style={styles.durationRow}>
                {[15, 30, 45, 60].map((mins) => (
                  <TouchableOpacity
                    key={mins}
                    style={[
                      styles.durationOption,
                      {
                        backgroundColor: durationMinutes === mins ? colors.primary : colors.surfaceLight,
                        borderColor: durationMinutes === mins ? colors.primary : colors.border,
                      }
                    ]}
                    onPress={() => setDurationMinutes(mins)}
                  >
                    <Text style={[
                      styles.durationOptionText,
                      { color: durationMinutes === mins ? '#FFFFFF' : colors.text }
                    ]}>
                      {mins}m
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Max Members Selector */}
              <Text style={[styles.label, { color: colors.textSecondary }]}>Maximum Capacity ({maxMembers} Members)</Text>
              <View style={styles.membersRow}>
                {[2, 5, 10, 20, 50].map((count) => (
                  <TouchableOpacity
                    key={count}
                    style={[
                      styles.memberOption,
                      {
                        backgroundColor: maxMembers === count ? colors.primary : colors.surfaceLight,
                        borderColor: maxMembers === count ? colors.primary : colors.border,
                      }
                    ]}
                    onPress={() => setMaxMembers(count)}
                  >
                    <Text style={[
                      styles.memberOptionText,
                      { color: maxMembers === count ? '#FFFFFF' : colors.text }
                    ]}>
                      {count}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.buttonPrimaryBg }]}
                onPress={handleCreate}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.buttonPrimaryText} />
                ) : (
                  <>
                    <Ionicons name="key-outline" size={20} color={colors.buttonPrimaryText} style={{ marginRight: 8 }} />
                    <Text style={[styles.submitBtnText, { color: colors.buttonPrimaryText }]}>Create & Generate PIN</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.successBody}>
              <View style={[styles.successBadge, { backgroundColor: colors.badgeBg }]}>
                <Ionicons name="lock-closed" size={32} color={colors.primary} />
              </View>
              
              <Text style={[styles.successTitle, { color: colors.text }]}>Room Created!</Text>
              <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
                Share this 6-digit PIN with your friends to let them join.
              </Text>

              <View style={[styles.pinBox, { backgroundColor: colors.inputBg, borderColor: colors.primary }]}>
                <Text style={[styles.pinText, { color: colors.primary }]}>{createdRoom.id}</Text>
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: colors.surfaceLight, borderColor: colors.border }]} 
                  onPress={handleCopyPin}
                >
                  <Ionicons name="copy-outline" size={18} color={colors.text} />
                  <Text style={[styles.actionBtnText, { color: colors.text }]}>Copy PIN</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.actionBtn, { backgroundColor: colors.badgeBg, borderColor: colors.primary }]} 
                  onPress={handleSharePin}
                >
                  <Ionicons name="share-social-outline" size={18} color={colors.primary} />
                  <Text style={[styles.actionBtnText, { color: colors.primary }]}>Share PIN</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.buttonPrimaryBg, marginTop: 24 }]}
                onPress={handleEnterRoom}
              >
                <Text style={[styles.submitBtnText, { color: colors.buttonPrimaryText }]}>Enter Room Now →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    gap: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: -8,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    borderWidth: 1,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  durationOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  durationOptionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  membersRow: {
    flexDirection: 'row',
    gap: 8,
  },
  memberOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  memberOptionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  submitBtn: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '800',
  },
  successBody: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  successBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  successSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  pinBox: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 20,
  },
  pinText: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
