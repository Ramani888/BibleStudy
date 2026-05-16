import React from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Icon from 'react-native-vector-icons/Ionicons';
import Toast from 'react-native-toast-message';
import { MenuSection } from './components/MenuSection';
import { MenuItem } from './components/MenuItem';
import { ConfirmDialog } from '../../components/feedback';

const CHURCH_ICON_SIZE = 14;
import { Avatar, Badge, Divider, Typography } from '../../components/ui';
import { useAuthStore } from '../../store';
import { useSetStats, useConfirmDialog, useCreditBalance } from '../../hooks';
import { useUpdateMapPrivacy } from '../../hooks/useMap';
import { getErrorMessage } from '../../api/client';
import { colors, layout, spacing } from '../../theme';
import type { ProfileScreenProps } from '../../navigation/types';
import type { Plan } from '../../types';

const PLAN_VARIANT: Record<Plan, 'neutral' | 'info' | 'primary'> = {
  FREE: 'neutral',
  STARTER: 'info',
  PRO: 'primary',
};

export function ProfileScreen({ navigation }: ProfileScreenProps<'Profile'>) {
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const updatePrivacy = useUpdateMapPrivacy();
  const { show: showConfirm, dialogProps } = useConfirmDialog();

  const handleLocationPrivacy = () => {
    const options: Array<{ text: string; value: 'OFF' | 'FRIENDS' | 'EVERYONE' }> = [
      { text: 'Off', value: 'OFF' },
      { text: 'Friends Only', value: 'FRIENDS' },
      { text: 'Everyone', value: 'EVERYONE' },
    ];
    Alert.alert('Location Privacy', 'Who can see your location on the map?', [
      ...options.map(opt => ({
        text: opt.text,
        onPress: () => updatePrivacy.mutate(opt.value, {
          onSuccess: () => Toast.show({ type: 'success', text1: `Privacy set to ${opt.text}` }),
          onError: (e: unknown) => Toast.show({ type: 'error', text1: getErrorMessage(e) }),
        }),
      })),
      { text: 'Cancel', style: 'cancel' as const },
    ]);
  };

  const { data: stats } = useSetStats();
  const { data: creditData } = useCreditBalance();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar + Name ── */}
        <View style={styles.hero}>
          <Avatar
            uri={user?.profileImage}
            name={user?.name}
            size="lg"
            style={styles.avatar}
          />
          <Typography preset="h3" align="center">{user?.name}</Typography>
          <Typography preset="body" color={colors.textSecondary} align="center">
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
          {user?.bio ? (
            <Typography
              preset="bodySm"
              color={colors.textSecondary}
              align="center"
              style={styles.bio}
            >
              {user.bio}
            </Typography>
          ) : null}
          {user?.church ? (
            <View style={styles.churchRow}>
              <Icon name="business-outline" size={CHURCH_ICON_SIZE} color={colors.textDisabled} />
              <Typography preset="caption" color={colors.textDisabled}>{user.church}</Typography>
            </View>
          ) : null}
        </View>

        {/* ── Stats row ── */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Typography preset="h3" color={colors.primary}>
              {creditData?.balance ?? 0}
            </Typography>
            <Typography preset="caption" color={colors.textSecondary}>Credits</Typography>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Typography preset="h3" color={colors.primary}>{stats?.totalSets ?? 0}</Typography>
            <Typography preset="caption" color={colors.textSecondary}>Sets</Typography>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Typography preset="h3" color={colors.primary}>{stats?.totalCards ?? 0}</Typography>
            <Typography preset="caption" color={colors.textSecondary}>Cards</Typography>
          </View>
        </View>

        {/* ── Account menu ── */}
        <MenuSection label="ACCOUNT">
          <MenuItem iconName="person-outline" label="Edit Profile" onPress={() => navigation.navigate('EditProfile')} />
          <Divider marginV={0} />
          <MenuItem iconName="lock-closed-outline" label="Change Password" onPress={() => navigation.navigate('ChangePassword')} />
          <Divider marginV={0} />
          <MenuItem
            iconName="star-outline"
            label="My Credits"
            value={`${creditData?.balance ?? 0} credits`}
            onPress={() => navigation.navigate('Credits')}
          />
        </MenuSection>

        {/* ── Community menu ── */}
        <MenuSection label="COMMUNITY">
          <MenuItem iconName="people-outline" label="Friends" onPress={() => navigation.navigate('Friends')} />
          <Divider marginV={0} />
          <MenuItem iconName="people-circle-outline" label="My Groups" onPress={() => navigation.navigate('Groups')} />
          <Divider marginV={0} />
          <MenuItem iconName="notifications-outline" label="Notifications" onPress={() => navigation.navigate('Notifications')} />
          <Divider marginV={0} />
          <MenuItem iconName="location-outline" label="Location Privacy" onPress={handleLocationPrivacy} />
        </MenuSection>

        {/* ── App menu ── */}
        <MenuSection label="APP">
          <MenuItem iconName="settings-outline" label="Settings" onPress={() => navigation.navigate('Settings')} />
        </MenuSection>

        {/* ── Danger zone ── */}
        <MenuSection label="">
          <MenuItem
            iconName="log-out-outline"
            label="Sign Out"
            destructive={false}
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
      </ScrollView>

      <ConfirmDialog {...dialogProps} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundSecondary },
  scroll: { paddingBottom: spacing[12] },

  // Hero
  hero: {
    backgroundColor: colors.background,
    alignItems: 'center',
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: spacing[8],
    paddingBottom: spacing[6],
    gap: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: { marginBottom: spacing[2] },
  badgeRow: { flexDirection: 'row', gap: spacing[2], marginTop: spacing[1] },
  bio: { paddingHorizontal: spacing[8], marginTop: spacing[1] },
  churchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },

  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.background,
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

});
