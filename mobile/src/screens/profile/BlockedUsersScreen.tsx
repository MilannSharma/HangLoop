import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { BlockedUserInfo } from '../../../App';

interface BlockedUsersScreenProps {
  blockedUsers: BlockedUserInfo[];
  onUnblockUser: (userId: string) => void;
  onBack: () => void;
}

export const BlockedUsersScreen: React.FC<BlockedUsersScreenProps> = ({
  blockedUsers,
  onUnblockUser,
  onBack,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const headerPaddingTop = insets.top > 0 ? insets.top + 8 : 12;
  const bottomPadding = insets.bottom > 0 ? insets.bottom + 24 : 32;

  const handleConfirmUnblock = (user: BlockedUserInfo) => {
    Alert.alert(
      `Unblock @${user.username}?`,
      `Are you sure you want to unblock @${user.username}? Their messages and interactions will be visible again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          style: 'default',
          onPress: () => {
            onUnblockUser(user.id);
            Alert.alert('Unblocked', `@${user.username} has been unblocked.`);
          },
        },
      ]
    );
  };

  const renderBlockedItem = ({ item }: { item: BlockedUserInfo }) => (
    <View style={[styles.userRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Image source={{ uri: item.avatar_url || 'https://i.pravatar.cc/100' }} style={styles.avatar} />
      <View style={styles.userInfo}>
        <Text style={[styles.username, { color: colors.text }]}>@{item.username}</Text>
        <Text style={[styles.userStatus, { color: colors.textMuted }]}>Blocked account</Text>
      </View>
      <TouchableOpacity
        style={[styles.unblockBtn, { backgroundColor: colors.badgeBg, borderColor: colors.primary }]}
        onPress={() => handleConfirmUnblock(item)}
      >
        <Ionicons name="lock-open-outline" size={14} color={colors.primary} style={{ marginRight: 4 }} />
        <Text style={[styles.unblockBtnText, { color: colors.primary }]}>Unblock</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.mainWrapper, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: headerPaddingTop, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Blocked Users</Text>
        <View style={{ width: 40 }} />
      </View>

      {blockedUsers.length === 0 ? (
        /* Clean Empty State */
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconCircle, { backgroundColor: colors.surface }]}>
            <Ionicons name="ban-outline" size={48} color={colors.textMuted} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No blocked users</Text>
          <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
            You haven't blocked anyone yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={blockedUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderBlockedItem}
          contentContainerStyle={[styles.listContainer, { paddingBottom: bottomPadding }]}
        />
      )}
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  iconBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 10,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 15,
    fontWeight: '700',
  },
  userStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  unblockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  unblockBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 14,
    textAlign: 'center',
  },
});
