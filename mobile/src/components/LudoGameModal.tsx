import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';

interface LudoGameModalProps {
  visible: boolean;
  onClose: () => void;
  players: string[];
}

export const LudoGameModal: React.FC<LudoGameModalProps> = ({
  visible,
  onClose,
  players,
}) => {
  const [diceRoll, setDiceRoll] = useState<number | null>(null);
  const [turnIndex, setTurnIndex] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});

  const handleRollDice = () => {
    const rolled = Math.floor(Math.random() * 6) + 1;
    setDiceRoll(rolled);

    const currentPlayer = players[turnIndex] || 'You';
    setScores((prev) => ({
      ...prev,
      [currentPlayer]: (prev[currentPlayer] || 0) + rolled,
    }));

    // Advance turn
    setTurnIndex((prev) => (prev + 1) % Math.max(1, players.length));
  };

  const currentPlayer = players[turnIndex] || 'You';

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={styles.modalBg}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <Text style={styles.title}>🎲 In-Room Mini Game: Ludo Express v1</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Ludo Board Wireframe */}
          <View style={styles.boardContainer}>
            <View style={styles.quadrantRed}>
              <Text style={styles.quadText}>🔴 Red Base</Text>
            </View>
            <View style={styles.quadrantGreen}>
              <Text style={styles.quadText}>🟢 Green Base</Text>
            </View>
            <View style={styles.centerHome}>
              <Text style={styles.homeText}>🏆 HOME</Text>
              {diceRoll && <Text style={styles.diceDisplay}>🎲 {diceRoll}</Text>}
            </View>
            <View style={styles.quadrantBlue}>
              <Text style={styles.quadText}>🔵 Blue Base</Text>
            </View>
            <View style={styles.quadrantYellow}>
              <Text style={styles.quadText}>🟡 Yellow Base</Text>
            </View>
          </View>

          {/* Controls & Scores */}
          <View style={styles.statusRow}>
            <Text style={styles.turnLabel}>
              Turn: <Text style={styles.turnPlayer}>@{currentPlayer}</Text>
            </Text>
          </View>

          <TouchableOpacity style={styles.rollBtn} onPress={handleRollDice}>
            <Text style={styles.rollBtnText}>🎲 Roll Dice & Move Pawn</Text>
          </TouchableOpacity>

          {/* Live Game Scoreboard */}
          <View style={styles.scoreBoard}>
            <Text style={styles.scoreTitle}>Room Leaderboard</Text>
            {players.map((player) => (
              <View key={player} style={styles.scoreRow}>
                <Text style={styles.playerText}>@{player}</Text>
                <Text style={styles.scoreVal}>{scores[player] || 0} pts</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(11, 15, 25, 0.85)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    color: colors.textSecondary,
    fontSize: 18,
  },
  boardContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.border,
  },
  quadrantRed: {
    width: '45%',
    height: '45%',
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  quadrantGreen: {
    width: '45%',
    height: '45%',
    backgroundColor: 'rgba(34, 197, 94, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginLeft: '10%',
  },
  quadrantBlue: {
    width: '45%',
    height: '45%',
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderTopWidth: 1,
    borderColor: colors.border,
    marginTop: '10%',
  },
  quadrantYellow: {
    width: '45%',
    height: '45%',
    backgroundColor: 'rgba(234, 179, 8, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderColor: colors.border,
    marginTop: '10%',
    marginLeft: '10%',
  },
  centerHome: {
    position: 'absolute',
    top: '40%',
    left: '40%',
    width: '20%',
    height: '20%',
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  quadText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
  },
  homeText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  diceDisplay: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  statusRow: {
    marginVertical: 14,
    alignItems: 'center',
  },
  turnLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  turnPlayer: {
    color: colors.primary,
    fontWeight: '800',
  },
  rollBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  rollBtnText: {
    color: '#0B0F19',
    fontWeight: '800',
    fontSize: 14,
  },
  scoreBoard: {
    marginTop: 16,
    backgroundColor: colors.surfaceLight,
    padding: 12,
    borderRadius: 12,
  },
  scoreTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  playerText: {
    color: colors.text,
    fontSize: 13,
  },
  scoreVal: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 13,
  },
});
