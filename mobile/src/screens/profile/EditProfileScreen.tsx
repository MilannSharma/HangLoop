import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';
import { api, UserProfile } from '../../services/api';

interface EditProfileScreenProps {
  user: UserProfile;
  onSaveUser: (updatedUser: UserProfile) => void;
  onBack: () => void;
}

export const EditProfileScreen: React.FC<EditProfileScreenProps> = ({
  user,
  onSaveUser,
  onBack,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [displayName, setDisplayName] = useState(user.full_name || user.username || '');
  const [username] = useState(user.username || '');
  const [email] = useState(user.email || '');
  const [bio, setBio] = useState(user.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(
    user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80'
  );
  const [isSaving, setIsSaving] = useState(false);

  const headerPaddingTop = insets.top > 0 ? insets.top + 8 : 12;
  const bottomPadding = insets.bottom > 0 ? insets.bottom + 24 : 32;

  const handleSave = async () => {
    const trimmedDisplayName = displayName.trim().slice(0, 15);
    if (!trimmedDisplayName) {
      Alert.alert('Validation Error', 'Display Name cannot be empty.');
      return;
    }

    setIsSaving(true);

    try {
      const res = await api.updateProfile(trimmedDisplayName, bio.trim(), avatarUrl);
      if (res.success && res.user) {
        onSaveUser(res.user);
        Alert.alert('Success 🎉', 'Your profile and display name have been updated!');
        onBack();
      } else {
        // Fallback local update
        const updatedLocal: UserProfile = {
          ...user,
          full_name: trimmedDisplayName,
          bio: bio.trim(),
          avatar_url: avatarUrl,
        };
        onSaveUser(updatedLocal);
        Alert.alert('Updated', 'Profile saved.');
        onBack();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save profile changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const sampleAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
  ];

  const charCount = displayName.length;

  return (
    <View style={[styles.mainWrapper, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: headerPaddingTop, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={isSaving} style={styles.saveHeaderBtn}>
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={[styles.saveHeaderBtnText, { color: colors.primary }]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}>
        {/* Avatar Selection */}
        <View style={styles.avatarSection}>
          <Image source={{ uri: avatarUrl }} style={[styles.avatarImage, { borderColor: colors.primary }]} />
          <Text style={[styles.avatarHint, { color: colors.textSecondary }]}>Select Profile Avatar</Text>

          <View style={styles.avatarPickerRow}>
            {sampleAvatars.map((url, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setAvatarUrl(url)}
                style={[
                  styles.avatarChoice,
                  { borderColor: avatarUrl === url ? colors.primary : 'transparent' },
                ]}
              >
                <Image source={{ uri: url }} style={styles.avatarChoiceImg} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Display Name (Full Name) Customization */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Display Name (Shown in Live Chat)</Text>
            <Text style={[styles.counter, { color: charCount >= 15 ? colors.liveRed : colors.primary }]}>
              {charCount}/15
            </Text>
          </View>
          <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: charCount >= 15 ? colors.liveRed : colors.border }]}>
            <Ionicons name="person-outline" size={18} color={colors.primary} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={displayName}
              onChangeText={(text) => setDisplayName(text.slice(0, 15))}
              placeholder="e.g. Milan ⚡️, 👑 DJ Star"
              placeholderTextColor={colors.textMuted}
              maxLength={15}
            />
          </View>
          <Text style={[styles.helperText, { color: colors.textMuted }]}>
            Supports emojis, special characters, and fancy fonts (max 15 characters).
          </Text>
        </View>

        {/* Username (Immutable System Identifier) */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Account Username</Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border, opacity: 0.8 }]}>
            <Text style={[styles.prefix, { color: colors.textMuted }]}>@</Text>
            <TextInput
              style={[styles.input, { color: colors.textMuted }]}
              value={username}
              editable={false}
              placeholder="Username"
              placeholderTextColor={colors.textMuted}
            />
            <Ionicons name="lock-closed-outline" size={16} color={colors.textMuted} />
          </View>
        </View>

        {/* Email Address */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Email Address</Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.surface, borderColor: colors.border, opacity: 0.8 }]}>
            <Ionicons name="mail-outline" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              style={[styles.input, { color: colors.textMuted }]}
              value={email}
              editable={false}
              placeholder="Email address"
              placeholderTextColor={colors.textMuted}
            />
            <Ionicons name="lock-closed-outline" size={16} color={colors.textMuted} />
          </View>
        </View>

        {/* Bio */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Bio</Text>
          <View style={[styles.inputWrapper, styles.bioWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              style={[styles.input, styles.bioInput, { color: colors.text }]}
              value={bio}
              onChangeText={setBio}
              placeholder="Write a short bio..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveBtnText}>Save Profile Changes</Text>
          )}
        </TouchableOpacity>
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
  saveHeaderBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  saveHeaderBtnText: {
    fontSize: 16,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    marginBottom: 12,
  },
  avatarHint: {
    fontSize: 13,
    marginBottom: 12,
  },
  avatarPickerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  avatarChoice: {
    padding: 2,
    borderRadius: 24,
    borderWidth: 2,
  },
  avatarChoiceImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  formGroup: {
    marginBottom: 18,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  counter: {
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  helperText: {
    fontSize: 11,
    marginTop: 4,
    paddingHorizontal: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  prefix: {
    fontSize: 16,
    fontWeight: '800',
    marginRight: 4,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
  },
  bioWrapper: {
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  bioInput: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  saveBtn: {
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
