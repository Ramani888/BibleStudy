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

export function FolderCard({ folder, setCount = 0, onPress, onLongPress }: FolderCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.8 : 1 }]}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <View style={styles.iconWrap}>
        <Typography style={styles.icon}>📁</Typography>
      </View>
      <Typography preset="label" numberOfLines={1} style={styles.name}>
        {folder.name}
      </Typography>
      <Typography preset="caption" color={colors.textSecondary}>
        {setCount} {setCount === 1 ? 'set' : 'sets'}
      </Typography>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 110,
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: spacing[3],
    alignItems: 'center',
    gap: spacing[1.5],
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.warningSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 22 },
  name: { textAlign: 'center', width: '100%' },
});
