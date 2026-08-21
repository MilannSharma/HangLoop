import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';

export interface ReportUserModalProps {
  visible: boolean;
  user: { id: string; username: string; avatar_url: string } | null;
  onClose: () => void;
  onReportSubmitted: (reason: string, details: string) => void;
}

export const ReportUserModal: React.FC<ReportUserModalProps> = ({
  visible,
  user,
  onClose,
  onReportSubmitted,
}) => {
  const { colors } = useTheme();

  const [selectedReason, setSelectedReason] = useState<string>('Spam');
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) return null;

  const reportReasons = [
    { id: 'Spam', label: 'Spam or Bot activity', icon: 'chatbox-ellipses-outline' },
    { id: 'Harassment', label: 'Harassment or Bullying', icon: 'hand-stop-outline' },
    { id: 'Inappropriate Content', label: 'Inappropriate content/links', icon: 'warning-outline' },
    { id: 'Abusive Behaviour', label: 'Abusive or Hate speech', icon: 'shield-outline' },
    { id: 'Other', label: 'Other issue', icon: 'ellipsis-horizontal-circle-outline' },
  ];

  const handleSubmitReport = () => {
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      onReportSubmitted(selectedReason, additionalDetails.trim());
      setAdditionalDetails('');
      Alert.alert(
        'Report Submitted',
        `Thank you. Your report regarding @${user.username} has been submitted for moderation.`
      );
      onClose();
    }, 400);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.dismissOverlay} onPress={onClose} activeOpacity={1} />

        <View style={[styles.modalSheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="flag-outline" size={20} color="#F59E0B" style={{ marginRight: 8 }} />
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Report User</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.reportSub, { color: colors.textSecondary }]}>
            Why are you reporting <Text style={{ color: colors.text, fontWeight: '800' }}>@{user.username}</Text>?
          </Text>

          <ScrollView style={styles.reasonsList} contentContainerStyle={{ gap: 10 }}>
            {reportReasons.map((reason) => {
              const isSelected = selectedReason === reason.id;
              return (
                <TouchableOpacity
                  key={reason.id}
                  style={[
                    styles.reasonOption,
                    {
                      backgroundColor: isSelected ? colors.badgeBg : colors.cardBg,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedReason(reason.id)}
                >
                  <Ionicons
                    name={reason.icon as any}
                    size={20}
                    color={isSelected ? colors.primary : colors.textSecondary}
                    style={{ marginRight: 12 }}
                  />
                  <Text
                    style={[
                      styles.reasonText,
                      { color: isSelected ? colors.primary : colors.text, fontWeight: isSelected ? '800' : '600' },
                    ]}
                  >
                    {reason.label}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} style={{ marginLeft: 'auto' }} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Optional Details Input */}
          <View style={styles.detailsSection}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Additional details (optional)</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text }]}
              placeholder="Describe what happened..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              value={additionalDetails}
              onChangeText={setAdditionalDetails}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: '#F59E0B' }, isSubmitting && { opacity: 0.7 }]}
            onPress={handleSubmitReport}
            disabled={isSubmitting}
          >
            <Text style={styles.submitBtnText}>{isSubmitting ? 'Submitting...' : 'Submit Report'}</Text>
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
    justifyContent: 'flex-end',
  },
  dismissOverlay: {
    flex: 1,
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderTopWidth: 1,
    maxHeight: '85%',
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
  reportSub: {
    fontSize: 14,
    marginTop: 12,
    marginBottom: 16,
  },
  reasonsList: {
    maxHeight: 240,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  reasonText: {
    fontSize: 14,
  },
  detailsSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  textInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 70,
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
