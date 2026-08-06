import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { spacing, useTheme } from '../../../theme';
import { Typography } from '../../../components/ui';
import { ChevronRightIcon, type IconComponent } from '../../../components/icons';

const ICON_SIZE = 22;
const CHEVRON_SIZE = 18;

interface MenuItemProps {
  icon: IconComponent;
  label: string;
  value?: string;
  destructive?: boolean;
  onPress: () => void;
  showChevron?: boolean;
}

export function MenuItem({
  icon: Icon,
  label,
  value,
  destructive = false,
  onPress,
  showChevron = true,
}: MenuItemProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const labelColor = destructive ? colors.error : colors.textPrimary;
  const iconColor = destructive ? colors.error : colors.textSecondary;

  return (
    <Pressable
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}
      onPress={onPress}
    >
      <Icon size={ICON_SIZE} color={iconColor} />
      <Typography preset="label" color={labelColor} style={styles.label}>
        {label}
      </Typography>
      {value ? (
        <Typography preset="caption" color={colors.textSecondary}>
          {value}
        </Typography>
      ) : null}
      {showChevron && (
        <ChevronRightIcon size={CHEVRON_SIZE} color={colors.textDisabled} />
      )}
    </Pressable>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing[4],
      gap: spacing[4],
    },
    label: { flex: 1 },
  });
}
