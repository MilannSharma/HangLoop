import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

interface HelpCenterScreenProps {
  onBack: () => void;
}

export const HelpCenterScreen: React.FC<HelpCenterScreenProps> = ({ onBack }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [expandedIdx, setExpandedIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How do Live Music Rooms work on Hangloop?',
      a: 'Live Rooms allow hosts to stream synchronized YouTube music or live videos to all room members while chatting in real time.',
    },
    {
      q: 'How can I queue a song in a Live Room?',
      a: 'Tap the "Queue Song" action button below the video player in any public room, then paste a YouTube link or search for a track title.',
    },
    {
      q: 'What is Listen Only mode?',
      a: 'Tap the "Listen Only" pill on the player overlay to hide the video stream and use a compact mini player bar while keeping continuous audio playback.',
    },
    {
      q: 'How do I block or report an abusive chat user?',
      a: 'Tap the user’s avatar or username in the live chat feed to open their profile sheet. Select "Block User" or "Report User".',
    },
    {
      q: 'How do I unblock a user?',
      a: 'Go to Profile -> Privacy & Security -> Blocked Users, then tap "Unblock" next to their name.',
    },
  ];

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Our team is online 24/7. Send your feedback or issue to support@hangloop.com',
      [{ text: 'OK' }]
    );
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
        <Text style={[styles.headerTitle, { color: colors.text }]}>Help Center</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>FREQUENTLY ASKED QUESTIONS</Text>

        <View style={styles.faqList}>
          {faqs.map((faq, idx) => {
            const isExpanded = expandedIdx === idx;
            return (
              <View
                key={idx}
                style={[styles.faqCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <TouchableOpacity
                  style={styles.faqHeader}
                  onPress={() => setExpandedIdx(isExpanded ? null : idx)}
                >
                  <Text style={[styles.faqQuestion, { color: colors.text }]}>{faq.q}</Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={[styles.faqBody, { borderTopColor: colors.border }]}>
                    <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{faq.a}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Support Section */}
        <View style={[styles.supportBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="headset-outline" size={32} color={colors.primary} style={{ marginBottom: 8 }} />
          <Text style={[styles.supportTitle, { color: colors.text }]}>Still need help?</Text>
          <Text style={[styles.supportSub, { color: colors.textSecondary }]}>
            Our community support team is available 24/7.
          </Text>
          <TouchableOpacity
            style={[styles.contactBtn, { backgroundColor: colors.primary }]}
            onPress={handleContactSupport}
          >
            <Text style={styles.contactBtnText}>Contact Support</Text>
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
  iconBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  faqList: {
    gap: 12,
    marginBottom: 24,
  },
  faqCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    paddingRight: 12,
  },
  faqBody: {
    padding: 16,
    borderTopWidth: 1,
  },
  faqAnswer: {
    fontSize: 13,
    lineHeight: 20,
  },
  supportBox: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  supportTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  supportSub: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  contactBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  contactBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
