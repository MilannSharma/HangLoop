import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../theme/ThemeContext';
import { BlockedUserInfo } from '../../../App';

interface PrivacySecurityScreenProps {
  blockedUsersCount: number;
  onOpenBlockedUsers: () => void;
  onBack: () => void;
}

const STORAGE_KEY_PRIVACY = '@hangloop_privacy_prefs';

export const PrivacySecurityScreen: React.FC<PrivacySecurityScreenProps> = ({
  blockedUsersCount,
  onOpenBlockedUsers,
  onBack,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [privateProfile, setPrivateProfile] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  useEffect(() => {
    loadPrefs();
  }, []);

  const loadPrefs = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY_PRIVACY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.privateProfile !== undefined) setPrivateProfile(parsed.privateProfile);
        if (parsed.twoFactorEnabled !== undefined) setTwoFactorEnabled(parsed.twoFactorEnabled);
        if (parsed.analyticsEnabled !== undefined) setAnalyticsEnabled(parsed.analyticsEnabled);
      }
    } catch (e) {
      console.warn('Failed loading privacy prefs', e);
    }
  };

  const savePrefs = async (updates: Partial<{ privateProfile: boolean; twoFactorEnabled: boolean; analyticsEnabled: boolean }>) => {
    const nextState = {
      privateProfile,
      twoFactorEnabled,
      analyticsEnabled,
      ...updates,
    };
    try {
      await AsyncStorage.setItem(STORAGE_KEY_PRIVACY, JSON.stringify(nextState));
    } catch (e) {
      console.warn('Failed saving privacy prefs', e);
    }
  };

  const headerPaddingTop = insets.top > 0 ? insets.top + 8 : 12;
  const bottomPadding = insets.bottom > 0 ? insets.bottom + 24 : 32;

  return (
    <View style={[styles.mainWrapper, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: headerPaddingTop, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Privacy & Security</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>ACCOUNT PRIVACY</Text>

        <View style={[styles.settingsGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View style={styles.settingTextGroup}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Private Profile</Text>
              <Text style={[styles.settingSub, { color: colors.textSecondary }]}>Only followers can see your profile history</Text>
            </View>
            <Switch
              value={privateProfile}
              onValueChange={(val) => {
                setPrivateProfile(val);
                savePrefs({ privateProfile: val });
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          {/* Blocked Users Navigation Link */}
          <TouchableOpacity
            style={styles.settingRowNoBorder}
            onPress={onOpenBlockedUsers}
          >
            <View style={styles.settingTextGroup}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>Blocked Users</Text>
                <View style={[styles.badge, { backgroundColor: colors.badgeBg }]}>
                  <Text style={[styles.badgeText, { color: colors.primary }]}>{blockedUsersCount}</Text>
                </View>
              </View>
              <Text style={[styles.settingSub, { color: colors.textSecondary }]}>View and unblock accounts</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textMuted, marginTop: 24 }]}>SECURITY & DATA</Text>

        <View style={[styles.settingsGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View style={styles.settingTextGroup}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Two-Factor OTP Verification</Text>
              <Text style={[styles.settingSub, { color: colors.textSecondary }]}>Require email OTP on new logins</Text>
            </View>
            <Switch
              value={twoFactorEnabled}
              onValueChange={(val) => {
                setTwoFactorEnabled(val);
                savePrefs({ twoFactorEnabled: val });
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          <View style={styles.settingRowNoBorder}>
            <View style={styles.settingTextGroup}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Share Anonymous Diagnostics</Text>
              <Text style={[styles.settingSub, { color: colors.textSecondary }]}>Help improve Hangloop audio sync performance</Text>
            </View>
            <Switch
              value={analyticsEnabled}
              onValueChange={(val) => {
                setAnalyticsEnabled(val);
                savePrefs({ analyticsEnabled: val });
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>
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
  iconBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  settingsGroup: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  settingRowNoBorder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  settingTextGroup: {
    flex: 1,
    paddingRight: 16,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  settingSub: {
    fontSize: 13,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '900',
  },
});
