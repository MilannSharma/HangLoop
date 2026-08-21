import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../theme/ThemeContext';

interface NotificationsScreenProps {
  onBack: () => void;
}

const STORAGE_KEY_NOTIFS = '@hangloop_notifications_prefs';

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onBack }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [roomActivityEnabled, setRoomActivityEnabled] = useState(true);
  const [songRequestsEnabled, setSongRequestsEnabled] = useState(true);
  const [soundsEnabled, setSoundsEnabled] = useState(false);

  useEffect(() => {
    loadPrefs();
  }, []);

  const loadPrefs = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY_NOTIFS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.pushEnabled !== undefined) setPushEnabled(parsed.pushEnabled);
        if (parsed.roomActivityEnabled !== undefined) setRoomActivityEnabled(parsed.roomActivityEnabled);
        if (parsed.songRequestsEnabled !== undefined) setSongRequestsEnabled(parsed.songRequestsEnabled);
        if (parsed.soundsEnabled !== undefined) setSoundsEnabled(parsed.soundsEnabled);
      }
    } catch (e) {
      console.warn('Failed loading notification prefs', e);
    }
  };

  const savePrefs = async (updates: Partial<{ pushEnabled: boolean; roomActivityEnabled: boolean; songRequestsEnabled: boolean; soundsEnabled: boolean }>) => {
    const nextState = {
      pushEnabled,
      roomActivityEnabled,
      songRequestsEnabled,
      soundsEnabled,
      ...updates,
    };
    try {
      await AsyncStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(nextState));
    } catch (e) {
      console.warn('Failed saving notification prefs', e);
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Notification Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>PUSH NOTIFICATIONS</Text>

        <View style={[styles.settingsGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View style={styles.settingTextGroup}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Allow Push Notifications</Text>
              <Text style={[styles.settingSub, { color: colors.textSecondary }]}>Receive alerts for live rooms & updates</Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={(val) => {
                setPushEnabled(val);
                savePrefs({ pushEnabled: val });
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View style={styles.settingTextGroup}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Live Room Activity</Text>
              <Text style={[styles.settingSub, { color: colors.textSecondary }]}>Alerts when friends host or join live rooms</Text>
            </View>
            <Switch
              value={roomActivityEnabled}
              onValueChange={(val) => {
                setRoomActivityEnabled(val);
                savePrefs({ roomActivityEnabled: val });
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
            <View style={styles.settingTextGroup}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>Song Request Updates</Text>
              <Text style={[styles.settingSub, { color: colors.textSecondary }]}>Notify when your queued track plays</Text>
            </View>
            <Switch
              value={songRequestsEnabled}
              onValueChange={(val) => {
                setSongRequestsEnabled(val);
                savePrefs({ songRequestsEnabled: val });
              }}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>

          <View style={styles.settingRowNoBorder}>
            <View style={styles.settingTextGroup}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>In-App Sounds & Vibration</Text>
              <Text style={[styles.settingSub, { color: colors.textSecondary }]}>Play sound effects for chat reactions</Text>
            </View>
            <Switch
              value={soundsEnabled}
              onValueChange={(val) => {
                setSoundsEnabled(val);
                savePrefs({ soundsEnabled: val });
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
});
