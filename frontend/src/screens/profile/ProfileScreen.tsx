import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MenuSection } from './components/MenuSection';
import { MenuItem } from './components/MenuItem';
import { ConfirmDialog } from '../../components/feedback';
import { Avatar, Badge, Divider, Typography } from '../../components/ui';
import {
  AlbumsIcon,
  BellIcon,
  BuildingIcon,
  FileTextIcon,
  LockIcon,
  LogOutIcon,
  SettingsIcon,
  StarOutlineIcon,
  UserIcon,
  UsersIcon,
} from '../../components/icons';
import { useAuthStore } from '../../store';
import { useSetStats, useConfirmDialog, useCreditBalance, useNoteStats, useStorageUsage } from '../../hooks';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { layout, spacing, useTheme } from '../../theme';
import type { ProfileScreenProps } from '../../navigation/types';
import type { Plan } from '../../types';

const APP_VERSION = '1.0.0';

const PLAN_VARIANT: Record<Plan, 'neutral' | 'info' | 'primary'> = {
  FREE: 'neutral',
  STARTER: 'info',
  PRO: 'primary',
};

export function ProfileScreen({ navigation }: ProfileScreenProps<'Profile'>) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const { show: showConfirm, dialogProps } = useConfirmDialog();

  const { data: stats } = useSetStats();
  const { data: creditData } = useCreditBalance();
  const { totalNotes } = useNoteStats();
  const { data: storage } = useStorageUsage();

  const usedMB  = ((storage?.used  ?? 0) / 1048576).toFixed(1);
  const limitMB = ((storage?.limit ?? 262144000) / 1048576).toFixed(0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Avatar uri={user?.profileImage} name={user?.name} size="md" />
          <View style={styles.headerInfo}>
            <Typography preset="h4">{user?.name}</Typography>
            <Typography preset="caption" color={colors.textSecondary}>
              {user?.email}
            </Typography>
            <View style={styles.badgeRow}>
              <Badge
                label={user?.plan ?? 'FREE'}
                variant={PLAN_VARIANT[user?.plan ?? 'FREE']}
              />
              {!user?.emailVerified && (
                <Badge label="Unverified" variant="warning" />
              )}
            </View>
          </View>
          <Pressable
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            onPress={() => navigation.navigate('Notifications')}
            hitSlop={12}
          >
            <BellIcon size={24} color={colors.textPrimary} />
          </Pressable>
        </View>

        {/* ── Stats row ── */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Typography preset="h4" color={colors.primary}>{creditData?.balance ?? 0}</Typography>
            <Typography preset="caption" color={colors.textSecondary}>Credits</Typography>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Typography preset="h4" color={colors.primary}>{stats?.totalSets ?? 0}</Typography>
            <Typography preset="caption" color={colors.textSecondary}>Sets</Typography>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Typography preset="h4" color={colors.primary}>{stats?.totalCards ?? 0}</Typography>
            <Typography preset="caption" color={colors.textSecondary}>Cards</Typography>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Typography preset="h4" color={colors.primary}>{totalNotes}</Typography>
            <Typography preset="caption" color={colors.textSecondary}>Notes</Typography>
          </View>
        </View>

        {/* ── Storage bar ── */}
        <Pressable
          style={({ pressed }) => [styles.storageSection, pressed && { opacity: 0.7 }]}
          onPress={() => navigation.navigate('Media')}
        >
          <View style={styles.storageRow}>
            <Typography preset="caption" color={colors.textSecondary}>Storage</Typography>
            <Typography preset="caption" color={colors.textSecondary}>
              {usedMB} MB of {limitMB} MB
            </Typography>
          </View>
          <ProgressBar progress={(storage?.percent ?? 0) / 100} color={colors.primary} />
        </Pressable>

        {/* ── My Study ── */}
        <MenuSection label="My Study">
          <MenuItem icon={FileTextIcon} label="My Notes" onPress={() => navigation.navigate('Notes')} />
          <Divider marginV={0} />
          <MenuItem icon={AlbumsIcon} label="My Media" onPress={() => navigation.navigate('Media')} />
        </MenuSection>

        {/* ── Community ── */}
        <MenuSection label="Community">
          <MenuItem icon={UsersIcon} label="Friends" onPress={() => navigation.navigate('Friends')} />
          <Divider marginV={0} />
          <MenuItem icon={BuildingIcon} label="Groups" onPress={() => navigation.navigate('Groups')} />
          <Divider marginV={0} />
          <MenuItem icon={BellIcon} label="Notifications" onPress={() => navigation.navigate('Notifications')} />
        </MenuSection>

        {/* ── Account ── */}
        <MenuSection label="Account">
          <MenuItem icon={UserIcon} label="Edit Profile" onPress={() => navigation.navigate('EditProfile')} />
          <Divider marginV={0} />
          <MenuItem
            icon={StarOutlineIcon}
            label="My Credits"
            value={`${creditData?.balance ?? 0} credits`}
            onPress={() => navigation.navigate('Credits')}
          />
          <Divider marginV={0} />
          <MenuItem icon={LockIcon} label="Change Password" onPress={() => navigation.navigate('ChangePassword')} />
          <Divider marginV={0} />
          <MenuItem icon={SettingsIcon} label="Settings" onPress={() => navigation.navigate('Settings')} />
        </MenuSection>

        {/* ── Sign out ── */}
        <MenuSection label="">
          <MenuItem
            icon={LogOutIcon}
            label="Sign Out"
            destructive
            showChevron={false}
            onPress={() =>
              showConfirm({
                title: 'Sign Out',
                message: 'Are you sure you want to sign out?',
                confirmLabel: 'Sign Out',
                variant: 'danger',
                onConfirm: logout,
              })
            }
          />
        </MenuSection>

        <Typography
          preset="caption"
          color={colors.textDisabled}
          align="center"
          style={styles.version}
        >
          Version {APP_VERSION}
        </Typography>
      </ScrollView>

      <ConfirmDialog {...dialogProps} />
    </SafeAreaView>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    scroll: { paddingBottom: spacing[12] },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.backgroundCard,
      paddingHorizontal: layout.screenPaddingH,
      paddingVertical: spacing[5],
      gap: spacing[4],
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerInfo: { flex: 1, gap: spacing[1] },
    badgeRow: { flexDirection: 'row', gap: spacing[2], marginTop: spacing[1] },

    statsRow: {
      flexDirection: 'row',
      backgroundColor: colors.backgroundCard,
      marginTop: spacing[3],
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    statBox: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing[4],
      gap: spacing[0.5],
    },
    statDivider: {
      width: 1,
      backgroundColor: colors.border,
      marginVertical: spacing[3],
    },

    storageSection: {
      backgroundColor: colors.backgroundCard,
      marginTop: spacing[3],
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: layout.screenPaddingH,
      paddingVertical: spacing[3],
      gap: spacing[2],
    },
    storageRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },

    version: { marginTop: spacing[6] },
  });
}
