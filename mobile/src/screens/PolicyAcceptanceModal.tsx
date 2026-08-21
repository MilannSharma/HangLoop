import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

interface PolicyAcceptanceModalProps {
  visible: boolean;
  onAccept: () => void;
}

export const PolicyAcceptanceModal: React.FC<PolicyAcceptanceModalProps> = ({
  visible,
  onAccept,
}) => {
  const { colors } = useTheme();
  const [tab, setTab] = useState<'RULES' | 'TERMS' | 'PRIVACY'>('RULES');

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Ionicons name="shield-checkmark" size={22} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.headerTitle, { color: colors.text }]}>Platform Rules & Legal Terms</Text>
          </View>

          {/* Sub Navigation Tabs */}
          <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.tabBtn, tab === 'RULES' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => setTab('RULES')}
            >
              <Text style={[styles.tabText, { color: tab === 'RULES' ? colors.primary : colors.textMuted }]}>
                Community Rules
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, tab === 'TERMS' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => setTab('TERMS')}
            >
              <Text style={[styles.tabText, { color: tab === 'TERMS' ? colors.primary : colors.textMuted }]}>
                Terms & Conditions
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, tab === 'PRIVACY' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => setTab('PRIVACY')}
            >
              <Text style={[styles.tabText, { color: tab === 'PRIVACY' ? colors.primary : colors.textMuted }]}>
                Privacy Policy
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content Scroll View */}
          <ScrollView style={styles.scrollArea} contentContainerStyle={{ padding: 16 }}>
            {tab === 'RULES' && (
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Hangloop Community Behaviour Rules</Text>
                
                <Text style={[styles.bulletHeader, { color: colors.primary }]}>1. Respectful Behaviour</Text>
                <Text style={[styles.bulletBody, { color: colors.textSecondary }]}>
                  Treat all room members with dignity. Zero tolerance for harassment, hate speech, threats, or abusive language in live chat.
                </Text>

                <Text style={[styles.bulletHeader, { color: colors.primary }]}>2. Live Room Theme Restrictions</Text>
                <Text style={[styles.bulletBody, { color: colors.textSecondary }]}>
                  Only add YouTube songs matching the specific theme of the live room (e.g. Bollywood, Hollywood, Punjabi). Off-theme submissions will be automatically rejected.
                </Text>

                <Text style={[styles.bulletHeader, { color: colors.primary }]}>3. Chat Integrity & No Spamming</Text>
                <Text style={[styles.bulletBody, { color: colors.textSecondary }]}>
                  Do not flood the chat with repeated messages, promotional links, or malicious content.
                </Text>

                <Text style={[styles.bulletHeader, { color: colors.primary }]}>4. Moderation & Blocking</Text>
                <Text style={[styles.bulletBody, { color: colors.textSecondary }]}>
                  Users can report or block abusive participants at any time. Accounts violating rules may be permanently suspended.
                </Text>
              </View>
            )}

            {tab === 'TERMS' && (
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Terms & Conditions of Service</Text>
                
                <Text style={[styles.bulletHeader, { color: colors.primary }]}>1. Account Responsibility</Text>
                <Text style={[styles.bulletBody, { color: colors.textSecondary }]}>
                  You are responsible for maintaining the confidentiality of your account credentials and for all activities occurring under your account.
                </Text>

                <Text style={[styles.bulletHeader, { color: colors.primary }]}>2. Third-Party Music Content</Text>
                <Text style={[styles.bulletBody, { color: colors.textSecondary }]}>
                  Music and video streams are rendered via official YouTube IFrame Player APIs. Hangloop does not host copyrighted media files.
                </Text>

                <Text style={[styles.bulletHeader, { color: colors.primary }]}>3. Service Availability</Text>
                <Text style={[styles.bulletBody, { color: colors.textSecondary }]}>
                  We reserve the right to update, modify, or suspend live rooms or features to ensure infrastructure performance and compliance.
                </Text>
              </View>
            )}

            {tab === 'PRIVACY' && (
              <View>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Privacy & Data Protection Policy</Text>
                
                <Text style={[styles.bulletHeader, { color: colors.primary }]}>1. Information Collected</Text>
                <Text style={[styles.bulletBody, { color: colors.textSecondary }]}>
                  We collect your Full Name, Username, Email address, immutable User ID, and live chat presence to enable room synchronization.
                </Text>

                <Text style={[styles.bulletHeader, { color: colors.primary }]}>2. Data Storage & Security</Text>
                <Text style={[styles.bulletBody, { color: colors.textSecondary }]}>
                  Data is securely stored in Cloudflare D1 encrypted databases. Email OTP codes are stored as SHA-256 cryptographic hashes with short 10-minute expiry.
                </Text>

                <Text style={[styles.bulletHeader, { color: colors.primary }]}>3. Chat History Retention</Text>
                <Text style={[styles.bulletBody, { color: colors.textSecondary }]}>
                  Live chat history is capped at a maximum of 20 historical messages per room, and old chat logs are automatically purged after 2 hours.
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Explicit Accept Button */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <TouchableOpacity style={[styles.acceptBtn, { backgroundColor: colors.primary }]} onPress={onAccept}>
              <Text style={styles.acceptBtnText}>I Explicitly Agree & Accept All Terms →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    height: '80%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  scrollArea: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 16,
  },
  bulletHeader: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 4,
  },
  bulletBody: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  acceptBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
