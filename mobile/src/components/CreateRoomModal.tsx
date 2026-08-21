import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';

interface CreateRoomModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (roomConfig: {
    name: string;
    category: string;
    is_private: boolean;
    durationMinutes?: number;
  }) => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  visible,
  onClose,
  onCreate,
}) => {
  const [roomName, setRoomName] = useState('');
  const [category, setCategory] = useState('Bollywood');
  const [isPrivate, setIsPrivate] = useState(true);
  const [duration, setDuration] = useState<10 | 60>(10); // 10 min or 1 hr

  const handleCreate = () => {
    if (!roomName.trim()) return;
    onCreate({
      name: roomName.trim(),
      category,
      is_private: isPrivate,
      durationMinutes: isPrivate ? duration : undefined,
    });
    setRoomName('');
    onClose();
  };

  const categories = ['Bollywood', 'Punjabi', 'Lofi & Chill', 'Gaming', 'Pop & EDM'];

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={styles.modalBg}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Create New Room</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Room Name Input */}
          <Text style={styles.label}>Room Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Late Night Retro Jam 🌙"
            placeholderTextColor={colors.textMuted}
            value={roomName}
            onChangeText={setRoomName}
          />

          {/* Category Chips */}
          <Text style={styles.label}>Genre / Category</Text>
          <View style={styles.chipRow}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, category === cat && styles.chipActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Room Type: Public vs Private Timed Room */}
          <Text style={styles.label}>Room Type</Text>
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeBtn, isPrivate && styles.typeBtnActive]}
              onPress={() => setIsPrivate(true)}
            >
              <Text style={[styles.typeBtnText, isPrivate && styles.typeBtnTextActive]}>
                🔒 Private Timed Room
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, !isPrivate && styles.typeBtnActive]}
              onPress={() => setIsPrivate(false)}
            >
              <Text style={[styles.typeBtnText, !isPrivate && styles.typeBtnTextActive]}>
                🌐 Public Persistent Room
              </Text>
            </TouchableOpacity>
          </View>

          {/* Duration Selector for Private Rooms (PRD 4.6: 10 min / 1 hr) */}
          {isPrivate && (
            <View style={styles.durationSection}>
              <Text style={styles.label}>Auto-Expire Lifespan</Text>
              <View style={styles.durationRow}>
                <TouchableOpacity
                  style={[styles.durationChip, duration === 10 && styles.durationChipActive]}
                  onPress={() => setDuration(10)}
                >
                  <Text style={[styles.durationText, duration === 10 && styles.durationTextActive]}>
                    ⏳ 10 Minutes
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.durationChip, duration === 60 && styles.durationChipActive]}
                  onPress={() => setDuration(60)}
                >
                  <Text style={[styles.durationText, duration === 60 && styles.durationTextActive]}>
                    ⏰ 1 Hour
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.helperText}>
                Private rooms and chat history auto-delete completely on expiry.
              </Text>
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity style={styles.submitBtn} onPress={handleCreate}>
            <Text style={styles.submitBtnText}>Create Room & Enter 🚀</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(11, 15, 25, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    color: colors.textSecondary,
    fontSize: 18,
    fontWeight: '700',
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#0B0F19',
    fontWeight: '800',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeBtn: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  typeBtnActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
  },
  typeBtnText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  typeBtnTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  durationSection: {
    marginTop: 12,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 10,
  },
  durationChip: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  durationChipActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(255, 42, 122, 0.12)',
  },
  durationText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  durationTextActive: {
    color: colors.accent,
    fontWeight: '800',
  },
  helperText: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 6,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  submitBtnText: {
    color: '#0B0F19',
    fontSize: 15,
    fontWeight: '800',
  },
});
