import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { RoomData } from '../services/api';

interface RoomInfoModalProps {
  visible: boolean;
  onClose: () => void;
  room: RoomData;
  activeViewersCount: number;
}

export const RoomInfoModal: React.FC<RoomInfoModalProps> = ({
  visible,
  onClose,
  room,
  activeViewersCount,
}) => {
  const { colors } = useTheme();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.dismissOverlay} onPress={onClose} activeOpacity={1} />

        <View style={[styles.modalSheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="information-circle-outline" size={22} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Room Info</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Banner & Title */}
          <View style={styles.infoHead}>
            <Image
              source={{ uri: room.thumbnail_url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80' }}
              style={styles.roomCover}
            />
            <View style={styles.headTextGroup}>
              <Text style={[styles.roomTitle, { color: colors.text }]}>{room.name}</Text>
              <View style={styles.genreBadge}>
                <Ionicons name="radio" size={12} color={colors.primary} style={{ marginRight: 4 }} />
                <Text style={[styles.genreText, { color: colors.primary }]}>{room.category || 'Music'}</Text>
              </View>
              {room.tags && room.tags.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                  {room.tags.map((t) => (
                    <View key={t} style={{ backgroundColor: 'rgba(99,102,241,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                      <Text style={{ color: colors.primary, fontSize: 10.5, fontWeight: '700' }}>#{t}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Details Table */}
          <View style={[styles.detailsGrid, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={styles.gridRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Host</Text>
              <Text style={[styles.value, { color: colors.text }]}>@{room.created_by}</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.gridRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Active Listeners</Text>
              <View style={styles.valueRow}>
                <View style={styles.liveDot} />
                <Text style={[styles.value, { color: colors.text }]}>{activeViewersCount} tuning in</Text>
              </View>
            </View>
            <View style={styles.divider} />

            <View style={styles.gridRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Room Type</Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {room.is_private ? 'Private Room (PIN Protected)' : 'Public Live Room'}
              </Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.gridRow}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Audio Sync Quality</Text>
              <Text style={[styles.value, { color: '#10B981', fontWeight: '800' }]}>Ultra Low-Latency (320kbps)</Text>
            </View>
          </View>

          <TouchableOpacity style={[styles.closeModalBtn, { backgroundColor: colors.primary }]} onPress={onClose}>
            <Text style={styles.closeModalBtnText}>Close</Text>
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
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    marginBottom: 16,
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
  infoHead: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  roomCover: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginRight: 14,
  },
  headTextGroup: {
    flex: 1,
  },
  roomTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  genreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  genreText: {
    fontSize: 13,
    fontWeight: '700',
  },
  detailsGrid: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 13,
  },
  value: {
    fontSize: 13,
    fontWeight: '700',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
    marginRight: 6,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  closeModalBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  closeModalBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
