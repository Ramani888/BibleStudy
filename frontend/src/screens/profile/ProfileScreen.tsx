import React, { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

import { MenuSection } from './components/MenuSection';
import { MenuItem } from './components/MenuItem';
import { ConfirmDialog } from '../../components/feedback';
import { Avatar, Badge, Typography } from '../../components/ui';
import {
  AlbumsIcon,
  BellIcon,
  FileTextIcon,
  LockIcon,
  LogOutIcon,
  SettingsIcon,
  StarOutlineIcon,
  TrophyIcon,
  UserIcon,
  UsersIcon,
} from '../../components/icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store';
import { useSetStats, useConfirmDialog, useCreditBalance, useNoteStats, useStorageUsage, useStreak } from '../../hooks';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { fontFamily, fontSize, layout, palette, radius, spacing, useTheme } from '../../theme';
import type { ProfileScreenProps } from '../../navigation/types';

const APP_VERSION = '1.0.0';

export function ProfileScreen({ navigation }: ProfileScreenProps<'Profile'>) {
  const { t } = useTranslation(['profile', 'common', 'home']);
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

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

  const handleNavBell         = useCallback(() => navigation.navigate('Notifications'), [navigation]);
  const handleNavStorage      = useCallback(() => navigation.navigate(overQuota ? 'Paywall' : 'Media'), [navigation, overQuota]);
  const handleNavAchievements = useCallback(() => navigation.navigate('Achievements'), [navigation]);
  const handleNavNotes        = useCallback(() => navigation.navigate('Notes'), [navigation]);
  const handleNavMedia        = useCallback(() => navigation.navigate('Media'), [navigation]);
  const handleNavFriends      = useCallback(() => navigation.navigate('Friends'), [navigation]);
  const handleNavNotifSettings = useCallback(() => navigation.navigate('NotificationSettings'), [navigation]);
  const handleNavEditProfile  = useCallback(() => navigation.navigate('EditProfile'), [navigation]);
  const handleNavCredits      = useCallback(() => navigation.navigate('Credits'), [navigation]);
  const handleNavPaywall      = useCallback(() => navigation.navigate('Paywall'), [navigation]);
  const handleNavChangePass   = useCallback(() => navigation.navigate('ChangePassword'), [navigation]);
  const handleNavSettings     = useCallback(() => navigation.navigate('Settings'), [navigation]);
  const handleSignOut         = useCallback(() =>
    showConfirm({
      title: t('profile:settings.signOut'),
      message: t('profile:settings.signOutConfirm'),
      confirmLabel: t('profile:settings.signOut'),
      variant: 'danger',
      onConfirm: logout,
    }), [showConfirm, logout, t]);

  return (
    <View style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.stickyHeader, { paddingTop: insets.top + 8, backgroundColor: colors.background }]}>
        <Typography preset="h3" color={colors.textPrimary}>{t('profile:title')}</Typography>
      </View>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 96 }]}
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
                {user?.plan ?? 'FREE'} · {t('home:greeting.streakDays', { count: streakData?.streak ?? 0, defaultValue: `${streakData?.streak ?? 0} day streak` })} 🔥
              </Typography>
            </View>
            <Pressable
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
              onPress={handleNavBell}
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
            <Typography preset="caption" color={colors.textSecondary}>{t('home:stats.credits')}</Typography>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statBox}>
            <Typography preset="h4" color={colors.accent}>{stats?.totalSets ?? 0}</Typography>
            <Typography preset="caption" color={colors.textSecondary}>{t('home:stats.sets')}</Typography>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statBox}>
            <Typography preset="h4" color={colors.accent}>{stats?.totalCards ?? 0}</Typography>
            <Typography preset="caption" color={colors.textSecondary}>{t('home:stats.cards', 'Cards')}</Typography>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statBox}>
            <Typography preset="h4" color={colors.accent}>{totalNotes}</Typography>
            <Typography preset="caption" color={colors.textSecondary}>{t('home:stats.notes')}</Typography>
          </View>
        </View>

        {/* ── Storage bar ── */}
        <Pressable
          style={({ pressed }) => [styles.storageSection, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && { opacity: 0.7 }]}
          onPress={handleNavStorage}
        >
          <View style={styles.storageRow}>
            <Typography preset="caption" color={overQuota ? colors.alert : colors.textSecondary}>
              {overQuota ? t('profile:storage.overLimit') : t('profile:storage.title')}
            </Typography>
            <Typography preset="caption" color={overQuota ? colors.alert : colors.textSecondary}>
              {t('profile:storage.usage', { used: usedMB, limit: limitMB })}
            </Typography>
          </View>
          <ProgressBar
            progress={Math.min((storage?.percent ?? 0) / 100, 1)}
            color={overQuota ? colors.alert : colors.accent}
          />
        </Pressable>

        {/* ── My Study ── */}
        <View>
        <MenuSection label={t('profile:sections.myStudy')}>
          <MenuItem icon={TrophyIcon} label={t('profile:menu.achievements')} onPress={handleNavAchievements} />
          <MenuItem icon={FileTextIcon} label={t('profile:menu.myNotes')} onPress={handleNavNotes} />
          <MenuItem icon={AlbumsIcon} label={t('profile:menu.myMedia')} onPress={handleNavMedia} />
        </MenuSection>

        {/* ── Community ── */}
        <MenuSection label={t('profile:sections.community')}>
          <MenuItem icon={UsersIcon} label={t('profile:menu.friends')} onPress={handleNavFriends} />
          <MenuItem icon={BellIcon} label={t('profile:menu.notifications')} onPress={handleNavNotifSettings} />
        </MenuSection>

        {/* ── Account ── */}
        <MenuSection label={t('profile:sections.account')}>
          <MenuItem icon={UserIcon} label={t('profile:menu.editProfile')} onPress={handleNavEditProfile} />
          <MenuItem
            icon={StarOutlineIcon}
            label={t('profile:menu.myCredits')}
            value={t('profile:credits.creditsCount', { count: creditData?.balance ?? 0, defaultValue: `${creditData?.balance ?? 0} credits` })}
            onPress={handleNavCredits}
          />
          <MenuItem
            icon={StarOutlineIcon}
            label={user?.plan && user.plan !== 'FREE' ? t('profile:menu.managePlan') : t('profile:menu.upgradeToPremium')}
            value={user?.plan ?? 'FREE'}
            onPress={handleNavPaywall}
          />
          <MenuItem icon={LockIcon} label={t('profile:menu.changePassword')} onPress={handleNavChangePass} />
          <MenuItem icon={SettingsIcon} label={t('profile:menu.settings')} onPress={handleNavSettings} />
        </MenuSection>

        {/* ── Sign out ── */}
        <MenuSection label="">
          <MenuItem
            icon={LogOutIcon}
            label={t('profile:menu.signOut')}
            destructive
            showChevron={false}
            onPress={handleSignOut}
          />
        </MenuSection>

        </View>

        <Typography
          preset="caption"
          color={colors.textDisabled}
          align="center"
          style={styles.version}
        >
          {t('profile:settings.versionLabel', { version: APP_VERSION, defaultValue: `Version ${APP_VERSION}` })}
        </Typography>
      </ScrollView>

      <ConfirmDialog {...dialogProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  stickyHeader: {
    width: '100%',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  scroll: { paddingTop: spacing.sm },

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
