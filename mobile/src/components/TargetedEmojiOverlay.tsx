import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Modal, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';

interface TargetedEmojiOverlayProps {
  activeEmoji: {
    senderUsername: string;
    emoji: string;
  } | null;
  onDismiss: () => void;
}

export const TargetedEmojiOverlay: React.FC<TargetedEmojiOverlayProps> = ({
  activeEmoji,
  onDismiss,
}) => {
  const [scaleAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (activeEmoji) {
      // Trigger full-screen pop & pulse animation
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss after 3.5 seconds
      const timer = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => {
          scaleAnim.setValue(0);
          onDismiss();
        });
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [activeEmoji]);

  if (!activeEmoji) return null;

  return (
    <Modal transparent animationType="none" visible={!!activeEmoji}>
      <TouchableOpacity activeOpacity={1} style={styles.overlayBg} onPress={onDismiss}>
        <Animated.View
          style={[
            styles.popupCard,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.glowRing} />
          <Text style={styles.emojiText}>{activeEmoji.emoji}</Text>
          <Text style={styles.senderNotice}>
            <Text style={styles.senderHighlight}>@{activeEmoji.senderUsername}</Text> sent you a reaction!
          </Text>
          <Text style={styles.tapToClose}>Tap anywhere to dismiss</Text>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayBg: {
    flex: 1,
    backgroundColor: 'rgba(11, 15, 25, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  popupCard: {
    backgroundColor: '#1E2942',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 20,
  },
  glowRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
  },
  emojiText: {
    fontSize: 96,
    marginBottom: 16,
  },
  senderNotice: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  senderHighlight: {
    color: colors.primary,
  },
  tapToClose: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 16,
  },
});
