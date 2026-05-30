import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors, spacing } from '../../theme';
import { Typography } from '../ui/Typography';
import type { Folder } from '../../types';

const FOLDER_ICON_SIZE = 20;
const MENU_ICON_SIZE = 20;

const DEFAULT_COLOR = colors.gray300;

export function FolderCard({ folder, setCount = 0, onPress, onLongPress, onMenuPress }: {
  folder: Folder;
  setCount?: number;
  onPress: () => void;
  onLongPress?: () => void;
  onMenuPress?: () => void;
}) {
  const barColor = folder.color ?? DEFAULT_COLOR;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.8 : 1 }]}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <View style={[styles.colorBar, { backgroundColor: barColor }]} />
      <View style={styles.iconWrap}>
        <Icon name="folder" size={FOLDER_ICON_SIZE} color={colors.textSecondary} />
      </View>
      <Typography preset="label" numberOfLines={1} style={styles.name}>
        {folder.name}
      </Typography>
      <Typography preset="caption" color={colors.textSecondary} style={styles.count}>
        {setCount} {setCount === 1 ? 'set' : 'sets'}
      </Typography>
      {onMenuPress && (
        <Pressable onPress={onMenuPress} hitSlop={8} style={styles.menuBtn}>
          <Icon name="ellipsis-vertical" size={MENU_ICON_SIZE} color={colors.textDisabled} />
        </Pressable>
      )}
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
  name: { flex: 1 },
  count: { flexShrink: 0 },
  menuBtn: {
    paddingHorizontal: spacing[3],
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
