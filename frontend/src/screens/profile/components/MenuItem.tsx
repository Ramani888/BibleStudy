import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors, spacing } from '../../../theme';
import { Typography } from '../../../components/ui';

const ICON_SIZE = 20;
const CHEVRON_SIZE = 18;

interface MenuItemProps {
  iconName: string;
  label: string;
  value?: string;
  destructive?: boolean;
  onPress: () => void;
  showChevron?: boolean;
}

export function MenuItem({
  iconName,
  label,
  value,
  destructive = false,
  onPress,
  showChevron = true,
}: MenuItemProps) {
  const labelColor = destructive ? colors.error : colors.textPrimary;
  const iconColor = destructive ? colors.error : colors.textSecondary;

  return (
    <Pressable
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}
      onPress={onPress}
    >
      <View style={[styles.iconWrap, destructive && styles.iconWrapDestructive]}>
        <Icon name={iconName} size={ICON_SIZE} color={iconColor} />
      </View>
      <Typography preset="body" color={labelColor} style={styles.label}>
        {label}
      </Typography>
      {value ? (
        <Typography preset="bodySm" color={colors.textSecondary}>
          {value}
        </Typography>
      ) : null}
      {showChevron && (
        <Icon name="chevron-forward" size={CHEVRON_SIZE} color={colors.textDisabled} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    gap: spacing[3],
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapDestructive: {
    backgroundColor: colors.errorSurface,
  },
  label: { flex: 1 },
});
