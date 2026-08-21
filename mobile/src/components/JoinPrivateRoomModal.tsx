import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { RoomData } from '../services/api';

interface JoinPrivateRoomModalProps {
  visible: boolean;
  onClose: () => void;
  onJoinRoom: (room: RoomData) => void;
}

export const JoinPrivateRoomModal: React.FC<JoinPrivateRoomModalProps> = ({
  visible,
  onClose,
  onJoinRoom,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [pinCode, setPinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleJoin = () => {
    setErrorMsg('');
    if (pinCode.length !== 6 || !/^\d{6}$/.test(pinCode)) {
      setErrorMsg('Please enter a valid 6-digit numeric PIN code.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const targetRoom: RoomData = {
        id: pinCode,
        name: `Private Room ${pinCode}`,
        category: 'Private Chat',
        is_private: 1,
        room_type: 'PRIVATE_CHAT',
        music_enabled: 0,
        max_members: 50,
        created_by: 'Host',
      };
      setPinCode('');
      onClose();
      onJoinRoom(targetRoom);
    }, 400);
  };

  const bottomPadding = insets.bottom > 0 ? insets.bottom + 16 : 24;

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={styles.modalBg}>
        <View style={[
          styles.modalContainer, 
          { 
            backgroundColor: colors.surface, 
            borderColor: colors.border,
            paddingBottom: bottomPadding 
          }
        ]}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Join Private Room</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Enter the 6-digit numeric PIN code provided by the room host.
            </Text>

            {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

            <TextInput
              style={[
                styles.pinInput,
                {
                  backgroundColor: colors.inputBg,
                  color: colors.primary,
                  borderColor: colors.border,
                }
              ]}
              placeholder="000000"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              maxLength={6}
              value={pinCode}
              onChangeText={(text) => {
                setErrorMsg('');
                setPinCode(text.replace(/[^0-9]/g, ''));
              }}
            />

            <TouchableOpacity
              style={[
                styles.submitBtn,
                { backgroundColor: pinCode.length === 6 ? colors.buttonPrimaryBg : colors.surfaceLight }
              ]}
              onPress={handleJoin}
              disabled={pinCode.length !== 6 || loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={[
                    styles.submitBtnText,
                    { color: pinCode.length === 6 ? colors.buttonPrimaryText : colors.textMuted }
                  ]}>
                    Join Private Room
                  </Text>
                  <Ionicons 
                    name="arrow-forward" 
                    size={20} 
                    color={pinCode.length === 6 ? colors.buttonPrimaryText : colors.textMuted} 
                  />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    gap: 16,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
  },
  pinInput: {
    borderWidth: 2,
    borderRadius: 16,
    fontSize: 36,
    fontWeight: '900',
    textAlign: 'center',
    paddingVertical: 16,
    letterSpacing: 8,
  },
  submitBtn: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '800',
  },
});
