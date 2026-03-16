import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '../../theme';
import { Typography } from '../ui/Typography';
import type { Difficulty } from '../../types';

const MAP: Record<Difficulty, { label: string; bg: string; text: string }> = {
  EASY: { label: 'Easy', bg: colors.successSurface, text: colors.success },
  MEDIUM: { label: 'Medium', bg: colors.warningSurface, text: colors.warning },
  HARD: { label: 'Hard', bg: colors.errorSurface, text: colors.error },
};

interface DifficultyBadgeProps {
  difficulty: Difficulty;
}

export function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  const { label, bg, text } = MAP[difficulty];
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Typography preset="caption" color={text} style={styles.text}>
        {label}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 999,
    paddingHorizontal: spacing[2.5],
    paddingVertical: spacing[0.5],
    alignSelf: 'flex-start',
  },
  text: { fontWeight: '600' },
});
