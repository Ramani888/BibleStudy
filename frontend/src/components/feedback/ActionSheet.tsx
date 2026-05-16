import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { AppModal } from './Modal';
import { Divider, Typography } from '../ui';
import { colors, spacing } from '../../theme';

const ACTION_ICON_SIZE = 20;

export interface Action {
  label: string;
  iconName?: string;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

interface ActionSheetProps {
  visible: boolean;
  title?: string;
  actions: Action[];
  onClose: () => void;
}

export function ActionSheet({ visible, title, actions, onClose }: ActionSheetProps) {
  return (
    <AppModal visible={visible} title={title} onClose={onClose} animationType="slide">
      <View style={styles.list}>
        {actions.map((action, i) => (
          <React.Fragment key={action.label}>
            {i > 0 && <Divider marginV={0} />}
            <Pressable
              style={({ pressed }) => [styles.item, { opacity: pressed || action.disabled ? 0.5 : 1 }]}
              onPress={() => {
                onClose();
                action.onPress();
              }}
              disabled={action.disabled}
            >
              <View style={styles.actionRow}>
                {action.iconName && (
                  <Icon
                    name={action.iconName}
                    size={ACTION_ICON_SIZE}
                    color={action.destructive ? colors.error : colors.textSecondary}
                  />
                )}
                <Typography
                  preset="bodyLg"
                  color={action.destructive ? colors.error : colors.textPrimary}
                >
                  {action.label}
                </Typography>
              </View>
            </Pressable>
          </React.Fragment>
        ))}
      </View>
      <Divider />
      <Pressable
        style={({ pressed }) => [styles.cancel, { opacity: pressed ? 0.6 : 1 }]}
        onPress={onClose}
      >
        <Typography preset="bodyLg" color={colors.textSecondary} align="center">
          Cancel
        </Typography>
      </Pressable>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  list: { gap: 0 },
  item: {
    paddingVertical: spacing[4],
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  cancel: {
    paddingVertical: spacing[3],
  },
});
