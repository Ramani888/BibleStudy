import React from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import Toast from 'react-native-toast-message';
import { MenuItem } from './components/MenuItem';
import { Avatar, Badge, Divider, Typography } from '../../components/ui';
import { useAuthStore } from '../../store';
import { useUpdateMapPrivacy } from '../../hooks/useMap';
import { formatBytes } from '../../utils/formatters';
import { getErrorMessage } from '../../api/client';
import { colors, layout, spacing } from '../../theme';
import type { ProfileStackParamList } from '../../navigation/types';
import type { Plan } from '../../types';

type ProfileNav = NativeStackNavigationProp<ProfileStackParamList>;

const PLAN_VARIANT: Record<Plan, 'neutral' | 'info' | 'primary'> = {
  FREE: 'neutral',
  STARTER: 'info',
  PRO: 'primary',
};

export function ProfileScreen() {
  const navigation = useNavigation<ProfileNav>();
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const updatePrivacy = useUpdateMapPrivacy();

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

  const storagePercent = user
    ? Math.round((user.storageUsed / user.storageLimit) * 100)
    : 0;

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
            <Typography preset="caption" color={colors.textDisabled} align="center">
              ⛪ {user.church}
            </Typography>
          ) : null}
        </View>

        {/* ── Stats row ── */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Typography preset="h3" color={colors.primary}>
              {user?.creditBalance ?? 0}
            </Typography>
            <Typography preset="caption" color={colors.textSecondary}>Credits</Typography>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Typography preset="h3">{storagePercent}%</Typography>
            <Typography preset="caption" color={colors.textSecondary}>
              Storage used
            </Typography>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Typography preset="h3">
              {formatBytes(user?.storageUsed ?? 0)}
            </Typography>
            <Typography preset="caption" color={colors.textSecondary}>
              of {formatBytes(user?.storageLimit ?? 0)}
            </Typography>
          </View>
        </View>

        {/* ── Account menu ── */}
        <View style={styles.section}>
          <Typography preset="label" color={colors.textDisabled} style={styles.sectionLabel}>
            ACCOUNT
          </Typography>
          <MenuItem emoji="👤" label="Edit Profile" onPress={() => navigation.navigate('EditProfile')} />
          <Divider marginV={0} />
          <MenuItem emoji="🔒" label="Change Password" onPress={() => navigation.navigate('ChangePassword')} />
          <Divider marginV={0} />
          <MenuItem
            emoji="✦"
            label="My Credits"
            value={`${user?.creditBalance ?? 0} credits`}
            onPress={() => navigation.navigate('Credits')}
          />
        </View>

        {/* ── Community menu ── */}
        <View style={styles.section}>
          <Typography preset="label" color={colors.textDisabled} style={styles.sectionLabel}>
            COMMUNITY
          </Typography>
          <MenuItem emoji="👥" label="Friends" onPress={() => navigation.navigate('Friends')} />
          <Divider marginV={0} />
          <MenuItem emoji="🏛️" label="My Groups" onPress={() => navigation.navigate('Groups')} />
          <Divider marginV={0} />
          <MenuItem emoji="🔔" label="Notifications" onPress={() => navigation.navigate('Notifications')} />
          <Divider marginV={0} />
          <MenuItem emoji="📍" label="Location Privacy" onPress={handleLocationPrivacy} />
        </View>

        {/* ── App menu ── */}
        <View style={styles.section}>
          <Typography preset="label" color={colors.textDisabled} style={styles.sectionLabel}>
            APP
          </Typography>
          <MenuItem emoji="⚙️" label="Settings" onPress={() => navigation.navigate('Settings')} />
        </View>

        {/* ── Danger zone ── */}
        <View style={styles.section}>
          <MenuItem
            emoji="🚪"
            label="Sign Out"
            destructive={false}
            showChevron={false}
            onPress={() =>
              Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Out', style: 'destructive', onPress: logout },
              ])
            }
          />
        </View>
      </ScrollView>
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

  // Menu sections
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
