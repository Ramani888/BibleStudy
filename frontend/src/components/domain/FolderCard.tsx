import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, shadows, spacing } from '../../theme';
import { Typography } from '../ui/Typography';
import type { Folder } from '../../types';

interface FolderCardProps {
  folder: Folder;
  setCount?: number;
  onPress: () => void;
  onLongPress?: () => void;
}

const DEFAULT_COLOR = colors.gray300;

export function FolderCard({ folder, setCount = 0, onPress, onLongPress }: FolderCardProps) {
  const barColor = folder.color ?? DEFAULT_COLOR;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.8 : 1 }]}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <View style={[styles.colorBar, { backgroundColor: barColor }]} />
      <View style={styles.iconWrap}>
        <Typography style={styles.icon}>📁</Typography>
      </View>
      <Typography preset="label" numberOfLines={1} style={styles.name}>
        {folder.name}
      </Typography>
      <Typography preset="caption" color={colors.textSecondary} style={styles.count}>
        {setCount} {setCount === 1 ? 'set' : 'sets'}
      </Typography>
      <Typography style={styles.chevron} color={colors.textDisabled}>›</Typography>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    gap: spacing[3],
    ...shadows.sm,
  },
  colorBar: {
    width: 4,
    alignSelf: 'stretch',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 18 },
  name: { flex: 1 },
  count: { flexShrink: 0 },
  chevron: { fontSize: 18, paddingRight: spacing[3] },
});
