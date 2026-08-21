import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Share,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

interface HostControlsModalProps {
  visible: boolean;
  roomId: string;
  roomName: string;
  members: Array<{ id: string; username: string; avatar_url: string }>;
  currentUserId: string;
  onClose: () => void;
  onKickMember: (userId: string) => void;
  onBlockMember: (userId: string, username?: string) => void;
  onEndRoom: () => void;
}

export const HostControlsModal: React.FC<HostControlsModalProps> = ({
  visible,
  roomId,
  roomName,
  members,
  currentUserId,
  onClose,
  onKickMember,
  onBlockMember,
  onEndRoom,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const handleSharePin = async () => {
    try {
      await Share.share({
        message: `Join my Hangloop private room "${roomName}" using PIN: ${roomId}`,
      });
    } catch (e) {
      console.log('Share PIN error:', e);
    }
  };

  const handleConfirmEndRoom = () => {
    Alert.alert(
      'End Room',
      'Are you sure you want to end this room for all participants?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Room',
          style: 'destructive',
          onPress: () => {
            onClose();
            onEndRoom();
          },
        },
      ]
    );
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
            <View style={styles.headerTitleRow}>
              <Ionicons name="shield-checkmark" size={20} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.headerTitle, { color: colors.text }]}>Host Controls</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            {/* PIN Card */}
            <View style={[styles.pinCard, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <View>
                <Text style={[styles.pinLabel, { color: colors.textSecondary }]}>Room PIN Code</Text>
                <Text style={[styles.pinCode, { color: colors.primary }]}>{roomId}</Text>
              </View>

              <TouchableOpacity style={[styles.sharePinBtn, { backgroundColor: colors.primary }]} onPress={handleSharePin}>
                <Ionicons name="share-social-outline" size={16} color="#FFFFFF" />
                <Text style={styles.sharePinBtnText}>Share PIN</Text>
              </TouchableOpacity>
            </View>

            {/* Member Management Section */}
            <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
              ROOM MEMBERS ({members.length})
            </Text>

            {members.map((member) => {
              const isSelf = member.id === currentUserId;
              return (
                <View key={member.id} style={[styles.memberRow, { borderBottomColor: colors.border }]}>
                  <Image 
                    source={{ uri: member.avatar_url || 'https://i.pravatar.cc/100' }} 
                    style={[styles.memberAvatar, { borderColor: colors.border }]} 
                  />
                  <View style={styles.memberInfo}>
                    <Text style={[styles.memberName, { color: colors.text }]}>@{member.username}</Text>
                    {isSelf && <Text style={[styles.hostTag, { color: colors.primary }]}>Host (You)</Text>}
                  </View>

                  {!isSelf && (
                    <View style={styles.memberActions}>
                      <TouchableOpacity 
                        style={[styles.memberActionBtn, { backgroundColor: colors.surfaceLight }]} 
                        onPress={() => onKickMember(member.id)}
                      >
                        <Ionicons name="remove-circle-outline" size={16} color={colors.text} />
                        <Text style={[styles.memberActionBtnText, { color: colors.text }]}>Kick</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={[styles.memberActionBtn, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]} 
                        onPress={() => onBlockMember(member.id)}
                      >
                        <Ionicons name="ban-outline" size={16} color="#EF4444" />
                        <Text style={[styles.memberActionBtnText, { color: '#EF4444' }]}>Block</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}

            {/* End Room Action */}
            <TouchableOpacity 
              style={[styles.endRoomBtn, { backgroundColor: '#EF4444' }]} 
              onPress={handleConfirmEndRoom}
            >
              <Ionicons name="power-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.endRoomBtnText}>End Room for Everyone</Text>
            </TouchableOpacity>
          </ScrollView>
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
    maxHeight: '85%',
    padding: 20,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  pinCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  pinLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  pinCode: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 4,
    marginTop: 2,
  },
  sharePinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  sharePinBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 8,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '700',
  },
  hostTag: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  memberActions: {
    flexDirection: 'row',
    gap: 8,
  },
  memberActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  memberActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  endRoomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 16,
  },
  endRoomBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
