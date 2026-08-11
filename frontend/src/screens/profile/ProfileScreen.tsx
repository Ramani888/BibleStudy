import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import { MenuSection } from './components/MenuSection';
import { MenuItem } from './components/MenuItem';
import { ConfirmDialog } from '../../components/feedback';
import { Avatar, Badge, Typography } from '../../components/ui';
import {
  AlbumsIcon,
  BellIcon,
  FileTextIcon,
  FlameIcon,
  LockIcon,
  LogOutIcon,
  SettingsIcon,
  StarOutlineIcon,
  TrophyIcon,
  UserIcon,
  UsersIcon,
} from '../../components/icons';
import { useAuthStore } from '../../store';
import { useSetStats, useConfirmDialog, useCreditBalance, useNoteStats, useStorageUsage, useStreak } from '../../hooks';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { fontFamily, fontSize, layout, palette, radius, spacing, useTheme } from '../../theme';
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

  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const { show: showConfirm, dialogProps } = useConfirmDialog();

  const { data: stats } = useSetStats();
  const { data: creditData } = useCreditBalance();
  const { data: streakData } = useStreak();
  const { totalNotes } = useNoteStats();
  const { data: storage } = useStorageUsage();

  const usedMB  = ((storage?.used  ?? 0) / 1048576).toFixed(1);
  const limitMB = ((storage?.limit ?? 262144000) / 1048576).toFixed(0);
  // G2: over quota (e.g. after a downgrade) — nudge to upgrade. Nothing is deleted (#7).
  const overQuota = !!storage && storage.used > storage.limit;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile card (gradient) ── */}
        <View style={styles.profileCard}>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.profileContent}>
            <Avatar uri={user?.profileImage} name={user?.name} size="md" style={styles.avatar} />
            <View style={styles.profileText}>
              <Typography preset="h3" color={palette.white} style={styles.profileName}>{user?.name}</Typography>
              <Typography preset="caption" color={palette.white} style={styles.profileSub}>
                {user?.plan ?? 'FREE'} · {streakData?.streak ?? 0} day streak 🔥
              </Typography>
            </View>
            <Pressable
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
              onPress={() => navigation.navigate('Notifications')}
              hitSlop={12}
            >
              <BellIcon size={22} color={palette.white} />
            </Pressable>
          </View>
        </View>

        {/* ── Stats row ── */}
        <View style={[styles.statsRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.statBox}>
            <Typography preset="h4" color={colors.accent}>{creditData?.balance ?? 0}</Typography>
            <Typography preset="caption" color={colors.textSecondary}>Credits</Typography>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statBox}>
            <Typography preset="h4" color={colors.accent}>{stats?.totalSets ?? 0}</Typography>
            <Typography preset="caption" color={colors.textSecondary}>Sets</Typography>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statBox}>
            <Typography preset="h4" color={colors.accent}>{stats?.totalCards ?? 0}</Typography>
            <Typography preset="caption" color={colors.textSecondary}>Cards</Typography>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statBox}>
            <Typography preset="h4" color={colors.accent}>{totalNotes}</Typography>
            <Typography preset="caption" color={colors.textSecondary}>Notes</Typography>
          </View>
        </View>

        {/* ── Storage bar ── */}
        <Pressable
          style={({ pressed }) => [styles.storageSection, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.7 }]}
          onPress={() => navigation.navigate(overQuota ? 'Paywall' : 'Media')}
        >
          <View style={styles.storageRow}>
            <Typography preset="caption" color={overQuota ? colors.alert : colors.textSecondary}>
              {overQuota ? 'Over storage limit — Upgrade' : 'Storage'}
            </Typography>
            <Typography preset="caption" color={overQuota ? colors.alert : colors.textSecondary}>
              {usedMB} MB of {limitMB} MB
            </Typography>
          </View>
          <ProgressBar
            progress={Math.min((storage?.percent ?? 0) / 100, 1)}
            color={overQuota ? colors.alert : colors.accent}
          />
        </Pressable>

        {/* ── My Study ── */}
        <View>
        <MenuSection label="My Study">
          <MenuItem icon={TrophyIcon} label="Achievements" onPress={() => navigation.navigate('Achievements')} />
          <MenuItem icon={FileTextIcon} label="My Notes" onPress={() => navigation.navigate('Notes')} />
          <MenuItem icon={AlbumsIcon} label="My Media" onPress={() => navigation.navigate('Media')} />
        </MenuSection>

        {/* ── Community ── */}
        <MenuSection label="Community">
          <MenuItem icon={UsersIcon} label="Friends" onPress={() => navigation.navigate('Friends')} />
          <MenuItem icon={BellIcon} label="Notifications" onPress={() => navigation.navigate('NotificationSettings')} />
        </MenuSection>

        {/* ── Account ── */}
        <MenuSection label="Account">
          <MenuItem icon={UserIcon} label="Edit Profile" onPress={() => navigation.navigate('EditProfile')} />
          <MenuItem
            icon={StarOutlineIcon}
            label="My Credits"
            value={`${creditData?.balance ?? 0} credits`}
            onPress={() => navigation.navigate('Credits')}
          />
          <MenuItem
            icon={StarOutlineIcon}
            label={user?.plan && user.plan !== 'FREE' ? 'Manage Plan' : 'Upgrade to Premium'}
            value={user?.plan ?? 'FREE'}
            onPress={() => navigation.navigate('Paywall')}
          />
          <MenuItem icon={LockIcon} label="Change Password" onPress={() => navigation.navigate('ChangePassword')} />
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

        </View>

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

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingTop: spacing.sm, paddingBottom: spacing.s48 },

  profileCard: {
    height: 92,
    marginHorizontal: layout.screenPaddingH,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  profileContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.s18,
    gap: spacing.s14,
  },
  avatar: {
    borderWidth: 1,
    borderColor: palette.indigo500,
  },
  profileText: { flex: 1 },
  profileName: {
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.f22,
  },
  profileSub: {
    marginTop: spacing.xs,
    fontSize: fontSize.label,
    opacity: 0.92,
  },

  statsRow: {
    flexDirection: 'row',
    marginHorizontal: layout.screenPaddingH,
    marginTop: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.s2,
  },
  statDivider: {
    width: 1,
    marginVertical: spacing.md,
  },

  storageSection: {
    marginHorizontal: layout.screenPaddingH,
    marginTop: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: layout.screenPaddingH,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  storageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  version: { marginTop: spacing.xxl },
});
