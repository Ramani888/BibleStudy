import React from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import Toast from 'react-native-toast-message';

import type { ProfileScreenProps } from '../../navigation/types';
import { MenuSection } from './components/MenuSection';
import { MenuItem } from './components/MenuItem';
import { ConfirmDialog } from '../../components/feedback';
import { Divider, Typography } from '../../components/ui';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { BookIcon, LogOutIcon, StarOutlineIcon, TrashIcon } from '../../components/icons';
import { useAuthStore } from '../../store';
import { useConfirmDialog } from '../../hooks';
import { getErrorMessage } from '../../api';
import { spacing, useTheme, useThemeName, useThemeStore } from '../../theme';

const APP_VERSION = '1.0.0';

export function SettingsScreen({ navigation }: ProfileScreenProps<'Settings'>) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const logout = useAuthStore(s => s.logout);
  const deleteAccount = useAuthStore(s => s.deleteAccount);
  const { show, dialogProps } = useConfirmDialog();
  const isDark = useThemeName() === 'dark';
  const setMode = useThemeStore(s => s.setMode);

  const handleSignOut = () => {
    show({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out?',
      confirmLabel: 'Sign Out',
      variant: 'danger',
      onConfirm: logout,
    });
  };

  const handleDeleteAccount = () => {
    show({
      title: 'Delete Account',
      message: 'This will permanently delete your account, all your sets, cards, and data. This action cannot be undone.',
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteAccount();
          Toast.show({ type: 'success', text1: 'Account deleted' });
        } catch (err) {
          Toast.show({ type: 'error', text1: 'Delete failed', text2: getErrorMessage(err) });
        }
      },
    });
  };

  return (
    <Screen header={<ScreenHeader title="Settings" onBack={() => navigation.goBack()} />}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <MenuSection label="Appearance">
          <View style={styles.themeRow}>
            <Typography preset="label" color={colors.textPrimary}>Dark Mode</Typography>
            <Switch
              value={isDark}
              onValueChange={v => setMode(v ? 'dark' : 'light')}
              trackColor={{ true: colors.primary, false: colors.border }}
            />
          </View>
        </MenuSection>

        <MenuSection label="Account">
          <MenuItem icon={LogOutIcon} label="Sign Out" showChevron={false} onPress={handleSignOut} />
          <Divider marginV={0} />
          <MenuItem icon={TrashIcon} label="Delete Account" destructive showChevron={false} onPress={handleDeleteAccount} />
        </MenuSection>

        <MenuSection label="App Info">
          <MenuItem icon={BookIcon} label="Version" value={APP_VERSION} showChevron={false} onPress={() => {}} />
          <Divider marginV={0} />
          <MenuItem icon={StarOutlineIcon} label="BibleStudy Pro" value="Made with ♥" showChevron={false} onPress={() => {}} />
        </MenuSection>
      </ScrollView>

      <ConfirmDialog {...dialogProps} />
    </Screen>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    safe: { flex: 1 },
    scroll: { paddingBottom: spacing[12] },
    themeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing[4],
    },
  });
}
