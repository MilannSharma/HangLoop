import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { RoomData, UserProfile } from '../services/api';
import { CreatePrivateRoomModal } from '../components/CreatePrivateRoomModal';
import { JoinPrivateRoomModal } from '../components/JoinPrivateRoomModal';

interface ChatsScreenProps {
  user: UserProfile;
  currentTab: 'HOME' | 'CHATS' | 'PROFILE';
  onSelectTab: (tab: 'HOME' | 'CHATS' | 'PROFILE') => void;
  onJoinRoom: (room: RoomData) => void;
  onOpenProfile?: () => void;
}

export const ChatsScreen: React.FC<ChatsScreenProps> = ({
  user,
  currentTab,
  onSelectTab,
  onJoinRoom,
  onOpenProfile,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [privateRooms, setPrivateRooms] = useState<RoomData[]>([]);

  const headerPaddingTop = insets.top > 0 ? insets.top + 8 : 16;
  const bottomNavPaddingBottom = insets.bottom > 0 ? insets.bottom + 8 : 12;

  const handleRoomCreated = (room: RoomData) => {
    setPrivateRooms((prev) => [room, ...prev.filter(r => r.id !== room.id)]);
    onJoinRoom(room);
  };

  return (
    <View style={[styles.mainWrapper, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: headerPaddingTop, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.brandRow}>
          <Ionicons name="chatbubbles" size={24} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>Chats & Private Rooms</Text>
        </View>
        <TouchableOpacity onPress={onOpenProfile} style={[styles.avatarBtn, { borderColor: colors.primary }]}>
          <Image source={{ uri: user.avatar_url || 'https://i.pravatar.cc/100' }} style={styles.headerAvatar} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Private Room Actions Header Section */}
        <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>PRIVATE ROOM MANAGEMENT</Text>
        
        <View style={styles.privateActionsRow}>
          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: colors.primary }]} 
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add-circle" size={24} color="#FFFFFF" />
            <View style={styles.actionCardTextWrapper}>
              <Text style={styles.actionCardTitle}>Create Private Room</Text>
              <Text style={styles.actionCardSubtitle}>Set name, duration (≤1h) & PIN</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]} 
            onPress={() => setShowJoinModal(true)}
          >
            <Ionicons name="key-outline" size={24} color={colors.primary} />
            <View style={styles.actionCardTextWrapper}>
              <Text style={[styles.actionCardTitle, { color: colors.text }]}>Join Private Room</Text>
              <Text style={[styles.actionCardSubtitle, { color: colors.textSecondary }]}>Enter 6-Digit PIN</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Section: Active Conversations & Private Rooms */}
        <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>RECENT CONVERSATIONS</Text>

        {privateRooms.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={[styles.emptyIconCircle, { backgroundColor: colors.badgeBg }]}>
              <Ionicons name="chatbubbles-outline" size={36} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Private Conversations Yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Create a private chat room with a 6-digit PIN or join one from your friends.
            </Text>
          </View>
        ) : (
          <View style={styles.roomsList}>
            {privateRooms.map((room) => (
              <TouchableOpacity
                key={room.id}
                style={[styles.roomCardRow, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
                onPress={() => onJoinRoom(room)}
              >
                <View style={[styles.roomIconBadge, { backgroundColor: colors.badgeBg }]}>
                  <Ionicons name="lock-closed" size={20} color={colors.primary} />
                </View>

                <View style={styles.roomInfo}>
                  <Text style={[styles.roomName, { color: colors.text }]} numberOfLines={1}>
                    {room.name}
                  </Text>
                  <Text style={[styles.roomMeta, { color: colors.textSecondary }]}>
                    PIN: {room.id} • Host: @{room.created_by}
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Safe Area Bottom Navigation */}
      <View style={[
        styles.bottomNav, 
        { 
          backgroundColor: colors.surface, 
          borderTopColor: colors.border,
          paddingBottom: bottomNavPaddingBottom
        }
      ]}>
        <TouchableOpacity style={styles.navItem} onPress={() => onSelectTab('HOME')}>
          <Ionicons name="home-outline" size={22} color={currentTab === 'HOME' ? colors.primary : colors.textMuted} />
          <Text style={[styles.navText, { color: currentTab === 'HOME' ? colors.primary : colors.textMuted }]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => onSelectTab('CHATS')}>
          <Ionicons name="chatbubbles" size={22} color={currentTab === 'CHATS' ? colors.primary : colors.textMuted} />
          <Text style={[styles.navText, { color: currentTab === 'CHATS' ? colors.primary : colors.textMuted }]}>Chats</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => onSelectTab('PROFILE')}>
          <Ionicons name="person-outline" size={22} color={currentTab === 'PROFILE' ? colors.primary : colors.textMuted} />
          <Text style={[styles.navText, { color: currentTab === 'PROFILE' ? colors.primary : colors.textMuted }]}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Private Room Creation & Join Modals */}
      <CreatePrivateRoomModal
        visible={showCreateModal}
        user={user}
        onClose={() => setShowCreateModal(false)}
        onRoomCreated={handleRoomCreated}
      />

      <JoinPrivateRoomModal
        visible={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onJoinRoom={(room) => onJoinRoom(room)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  avatarBtn: {
    padding: 2,
    borderWidth: 1.5,
    borderRadius: 22,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  privateActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },
  actionCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionCardTextWrapper: {
    marginLeft: 10,
    flex: 1,
  },
  actionCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  actionCardSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  emptyBox: {
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  roomsList: {
    gap: 12,
  },
  roomCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  roomIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  roomMeta: {
    fontSize: 12,
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
});
