import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Alert, BackHandler } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { UserProfile, SUPER_ADMIN_EMAIL } from '../services/api';
import { BlockedUserInfo } from '../../App';
import { EditProfileScreen } from './profile/EditProfileScreen';
import { NotificationsScreen } from './profile/NotificationsScreen';
import { PrivacySecurityScreen } from './profile/PrivacySecurityScreen';
import { BlockedUsersScreen } from './profile/BlockedUsersScreen';
import { HelpCenterScreen } from './profile/HelpCenterScreen';
import { TermsScreen } from './profile/TermsScreen';
import { MusicCatalogScreen } from './MusicCatalogScreen';
import { ModeratorManagementScreen } from './profile/ModeratorManagementScreen';

export type ProfileSubScreen =
  | 'MAIN'
  | 'EDIT_PROFILE'
  | 'NOTIFICATIONS'
  | 'PRIVACY_SECURITY'
  | 'BLOCKED_USERS'
  | 'HELP_CENTER'
  | 'TERMS'
  | 'MUSIC_CATALOG'
  | 'MODERATOR_MANAGEMENT';

interface ProfileScreenProps {
  user: UserProfile;
  blockedUsers?: BlockedUserInfo[];
  onUpdateUser?: (user: UserProfile) => void;
  onUnblockUser?: (userId: string) => void;
  onBack: () => void;
  onLogout: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  blockedUsers = [],
  onUpdateUser,
  onUnblockUser,
  onBack,
  onLogout,
}) => {
  const { colors, themeMode, setThemeMode } = useTheme();
  const insets = useSafeAreaInsets();

  const [activeSubScreen, setActiveSubScreen] = useState<ProfileSubScreen>('MAIN');

  const isSuperAdmin = (user.email || '').toLowerCase().trim() === SUPER_ADMIN_EMAIL.toLowerCase();
  const isModerator = user.is_moderator || isSuperAdmin;

  useEffect(() => {
    const onBackPress = () => {
      if (activeSubScreen !== 'MAIN') {
        setActiveSubScreen('MAIN');
        return true; // handled
      }
      onBack();
      return true; // handled
    };

    const backSub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backSub.remove();
  }, [activeSubScreen, onBack]);

  const headerPaddingTop = insets.top > 0 ? insets.top + 8 : 12;
  const bottomPadding = insets.bottom > 0 ? insets.bottom + 24 : 32;

  // Render Sub-screens if navigated into
  if (activeSubScreen === 'MUSIC_CATALOG' && isSuperAdmin) {
    return <MusicCatalogScreen onBack={() => setActiveSubScreen('MAIN')} />;
  }

  if (activeSubScreen === 'MODERATOR_MANAGEMENT' && isSuperAdmin) {
    return <ModeratorManagementScreen onBack={() => setActiveSubScreen('MAIN')} />;
  }

  if (activeSubScreen === 'EDIT_PROFILE') {
    return (
      <EditProfileScreen
        user={user}
        onSaveUser={(updated) => {
          if (onUpdateUser) onUpdateUser(updated);
        }}
        onBack={() => setActiveSubScreen('MAIN')}
      />
    );
  }

  if (activeSubScreen === 'NOTIFICATIONS') {
    return <NotificationsScreen onBack={() => setActiveSubScreen('MAIN')} />;
  }

  if (activeSubScreen === 'PRIVACY_SECURITY') {
    return (
      <PrivacySecurityScreen
        blockedUsersCount={blockedUsers.length}
        onOpenBlockedUsers={() => setActiveSubScreen('BLOCKED_USERS')}
        onBack={() => setActiveSubScreen('MAIN')}
      />
    );
  }

  if (activeSubScreen === 'BLOCKED_USERS') {
    return (
      <BlockedUsersScreen
        blockedUsers={blockedUsers}
        onUnblockUser={(id) => {
          if (onUnblockUser) onUnblockUser(id);
        }}
        onBack={() => setActiveSubScreen('MAIN')}
      />
    );
  }

  if (activeSubScreen === 'HELP_CENTER') {
    return <HelpCenterScreen onBack={() => setActiveSubScreen('MAIN')} />;
  }

  if (activeSubScreen === 'TERMS') {
    return <TermsScreen onBack={() => setActiveSubScreen('MAIN')} />;
  }

  // Main Profile Overview Screen
  return (
    <View style={[styles.mainWrapper, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: headerPaddingTop, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profile & Settings</Text>
        <TouchableOpacity onPress={onLogout} style={styles.iconBtn}>
          <Ionicons name="log-out-outline" size={24} color={colors.liveRed} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}>
        {/* Avatar Section */}
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: user.avatar_url || 'https://i.pravatar.cc/150' }}
            style={[
              styles.avatarImage,
              {
                borderColor: isModerator ? '#F0C040' : colors.primary,
                borderWidth: isModerator ? 3 : 2,
              },
            ]}
          />
          <TouchableOpacity
            style={[styles.editAvatarBtn, { backgroundColor: colors.primary, borderColor: colors.background }]}
            onPress={() => setActiveSubScreen('EDIT_PROFILE')}
          >
            <Ionicons name="camera" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <Text style={[styles.fullNameText, { color: colors.text }]}>{user.full_name || user.username}</Text>
        <Text style={[styles.username, { color: isModerator ? '#F0C040' : colors.primary }]}>@{user.username}</Text>

        {/* Role & System User ID */}
        <View style={styles.badgesRow}>
          {isSuperAdmin && (
            <View style={[styles.superAdminBadge, { backgroundColor: '#8B5CF6' }]}>
              <Ionicons name="shield-checkmark" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.superAdminBadgeText}>SUPER ADMIN</Text>
            </View>
          )}

          {isModerator && !isSuperAdmin && (
            <View style={[styles.moderatorBadge, { backgroundColor: '#F0C040', borderColor: '#D4A017' }]}>
              <Ionicons name="shield-checkmark" size={12} color="#0A0A0A" style={{ marginRight: 4 }} />
              <Text style={styles.moderatorBadgeText}>MODERATOR</Text>
            </View>
          )}

          <View
            style={[
              styles.userIdBadge,
              {
                backgroundColor: isModerator ? 'rgba(212, 160, 23, 0.12)' : colors.badgeBg,
                borderColor: isModerator ? '#F0C040' : colors.primary,
              },
            ]}
          >
            <Ionicons name="finger-print-outline" size={13} color={isModerator ? '#F0C040' : colors.primary} style={{ marginRight: 4 }} />
            <Text style={[styles.userIdBadgeText, { color: isModerator ? '#F0C040' : colors.primary }]}>ID: {user.id}</Text>
          </View>
        </View>

        <Text style={[styles.bio, { color: colors.textSecondary }]}>{user.bio || 'Listening to music on Hangloop'}</Text>

        {/* Quick Edit Profile Button */}
        <TouchableOpacity
          style={[styles.quickEditBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setActiveSubScreen('EDIT_PROFILE')}
        >
          <Ionicons name="create-outline" size={16} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={[styles.quickEditText, { color: colors.text }]}>Edit Profile</Text>
        </TouchableOpacity>

        {/* ── SUPER ADMIN ONLY SECTION ── */}
        {isSuperAdmin && (
          <View style={[styles.settingsSection, { backgroundColor: colors.surface, borderColor: '#8B5CF6' }]}>
            <View style={styles.adminSectionHeader}>
              <Ionicons name="shield-checkmark" size={16} color="#8B5CF6" style={{ marginRight: 6 }} />
              <Text style={[styles.sectionTitle, { color: '#8B5CF6', marginBottom: 0 }]}>SUPER ADMIN CONTROLS</Text>
            </View>

            {/* Music Catalog Hub */}
            <TouchableOpacity
              style={styles.settingsRow}
              onPress={() => setActiveSubScreen('MUSIC_CATALOG')}
            >
              <View style={styles.settingsRowLeft}>
                <View style={[styles.adminIconWrap, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                  <Ionicons name="musical-notes" size={20} color="#8B5CF6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.settingsText, { color: colors.text, fontWeight: '800' }]}>Music Catalog</Text>
                  <Text style={[styles.settingsSubtext, { color: colors.textSecondary }]}>
                    Resync, AI Discovery, 1,000+ Bollywood songs, and validation
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8B5CF6" />
            </TouchableOpacity>

            {/* Moderator Management Hub */}
            <TouchableOpacity
              style={styles.settingsRowNoBorder}
              onPress={() => setActiveSubScreen('MODERATOR_MANAGEMENT')}
            >
              <View style={styles.settingsRowLeft}>
                <View style={[styles.adminIconWrap, { backgroundColor: 'rgba(240, 192, 64, 0.15)' }]}>
                  <Ionicons name="people" size={20} color="#F0C040" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.settingsText, { color: colors.text, fontWeight: '800' }]}>Moderator Management</Text>
                  <Text style={[styles.settingsSubtext, { color: colors.textSecondary }]}>
                    Assign moderators, manage chat permissions & timeouts
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#F0C040" />
            </TouchableOpacity>
          </View>
        )}

        {/* Theme Selector */}
        <View style={[styles.settingsSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>APPEARANCE</Text>

          <View style={styles.themeSelectorContainer}>
            <TouchableOpacity
              style={[
                styles.themeOptionBtn,
                {
                  backgroundColor: themeMode === 'dark' ? colors.primary : colors.surfaceLight,
                  borderColor: themeMode === 'dark' ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setThemeMode('dark')}
            >
              <Ionicons name="moon-outline" size={20} color={themeMode === 'dark' ? '#FFFFFF' : colors.textSecondary} />
              <Text style={[styles.themeOptionText, { color: themeMode === 'dark' ? '#FFFFFF' : colors.textSecondary }]}>
                Dark Mode
              </Text>
              {themeMode === 'dark' && <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeOptionBtn,
                {
                  backgroundColor: themeMode === 'light' ? colors.primary : colors.surfaceLight,
                  borderColor: themeMode === 'light' ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setThemeMode('light')}
            >
              <Ionicons name="sunny-outline" size={20} color={themeMode === 'light' ? '#FFFFFF' : colors.textSecondary} />
              <Text style={[styles.themeOptionText, { color: themeMode === 'light' ? '#FFFFFF' : colors.textSecondary }]}>
                Light Mode
              </Text>
              {themeMode === 'light' && <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Functional Settings Options */}
        <View style={[styles.settingsSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>ACCOUNT & SETTINGS</Text>

          {/* Edit Profile */}
          <TouchableOpacity
            style={[styles.settingsRow, { borderBottomColor: colors.border }]}
            onPress={() => setActiveSubScreen('EDIT_PROFILE')}
          >
            <View style={styles.settingsRowLeft}>
              <Ionicons name="person-outline" size={20} color={colors.primary} />
              <Text style={[styles.settingsText, { color: colors.text }]}>Edit Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Notifications */}
          <TouchableOpacity
            style={[styles.settingsRow, { borderBottomColor: colors.border }]}
            onPress={() => setActiveSubScreen('NOTIFICATIONS')}
          >
            <View style={styles.settingsRowLeft}>
              <Ionicons name="notifications-outline" size={20} color={colors.primary} />
              <Text style={[styles.settingsText, { color: colors.text }]}>Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Privacy & Security */}
          <TouchableOpacity
            style={[styles.settingsRow, { borderBottomColor: colors.border }]}
            onPress={() => setActiveSubScreen('PRIVACY_SECURITY')}
          >
            <View style={styles.settingsRowLeft}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
              <Text style={[styles.settingsText, { color: colors.text }]}>Privacy & Security</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Blocked Users Direct Link */}
          <TouchableOpacity
            style={styles.settingsRowNoBorder}
            onPress={() => setActiveSubScreen('BLOCKED_USERS')}
          >
            <View style={styles.settingsRowLeft}>
              <Ionicons name="ban-outline" size={20} color={colors.primary} />
              <Text style={[styles.settingsText, { color: colors.text }]}>Blocked Users</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.countBadge, { backgroundColor: colors.badgeBg, marginRight: 6 }]}>
                <Text style={[styles.countBadgeText, { color: colors.primary }]}>{blockedUsers.length}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Support & Legal */}
        <View style={[styles.settingsSection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>SUPPORT & LEGAL</Text>

          {/* Help Center */}
          <TouchableOpacity
            style={[styles.settingsRow, { borderBottomColor: colors.border }]}
            onPress={() => setActiveSubScreen('HELP_CENTER')}
          >
            <View style={styles.settingsRowLeft}>
              <Ionicons name="help-circle-outline" size={20} color={colors.primary} />
              <Text style={[styles.settingsText, { color: colors.text }]}>Help Center</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Terms & Services */}
          <TouchableOpacity
            style={styles.settingsRowNoBorder}
            onPress={() => setActiveSubScreen('TERMS')}
          >
            <View style={styles.settingsRowLeft}>
              <Ionicons name="document-text-outline" size={20} color={colors.primary} />
              <Text style={[styles.settingsText, { color: colors.text }]}>Terms & Services</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  iconBtn: {
    padding: 6,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  avatarContainer: {
    alignSelf: 'center',
    position: 'relative',
    marginBottom: 12,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullNameText: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  username: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  superAdminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  superAdminBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  moderatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  moderatorBadgeText: {
    color: '#0A0A0A',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  userIdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  userIdBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  bio: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  quickEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 14,
    marginBottom: 8,
  },
  quickEditText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Admin Section
  adminSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  adminIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  // Sections
  settingsSection: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginTop: 14,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  themeSelectorContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  themeOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  themeOptionText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: 1,
  },
  settingsRowNoBorder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
  },
  settingsSubtext: {
    fontSize: 11,
    marginLeft: 12,
    marginTop: 2,
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
