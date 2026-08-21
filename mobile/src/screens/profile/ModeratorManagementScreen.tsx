import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { api, ModeratorItem, UserProfile } from '../../services/api';

interface ModeratorManagementScreenProps {
  onBack: () => void;
}

export const ModeratorManagementScreen: React.FC<ModeratorManagementScreenProps> = ({ onBack }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [moderators, setModerators] = useState<ModeratorItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Add Moderator Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [userSearchText, setUserSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Moderator Permissions
  const [canDeleteMessages, setCanDeleteMessages] = useState(true);
  const [canTimeoutUsers, setCanTimeoutUsers] = useState(true);
  const [canKickUsers, setCanKickUsers] = useState(true);

  // Edit Permissions Modal
  const [editingModerator, setEditingModerator] = useState<ModeratorItem | null>(null);

  const headerPaddingTop = insets.top > 0 ? insets.top + 8 : 12;
  const bottomPadding = insets.bottom > 0 ? insets.bottom + 24 : 32;

  useEffect(() => {
    loadModerators();
  }, []);

  const loadModerators = async () => {
    setIsLoading(true);
    try {
      const res = await api.getModerators();
      if (res.success && res.moderators) {
        setModerators(res.moderators);
      } else if (res.error) {
        Alert.alert('Error', res.error);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to load moderators');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchUsers = async (text: string) => {
    setUserSearchText(text);
    if (!text.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearchingUsers(true);
    try {
      const res = await api.searchUsers(text.trim());
      if (res.success && res.users) {
        setSearchResults(res.users);
      }
    } catch (e) {
      console.warn('Search error:', e);
    } finally {
      setIsSearchingUsers(false);
    }
  };

  const handleSelectUserToAdd = (u: UserProfile) => {
    setSelectedUser(u);
    setUserSearchText(u.full_name || u.username);
    setSearchResults([]);
  };

  const handleAddModerator = async () => {
    const target = selectedUser?.email || selectedUser?.username || selectedUser?.id || userSearchText.trim();
    if (!target) {
      Alert.alert('Missing Target', 'Please search and select a user to add as moderator.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.addModerator(target, {
        userId: selectedUser?.id,
        username: selectedUser?.username,
        full_name: selectedUser?.full_name,
        avatar_url: selectedUser?.avatar_url,
        email: selectedUser?.email,
        can_delete_messages: canDeleteMessages,
        can_timeout_users: canTimeoutUsers,
        can_kick_users: canKickUsers,
      });

      if (res.success) {
        Alert.alert('Success 🎉', res.message || 'User has been assigned as a Moderator!');
        setShowAddModal(false);
        setSelectedUser(null);
        setUserSearchText('');
        loadModerators();
      } else {
        Alert.alert('Error', res.error || 'Failed to add moderator');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePermissions = async () => {
    if (!editingModerator) return;
    setIsSubmitting(true);
    try {
      const res = await api.updateModerator(editingModerator.id, {
        can_delete_messages: editingModerator.can_delete_messages,
        can_timeout_users: editingModerator.can_timeout_users,
        can_kick_users: editingModerator.can_kick_users,
        is_active: editingModerator.is_active,
      });

      if (res.success) {
        Alert.alert('Success', 'Moderator permissions updated successfully!');
        setEditingModerator(null);
        loadModerators();
      } else {
        Alert.alert('Error', res.error || 'Failed to update permissions');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Network error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (mod: ModeratorItem) => {
    const updatedStatus = !mod.is_active;
    try {
      const res = await api.updateModerator(mod.id, {
        is_active: updatedStatus,
      });
      if (res.success) {
        setModerators((prev) =>
          prev.map((m) => (m.id === mod.id ? { ...m, is_active: updatedStatus } : m))
        );
      } else {
        Alert.alert('Error', res.error || 'Failed to update status');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleRemoveModerator = (mod: ModeratorItem) => {
    Alert.alert(
      'Remove Moderator',
      `Are you sure you want to remove ${mod.full_name || mod.username} from Moderators? They will lose all chat moderation privileges.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.removeModerator(mod.id);
              if (res.success) {
                setModerators((prev) => prev.filter((m) => m.id !== mod.id));
                Alert.alert('Removed', `${mod.full_name || mod.username} is no longer a moderator.`);
              } else {
                Alert.alert('Error', res.error || 'Failed to remove');
              }
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ]
    );
  };

  const filteredModerators = moderators.filter(
    (m) =>
      m.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.full_name && m.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.user_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderModeratorItem = ({ item }: { item: ModeratorItem }) => (
    <View
      style={[
        styles.moderatorCard,
        {
          backgroundColor: colors.surface,
          borderColor: item.is_active ? '#D4A017' : colors.border,
        },
      ]}
    >
      {/* Header Info */}
      <View style={styles.cardHeader}>
        <View style={styles.avatarWrap}>
          <Image
            source={{ uri: item.avatar_url || 'https://i.pravatar.cc/100' }}
            style={[
              styles.avatar,
              { borderColor: item.is_active ? '#F0C040' : colors.border },
            ]}
          />
          {item.is_active && (
            <View style={styles.goldActiveDot} />
          )}
        </View>

        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.fullName, { color: colors.text }]}>{item.full_name || item.username}</Text>
            <View style={[styles.goldBadge, { opacity: item.is_active ? 1 : 0.4 }]}>
              <Ionicons name="shield-checkmark" size={10} color="#0A0A0A" />
              <Text style={styles.goldBadgeText}>MOD</Text>
            </View>
          </View>
          <Text style={[styles.usernameText, { color: colors.textMuted }]}>@{item.username} • ID: {item.user_id}</Text>
          <Text style={[styles.emailText, { color: colors.textMuted }]}>{item.email}</Text>
        </View>

        {/* Active Toggle */}
        <View style={styles.statusSwitch}>
          <Switch
            value={item.is_active}
            onValueChange={() => handleToggleActive(item)}
            trackColor={{ false: colors.border, true: 'rgba(212, 160, 23, 0.4)' }}
            thumbColor={item.is_active ? '#F0C040' : '#888888'}
          />
          <Text style={[styles.statusLabel, { color: item.is_active ? '#F0C040' : colors.textMuted }]}>
            {item.is_active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      {/* Permissions Chips */}
      <View style={styles.permissionsRow}>
        <View style={[styles.permChip, item.can_delete_messages && styles.permChipActive]}>
          <Ionicons
            name={item.can_delete_messages ? 'trash' : 'close-circle-outline'}
            size={12}
            color={item.can_delete_messages ? '#F0C040' : colors.textMuted}
          />
          <Text style={[styles.permChipText, { color: item.can_delete_messages ? '#F0C040' : colors.textMuted }]}>
            Delete Messages
          </Text>
        </View>

        <View style={[styles.permChip, item.can_timeout_users && styles.permChipActive]}>
          <Ionicons
            name={item.can_timeout_users ? 'time' : 'close-circle-outline'}
            size={12}
            color={item.can_timeout_users ? '#F0C040' : colors.textMuted}
          />
          <Text style={[styles.permChipText, { color: item.can_timeout_users ? '#F0C040' : colors.textMuted }]}>
            Timeout Users
          </Text>
        </View>

        <View style={[styles.permChip, item.can_kick_users && styles.permChipActive]}>
          <Ionicons
            name={item.can_kick_users ? 'person-remove' : 'close-circle-outline'}
            size={12}
            color={item.can_kick_users ? '#F0C040' : colors.textMuted}
          />
          <Text style={[styles.permChipText, { color: item.can_kick_users ? '#F0C040' : colors.textMuted }]}>
            Kick from Room
          </Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: colors.border }]}
          onPress={() => setEditingModerator({ ...item })}
        >
          <Ionicons name="settings-outline" size={14} color={colors.primary} />
          <Text style={[styles.actionBtnText, { color: colors.primary }]}>Edit Permissions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: 'rgba(239, 68, 68, 0.3)' }]}
          onPress={() => handleRemoveModerator(item)}
        >
          <Ionicons name="trash-outline" size={14} color={colors.liveRed} />
          <Text style={[styles.actionBtnText, { color: colors.liveRed }]}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.mainWrapper, { backgroundColor: colors.background }]}>
      {/* Top Header */}
      <View style={[styles.header, { paddingTop: headerPaddingTop, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Moderator Management</Text>
          <Text style={[styles.headerSubtitle, { color: '#F0C040' }]}>Super Admin Controls</Text>
        </View>
        <TouchableOpacity
          style={[styles.addModBtn, { backgroundColor: '#F0C040' }]}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="person-add" size={16} color="#0A0A0A" />
          <Text style={styles.addModBtnText}>Add Mod</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search moderators by name, username, email..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Notice Banner */}
      <View style={[styles.infoBanner, { backgroundColor: 'rgba(212, 160, 23, 0.08)', borderColor: 'rgba(212, 160, 23, 0.25)' }]}>
        <Ionicons name="shield-checkmark" size={18} color="#F0C040" style={{ marginRight: 10 }} />
        <Text style={[styles.infoBannerText, { color: colors.text }]}>
          Moderators receive a <Text style={{ color: '#F0C040', fontWeight: '800' }}>Golden Profile Badge</Text> and are granted permissions specifically to manage live chat (timeouts, message deletions, and user removals).
        </Text>
      </View>

      {/* Moderators List */}
      {isLoading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color="#F0C040" />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading moderators…</Text>
        </View>
      ) : (
        <FlatList
          data={filteredModerators}
          keyExtractor={(item) => item.id}
          renderItem={renderModeratorItem}
          contentContainerStyle={[styles.listContainer, { paddingBottom: bottomPadding }]}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="shield-outline" size={48} color={colors.textMuted} style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Moderators Found</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                {searchQuery ? 'No moderators matched your search.' : 'Tap "Add Mod" to assign your first chat moderator.'}
              </Text>
            </View>
          }
        />
      )}

      {/* ── ADD MODERATOR MODAL ── */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: '#D4A017' }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Ionicons name="shield-checkmark" size={22} color="#F0C040" style={{ marginRight: 8 }} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>Add New Moderator</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddModal(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Search User (Username / Email / User ID)</Text>
              <View style={[styles.modalSearchInputWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                <Ionicons name="search" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.modalSearchInput, { color: colors.text }]}
                  placeholder="e.g. milan, rahul@gmail.com, ULP8F2K9"
                  placeholderTextColor={colors.textMuted}
                  value={userSearchText}
                  onChangeText={handleSearchUsers}
                />
                {isSearchingUsers && <ActivityIndicator size="small" color="#F0C040" />}
              </View>

              {/* Selected User Indicator */}
              {selectedUser && (
                <View style={[styles.selectedUserCard, { borderColor: '#F0C040' }]}>
                  <Image source={{ uri: selectedUser.avatar_url || 'https://i.pravatar.cc/100' }} style={styles.selectedUserAvatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.selectedUserName, { color: colors.text }]}>{selectedUser.full_name || selectedUser.username}</Text>
                    <Text style={[styles.selectedUserSub, { color: colors.textMuted }]}>@{selectedUser.username} • {selectedUser.email}</Text>
                  </View>
                  <Ionicons name="checkmark-circle" size={22} color="#F0C040" />
                </View>
              )}

              {/* Search Suggestions List */}
              {searchResults.length > 0 && !selectedUser && (
                <View style={[styles.suggestionsBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  {searchResults.map((u) => (
                    <TouchableOpacity
                      key={u.id}
                      style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
                      onPress={() => handleSelectUserToAdd(u)}
                    >
                      <Image source={{ uri: u.avatar_url || 'https://i.pravatar.cc/80' }} style={styles.sugAvatar} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.sugName, { color: colors.text }]}>{u.full_name || u.username}</Text>
                        <Text style={[styles.sugSub, { color: colors.textMuted }]}>@{u.username} • {u.email}</Text>
                      </View>
                      <Ionicons name="add-circle" size={20} color="#F0C040" />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Permissions Section */}
              <Text style={[styles.inputLabel, { color: colors.textMuted, marginTop: 18 }]}>Moderator Chat Permissions</Text>

              {/* Permission 1 */}
              <View style={[styles.permToggleRow, { borderBottomColor: colors.border }]}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={[styles.permToggleTitle, { color: colors.text }]}>Delete Inappropriate Messages</Text>
                  <Text style={[styles.permToggleDesc, { color: colors.textMuted }]}>Allow removing problematic chat messages in live rooms.</Text>
                </View>
                <Switch
                  value={canDeleteMessages}
                  onValueChange={setCanDeleteMessages}
                  trackColor={{ false: colors.border, true: 'rgba(212, 160, 23, 0.4)' }}
                  thumbColor={canDeleteMessages ? '#F0C040' : '#888888'}
                />
              </View>

              {/* Permission 2 */}
              <View style={[styles.permToggleRow, { borderBottomColor: colors.border }]}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={[styles.permToggleTitle, { color: colors.text }]}>Timeout Chat Users</Text>
                  <Text style={[styles.permToggleDesc, { color: colors.textMuted }]}>Allow giving users 5m / 15m / 1h chat timeouts.</Text>
                </View>
                <Switch
                  value={canTimeoutUsers}
                  onValueChange={setCanTimeoutUsers}
                  trackColor={{ false: colors.border, true: 'rgba(212, 160, 23, 0.4)' }}
                  thumbColor={canTimeoutUsers ? '#F0C040' : '#888888'}
                />
              </View>

              {/* Permission 3 */}
              <View style={styles.permToggleRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={[styles.permToggleTitle, { color: colors.text }]}>Kick / Remove from Room</Text>
                  <Text style={[styles.permToggleDesc, { color: colors.textMuted }]}>Allow removing disruptive members from the live room.</Text>
                </View>
                <Switch
                  value={canKickUsers}
                  onValueChange={setCanKickUsers}
                  trackColor={{ false: colors.border, true: 'rgba(212, 160, 23, 0.4)' }}
                  thumbColor={canKickUsers ? '#F0C040' : '#888888'}
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: '#F0C040' }]}
                onPress={handleAddModerator}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#0A0A0A" />
                ) : (
                  <>
                    <Ionicons name="shield-checkmark" size={18} color="#0A0A0A" style={{ marginRight: 8 }} />
                    <Text style={styles.submitBtnText}>Assign as Moderator</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── EDIT PERMISSIONS MODAL ── */}
      {editingModerator && (
        <Modal visible={!!editingModerator} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: '#D4A017' }]}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleRow}>
                  <Ionicons name="settings" size={20} color="#F0C040" style={{ marginRight: 8 }} />
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    Permissions: {editingModerator.full_name || editingModerator.username}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setEditingModerator(null)}>
                  <Ionicons name="close" size={22} color={colors.textMuted} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                {/* Active Toggle */}
                <View style={[styles.permToggleRow, { borderBottomColor: colors.border }]}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={[styles.permToggleTitle, { color: colors.text }]}>Moderator Active Status</Text>
                    <Text style={[styles.permToggleDesc, { color: colors.textMuted }]}>Temporarily enable or disable all moderator privileges.</Text>
                  </View>
                  <Switch
                    value={editingModerator.is_active}
                    onValueChange={(val) => setEditingModerator({ ...editingModerator, is_active: val })}
                    trackColor={{ false: colors.border, true: 'rgba(212, 160, 23, 0.4)' }}
                    thumbColor={editingModerator.is_active ? '#F0C040' : '#888888'}
                  />
                </View>

                {/* Delete Messages */}
                <View style={[styles.permToggleRow, { borderBottomColor: colors.border }]}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={[styles.permToggleTitle, { color: colors.text }]}>Delete Inappropriate Messages</Text>
                    <Text style={[styles.permToggleDesc, { color: colors.textMuted }]}>Allow removing messages in live chat.</Text>
                  </View>
                  <Switch
                    value={editingModerator.can_delete_messages}
                    onValueChange={(val) => setEditingModerator({ ...editingModerator, can_delete_messages: val })}
                    trackColor={{ false: colors.border, true: 'rgba(212, 160, 23, 0.4)' }}
                    thumbColor={editingModerator.can_delete_messages ? '#F0C040' : '#888888'}
                  />
                </View>

                {/* Timeout Users */}
                <View style={[styles.permToggleRow, { borderBottomColor: colors.border }]}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={[styles.permToggleTitle, { color: colors.text }]}>Timeout Chat Users</Text>
                    <Text style={[styles.permToggleDesc, { color: colors.textMuted }]}>Allow placing users on chat timeout.</Text>
                  </View>
                  <Switch
                    value={editingModerator.can_timeout_users}
                    onValueChange={(val) => setEditingModerator({ ...editingModerator, can_timeout_users: val })}
                    trackColor={{ false: colors.border, true: 'rgba(212, 160, 23, 0.4)' }}
                    thumbColor={editingModerator.can_timeout_users ? '#F0C040' : '#888888'}
                  />
                </View>

                {/* Kick from Room */}
                <View style={styles.permToggleRow}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={[styles.permToggleTitle, { color: colors.text }]}>Kick from Room</Text>
                    <Text style={[styles.permToggleDesc, { color: colors.textMuted }]}>Allow removing disruptive members from room.</Text>
                  </View>
                  <Switch
                    value={editingModerator.can_kick_users}
                    onValueChange={(val) => setEditingModerator({ ...editingModerator, can_kick_users: val })}
                    trackColor={{ false: colors.border, true: 'rgba(212, 160, 23, 0.4)' }}
                    thumbColor={editingModerator.can_kick_users ? '#F0C040' : '#888888'}
                  />
                </View>

                {/* Save Changes */}
                <TouchableOpacity
                  style={[styles.submitBtn, { backgroundColor: '#F0C040' }]}
                  onPress={handleUpdatePermissions}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#0A0A0A" />
                  ) : (
                    <Text style={styles.submitBtnText}>Save Permissions</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 8,
  },
  iconBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  addModBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    gap: 6,
  },
  addModBtnText: {
    color: '#0A0A0A',
    fontWeight: '800',
    fontSize: 13,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  moderatorCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
  },
  goldActiveDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#0A0A0A',
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  fullName: {
    fontSize: 15,
    fontWeight: '800',
  },
  goldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0C040',
    paddingHorizontal: 6,
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
    fontSize: 12,
    fontWeight: '600',
  },
  emailText: {
    fontSize: 11,
    marginTop: 2,
  },
  statusSwitch: {
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  permissionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  permChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    gap: 4,
  },
  permChipActive: {
    backgroundColor: 'rgba(212, 160, 23, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.3)',
  },
  permChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  loadingWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 30,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 2,
    paddingHorizontal: 20,
    paddingTop: 18,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalSearchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 14,
  },
  suggestionsBox: {
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 6,
    maxHeight: 160,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
  },
  sugAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  sugName: {
    fontSize: 13,
    fontWeight: '700',
  },
  sugSub: {
    fontSize: 11,
  },
  selectedUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    backgroundColor: 'rgba(212, 160, 23, 0.08)',
    marginTop: 8,
  },
  selectedUserAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
  },
  selectedUserName: {
    fontSize: 14,
    fontWeight: '800',
  },
  selectedUserSub: {
    fontSize: 11,
  },
  permToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  permToggleTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  permToggleDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 20,
  },
  submitBtnText: {
    color: '#0A0A0A',
    fontSize: 15,
    fontWeight: '800',
  },
});
