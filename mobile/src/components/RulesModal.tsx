import React from 'react';
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

interface RulesModalProps {
  visible: boolean;
  onClose: () => void;
  roomName: string;
}

export const RulesModal: React.FC<RulesModalProps> = ({ visible, onClose, roomName }) => {
  const { colors } = useTheme();

  const rulesList = [
    {
      icon: 'heart-outline',
      title: 'Be Respectful & Kind',
      desc: 'Treat host and community members with courtesy. No hate speech or harassment.',
    },
    {
      icon: 'musical-notes-outline',
      title: 'Vibe & Music Etiquette',
      desc: 'Avoid spamming song requests. Keep queue submissions relevant to room vibe.',
    },
    {
      icon: 'chatbubbles-outline',
      title: 'Clean Chat',
      desc: 'No aggressive self-promotion, spam, or malicious links in chat.',
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'Host & Mod Guidance',
      desc: 'Follow host instructions. Hosts reserve the right to kick or block rule breakers.',
    },
  ];

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.dismissOverlay} onPress={onClose} activeOpacity={1} />

        <View style={[styles.modalSheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="book-outline" size={22} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Room Rules</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.roomSub, { color: colors.textSecondary }]}>
            Guidelines for <Text style={{ color: colors.primary, fontWeight: '800' }}>{roomName}</Text>
          </Text>

          <ScrollView style={styles.rulesScroll} contentContainerStyle={{ gap: 14 }}>
            {rulesList.map((item, idx) => (
              <View
                key={idx}
                style={[styles.ruleCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
              >
                <View style={[styles.iconCircle, { backgroundColor: colors.badgeBg }]}>
                  <Ionicons name={item.icon as any} size={20} color={colors.primary} />
                </View>
                <View style={styles.ruleContent}>
                  <Text style={[styles.ruleTitle, { color: colors.text }]}>
                    {idx + 1}. {item.title}
                  </Text>
                  <Text style={[styles.ruleDesc, { color: colors.textSecondary }]}>{item.desc}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={[styles.agreeBtn, { backgroundColor: colors.primary }]}
            onPress={onClose}
          >
            <Text style={styles.agreeBtnText}>Got it, I agree</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  dismissOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  modalSheet: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    maxHeight: '80%',
    zIndex: 10,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  roomSub: {
    fontSize: 13,
    marginTop: 10,
    marginBottom: 16,
  },
  rulesScroll: {
    maxHeight: 320,
  },
  ruleCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  ruleContent: {
    flex: 1,
  },
  ruleTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  ruleDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  agreeBtn: {
    marginTop: 18,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agreeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
