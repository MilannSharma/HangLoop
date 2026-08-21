import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

interface TermsScreenProps {
  onBack: () => void;
}

export const TermsScreen: React.FC<TermsScreenProps> = ({ onBack }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const headerPaddingTop = insets.top > 0 ? insets.top + 8 : 12;
  const bottomPadding = insets.bottom > 0 ? insets.bottom + 24 : 32;

  return (
    <View style={[styles.mainWrapper, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: headerPaddingTop, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Terms & Services</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}>
        <Text style={[styles.title, { color: colors.text }]}>Hangloop Terms of Service</Text>
        <Text style={[styles.dateText, { color: colors.textMuted }]}>Last updated: August 18, 2026</Text>

        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          Welcome to Hangloop! By accessing or using our synchronized live music room platform, mobile application, or web services, you agree to be bound by these Terms of Service.
        </Text>

        <Text style={[styles.heading, { color: colors.text }]}>1. Community Guidelines & Conduct</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          Hangloop is built for music lovers to enjoy synchronized music and positive social interactions. Hate speech, harassment, spam, abusive language, or inappropriate content are strictly prohibited. Room hosts and moderators reserve the right to kick or block rule-breaking accounts.
        </Text>

        <Text style={[styles.heading, { color: colors.text }]}>2. Music Sync & Third-Party Embeds</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          Playback in Hangloop live rooms utilizes YouTube embeds and official music stream APIs. Users must comply with YouTube's Terms of Service. Hangloop does not host copyrighted media files directly.
        </Text>

        <Text style={[styles.heading, { color: colors.text }]}>3. Account Safety & Blocking</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          You are responsible for maintaining the security of your account. Users may block unwanted contacts at any time from chat profile popups or manage their Blocked Users list inside Settings.
        </Text>

        <Text style={[styles.heading, { color: colors.text }]}>4. Privacy Policy</Text>
        <Text style={[styles.paragraph, { color: colors.textSecondary }]}>
          We respect your privacy. Basic account information (username, avatar, email) is stored securely. We do not sell your personal information to third parties.
        </Text>

        <View style={[styles.footerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="document-text-outline" size={24} color={colors.primary} style={{ marginBottom: 6 }} />
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            If you have questions regarding our Terms, please email support@hangloop.com.
          </Text>
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
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    marginBottom: 16,
  },
  heading: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 18,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
  },
  footerCard: {
    marginTop: 24,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    textAlign: 'center',
  },
});
