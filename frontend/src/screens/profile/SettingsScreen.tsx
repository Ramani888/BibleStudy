import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { MenuItem } from './components/MenuItem';
import { AppModal } from '../../components/feedback';
import { Button, Divider, Typography } from '../../components/ui';
import { useAuthStore } from '../../store';
import { useDeleteAccount } from '../../hooks';
import { getErrorMessage } from '../../api';
import { colors, layout, spacing } from '../../theme';

const APP_VERSION = '1.0.0';

export function SettingsScreen() {
  const logout = useAuthStore(s => s.logout);
  const reset = useAuthStore(s => s.reset);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const { mutate: deleteAccount, isPending: deleting } = useDeleteAccount();

  const handleDelete = () => {
    deleteAccount(undefined, {
      onSuccess: () => {
        setDeleteModalOpen(false);
        reset();
        Toast.show({ type: 'success', text1: 'Account deleted' });
      },
      onError: err => {
        setDeleteModalOpen(false);
        Toast.show({ type: 'error', text1: 'Delete failed', text2: getErrorMessage(err) });
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
            emoji="🚪"
            label="Sign Out"
            showChevron={false}
            onPress={() =>
              Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Out', style: 'destructive', onPress: logout },
              ])
            }
          />
          <Divider marginV={0} />
          <MenuItem
            emoji="🗑"
            label="Delete Account"
            destructive
            showChevron={false}
            onPress={() => setDeleteModalOpen(true)}
          />
        </View>

        {/* ── App info ── */}
        <View style={styles.section}>
          <Typography preset="label" color={colors.textDisabled} style={styles.sectionLabel}>
            APP INFO
          </Typography>
          <MenuItem emoji="📖" label="Version" value={APP_VERSION} showChevron={false} onPress={() => {}} />
          <Divider marginV={0} />
          <MenuItem emoji="✦" label="BibleStudy Pro" value="Made with ♥" showChevron={false} onPress={() => {}} />
        </View>
      </ScrollView>

      {/* ── Delete confirmation modal ── */}
      <AppModal
        visible={deleteModalOpen}
        title="Delete Account"
        onClose={() => setDeleteModalOpen(false)}
      >
        <Typography preset="body" color={colors.textSecondary} style={styles.deleteMsg}>
          This will permanently delete your account, all your sets, cards, and data.
          This action cannot be undone.
        </Typography>
        <Divider />
        <View style={styles.deleteBtns}>
          <Button
            label="Cancel"
            variant="ghost"
            onPress={() => setDeleteModalOpen(false)}
            style={styles.flex}
          />
          <Button
            label="Delete"
            variant="danger"
            onPress={handleDelete}
            loading={deleting}
            style={styles.flex}
          />
        </View>
      </AppModal>
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
  deleteMsg: { marginBottom: spacing[2], lineHeight: 22 },
  deleteBtns: { flexDirection: 'row', gap: spacing[3] },
  flex: { flex: 1 },
});
