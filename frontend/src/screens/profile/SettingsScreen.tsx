import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { MenuItem } from './components/MenuItem';
import { ConfirmDialog } from '../../components/feedback';
import { Divider, Typography } from '../../components/ui';
import { useAuthStore } from '../../store';
import { useDeleteAccount, useConfirmDialog } from '../../hooks';
import { getErrorMessage } from '../../api';
import { colors, layout, spacing } from '../../theme';

const APP_VERSION = '1.0.0';

export function SettingsScreen() {
  const logout = useAuthStore(s => s.logout);
  const reset = useAuthStore(s => s.reset);
  const { mutateAsync: deleteAccountAsync } = useDeleteAccount();
  const { show, dialogProps } = useConfirmDialog();

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
          await deleteAccountAsync();
          reset();
          Toast.show({ type: 'success', text1: 'Account deleted' });
        } catch (err) {
          Toast.show({ type: 'error', text1: 'Delete failed', text2: getErrorMessage(err) });
        }
      },
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Account ── */}
        <View style={styles.section}>
          <Typography preset="label" color={colors.textDisabled} style={styles.sectionLabel}>
            ACCOUNT
          </Typography>
          <MenuItem
            iconName="log-out-outline"
            label="Sign Out"
            showChevron={false}
            onPress={handleSignOut}
          />
          <Divider marginV={0} />
          <MenuItem
            iconName="trash-outline"
            label="Delete Account"
            destructive
            showChevron={false}
            onPress={handleDeleteAccount}
          />
        </View>

        {/* ── App info ── */}
        <View style={styles.section}>
          <Typography preset="label" color={colors.textDisabled} style={styles.sectionLabel}>
            APP INFO
          </Typography>
          <MenuItem iconName="book-outline" label="Version" value={APP_VERSION} showChevron={false} onPress={() => {}} />
          <Divider marginV={0} />
          <MenuItem iconName="star-outline" label="BibleStudy Pro" value="Made with ♥" showChevron={false} onPress={() => {}} />
        </View>
      </ScrollView>

      <ConfirmDialog {...dialogProps} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundSecondary },
  scroll: { paddingBottom: spacing[12] },
  section: {
    backgroundColor: colors.background,
    marginTop: spacing[3],
    paddingHorizontal: layout.screenPaddingH,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  sectionLabel: {
    paddingTop: spacing[3],
    paddingBottom: spacing[1],
    letterSpacing: 1,
    fontSize: 11,
  },
});
