import React, { useCallback } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

import type { ProfileScreenProps } from '../../navigation/types';
import { MenuSection } from './components/MenuSection';
import { MenuItem } from './components/MenuItem';
import { ConfirmDialog } from '../../components/feedback';
import { Switch, Typography } from '../../components/ui';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { BookIcon, FileTextIcon, InfoIcon, LogOutIcon, StarOutlineIcon, TrashIcon } from '../../components/icons';
import { useAuthStore } from '../../store';
import { useConfirmDialog } from '../../hooks';
import { getErrorMessage } from '../../api';
import { spacing, useTheme, useThemeStore } from '../../theme';

const APP_VERSION = '1.0.0';

export function SettingsScreen({ navigation }: ProfileScreenProps<'Settings'>) {
  const theme = useTheme();
  const { colors } = theme;

  const logout = useAuthStore(s => s.logout);
  const deleteAccount = useAuthStore(s => s.deleteAccount);
  const { show, dialogProps } = useConfirmDialog();
  const isDark = theme.name === 'dark';
  const setMode = useThemeStore(s => s.setMode);

  const handleSignOut = useCallback(() => {
    show({
      title: 'Sign Out',
      message: 'Are you sure you want to sign out?',
      confirmLabel: 'Sign Out',
      variant: 'danger',
      onConfirm: logout,
    });
  }, [show, logout]);

  const handleDeleteAccount = useCallback(() => {
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
  }, [show, deleteAccount]);

  const handleThemeToggle = useCallback((v: boolean) => setMode(v ? 'dark' : 'light'), [setMode]);
  const handleNavAboutUs = useCallback(() => navigation.navigate('AboutUs'), [navigation]);
  const handleNavPrivacy = useCallback(() => navigation.navigate('PrivacyPolicy'), [navigation]);

  return (
    <Screen edges={['top']} header={<ScreenHeader title="Settings" onBack={() => navigation.goBack()} />}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View>
          <MenuSection label="Appearance">
            <View style={styles.themeRow}>
              <Typography preset="label" color={colors.textPrimary}>Dark Mode</Typography>
              <Switch
                value={isDark}
                onValueChange={handleThemeToggle}
              />
            </View>
          </MenuSection>
        </View>

        <View>
          <MenuSection label="Account">
            <MenuItem icon={LogOutIcon} label="Sign Out" showChevron={false} onPress={handleSignOut} />
            <MenuItem icon={TrashIcon} label="Delete Account" destructive showChevron={false} onPress={handleDeleteAccount} />
          </MenuSection>
        </View>

        <View>
          <MenuSection label="App Info">
            <MenuItem icon={BookIcon} label="Version" value={APP_VERSION} showChevron={false} onPress={() => {}} />
            <MenuItem icon={StarOutlineIcon} label="BibleStudy Pro" value="Made with ♥" showChevron={false} onPress={() => {}} />
            <MenuItem icon={InfoIcon} label="About Us" onPress={handleNavAboutUs} />
            <MenuItem icon={FileTextIcon} label="Privacy Policy" onPress={handleNavPrivacy} />
          </MenuSection>
        </View>
      </ScrollView>

      <ConfirmDialog {...dialogProps} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.s48 },
  themeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.s17,
    paddingHorizontal: spacing.lg,
  },
});
