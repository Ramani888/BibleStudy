import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Animated from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

import type { ProfileScreenProps } from '../../navigation/types';
import type { Friendship } from '../../types/friends.types';
import { QMAvatar, QMBackButton, QMButton, QMConfirmDialog, QMEmpty, QMSheet, qmRowEnter, type QMSheetAction } from '../../components/qm';
import { AnimatedPressable, Typography } from '../../components/ui';
import {
  BlockIcon, ChevronRightIcon, GiftIcon, InboxIcon, InfoIcon, LeaderboardIcon, LeafIcon, MoreVerticalIcon, PersonPlusIcon, SearchIcon, UserIcon, UserMinusIcon,
} from '../../components/icons';
import { useBlockUser, useFriendRequests, useFriends, useRemoveFriend } from '../../hooks/useFriends';
import { useConfirmDialog, useLeaderboard, useReferral } from '../../hooks';
import { getErrorMessage } from '../../api/client';
import { radius, spacing, useTheme } from '../../theme';

type Props = ProfileScreenProps<'Friends'>;

const TOUCH = 44;
const AVATAR = 44;
const STACK = 34;
const BADGE = 20;

export function FriendsScreen({ navigation }: Props) {
  const { t } = useTranslation(['profile', 'common']);
  const { qm } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: friends = [], isLoading, isFetching, isError, refetch } = useFriends();
  const { data: incoming = [] } = useFriendRequests('incoming');
  const { data: leaderboard = [] } = useLeaderboard();
  const { data: referral } = useReferral();
  const removeFriend = useRemoveFriend();
  const blockUser = useBlockUser();
  const { show, dialogProps } = useConfirmDialog();
  const [menuFor, setMenuFor] = useState<Friendship | null>(null);

  const streakMap = useMemo(() => new Map(leaderboard.map(e => [e.userId, e.streak])), [leaderboard]);
  const reqCount = incoming.length;
  const reqNames = incoming.map(r => r.sender?.name?.split(' ')[0]).filter((n): n is string => !!n);
  const reqWho = reqNames.length <= 1
    ? t('profile:qmFriends.reqWho_one', { a: reqNames[0] ?? '' })
    : reqNames.length === 2 ? t('profile:qmFriends.reqWho_two', { a: reqNames[0], b: reqNames[1] })
      : t('profile:qmFriends.reqWho_more', { a: reqNames[0], b: reqNames[1] });
  const inviteReward = referral?.rewardPerReferral ?? 5;

  const confirmRemove = useCallback((f: Friendship) => {
    const name = f.friend.name.split(' ')[0];
    show({
      title: t('profile:qmFriends.removeTitle', { name }),
      message: t('profile:qmFriends.removeText'),
      confirmLabel: t('profile:qmFriends.removeBtn'),
      cancelLabel: t('profile:qmFriends.cancel'),
      variant: 'danger',
      onConfirm: () => removeFriend.mutate(f.friendId, {
        onSuccess: () => Toast.show({ type: 'success', text1: t('profile:qmFriends.removed', { name }) }),
        onError: e => Toast.show({ type: 'error', text1: getErrorMessage(e) }),
      }),
    });
  }, [show, removeFriend, t]);

  const confirmBlock = useCallback((f: Friendship) => {
    const name = f.friend.name.split(' ')[0];
    show({
      title: t('profile:qmFriends.blockTitle', { name }),
      message: t('profile:qmFriends.blockText'),
      confirmLabel: t('profile:qmFriends.blockBtn'),
      cancelLabel: t('profile:qmFriends.cancel'),
      variant: 'danger',
      onConfirm: () => blockUser.mutate(f.friendId, {
        onSuccess: () => Toast.show({ type: 'success', text1: t('profile:qmFriends.blocked', { name }) }),
        onError: e => Toast.show({ type: 'error', text1: getErrorMessage(e) }),
      }),
    });
  }, [show, blockUser, t]);

  const menu: QMSheetAction[] = menuFor ? [
    { label: t('profile:qmFriends.viewProfile'), icon: UserIcon, onPress: () => navigation.navigate('UserProfile', { userId: menuFor.friendId }) },
    { label: t('profile:qmFriends.remove'), icon: UserMinusIcon, onPress: () => confirmRemove(menuFor) },
    { label: t('profile:qmFriends.block'), icon: BlockIcon, danger: true, onPress: () => confirmBlock(menuFor) },
  ] : [];

  const renderItem = useCallback(({ item, index }: { item: Friendship; index: number }) => {
    const streak = streakMap.get(item.friendId) ?? 0;
    return (
      <Animated.View entering={qmRowEnter(index + 1)} style={[styles.row, { backgroundColor: qm.surface, boxShadow: qm.cardShadow }]}>
        <AnimatedPressable
          scaleTo={0.98}
          onPress={() => navigation.navigate('UserProfile', { userId: item.friendId })}
          style={styles.rowMain}
          accessibilityRole="button"
          accessibilityLabel={item.friend.name}
        >
          <QMAvatar uri={item.friend.profileImage} name={item.friend.name} size={AVATAR} />
          <View style={styles.flex}>
            <Typography preset="qmBodyLg" color={qm.ink} numberOfLines={1}>{item.friend.name}</Typography>
            {streak > 0 ? (
              <View style={styles.sub}>
                <LeafIcon size={12} color={qm.leaf} filled />
                <Typography preset="qmMeta" color={qm.leafText}>{t('profile:qmFriends.streak', { count: streak })}</Typography>
              </View>
            ) : item.friend.church ? (
              <Typography preset="qmMeta" color={qm.muted} numberOfLines={1} style={styles.subText}>{item.friend.church}</Typography>
            ) : null}
          </View>
        </AnimatedPressable>
        <Pressable
          onPress={() => setMenuFor(item)}
          hitSlop={4}
          style={({ pressed }) => [styles.touch, pressed && styles.dim]}
          accessibilityRole="button"
          accessibilityLabel={t('profile:qmFriends.optionsA11y', { name: item.friend.name })}
        >
          <MoreVerticalIcon size={18} color={qm.muted} />
        </Pressable>
      </Animated.View>
    );
  }, [qm, streakMap, navigation, t]);

  const header = (
    <View style={{ paddingTop: insets.top + spacing.sm }}>
      <View style={styles.topRow}>
        <QMBackButton onPress={navigation.goBack} label={t('profile:qmFriends.back')} />
        <View style={styles.flex} />
        <AnimatedPressable
          scaleTo={0.95}
          onPress={() => navigation.navigate('FriendRequests')}
          style={[styles.touch, { backgroundColor: qm.field }]}
          accessibilityRole="button"
          accessibilityLabel={reqCount > 0 ? t('profile:qmFriends.requestsNewA11y', { count: reqCount }) : t('profile:qmFriends.requestsA11y')}
        >
          <InboxIcon size={19} color={qm.ink} strokeWidth={2} />
          {reqCount > 0 && (
            <View style={[styles.badge, { backgroundColor: qm.violet, borderColor: qm.bg }]}>
              <Typography preset="qmTag" color={qm.onViolet}>{reqCount > 9 ? '9+' : reqCount}</Typography>
            </View>
          )}
        </AnimatedPressable>
        <AnimatedPressable scaleTo={0.95} onPress={() => navigation.navigate('Leaderboard')} style={[styles.touch, { backgroundColor: qm.field }]} accessibilityRole="button" accessibilityLabel={t('profile:qmFriends.leaderboardA11y')}>
          <LeaderboardIcon size={19} color={qm.ink} strokeWidth={2} />
        </AnimatedPressable>
        <AnimatedPressable scaleTo={0.95} onPress={() => navigation.navigate('SearchUsers')} style={[styles.touch, { backgroundColor: qm.violet, boxShadow: qm.btnShadow }]} accessibilityRole="button" accessibilityLabel={t('profile:qmFriends.findA11y')}>
          <PersonPlusIcon size={19} color={qm.onViolet} strokeWidth={2} />
        </AnimatedPressable>
      </View>
      <Typography preset="qmPageTitle" color={qm.ink} style={styles.h1}>{t('profile:qmFriends.title')}</Typography>
      <Typography preset="qmBodyMd" color={qm.muted}>
        {friends.length === 0 ? t('profile:qmFriends.countNone') : t('profile:qmFriends.count', { count: friends.length })}
      </Typography>

      {reqCount > 0 && (
        <Animated.View entering={qmRowEnter(0)}>
          <AnimatedPressable scaleTo={0.98} onPress={() => navigation.navigate('FriendRequests')} style={[styles.reqBanner, { backgroundColor: qm.lilac }]} accessibilityRole="button">
            <View style={styles.stack}>
              {incoming.slice(0, 2).map((r, i) => (
                <View key={r.id} style={[styles.stackItem, i > 0 && styles.stackOverlap, { borderColor: qm.lilac }]}>
                  <QMAvatar uri={r.sender?.profileImage} name={r.sender?.name} size={STACK} />
                </View>
              ))}
            </View>
            <View style={styles.flex}>
              <Typography preset="qmBodyLg" color={qm.lilacInk}>{t('profile:qmFriends.reqBanner', { count: reqCount })}</Typography>
              <Typography preset="qmMeta" color={qm.lilacInk} numberOfLines={1} style={styles.subText}>{reqWho}</Typography>
            </View>
            <View style={[styles.countPill, { backgroundColor: qm.violet }]}>
              <Typography preset="qmChip" color={qm.onViolet}>{reqCount}</Typography>
            </View>
          </AnimatedPressable>
        </Animated.View>
      )}
      <View style={styles.listGap} />
    </View>
  );

  let empty: React.ReactElement | null = null;
  if (isLoading) empty = <ActivityIndicator color={qm.violet} style={styles.loading} />;
  else if (isError) empty = <QMEmpty icon={InfoIcon} title={t('profile:qmFriends.loadFailed')} action={{ label: t('profile:qmFriends.tryAgain'), onPress: () => refetch() }} />;
  else {
    empty = (
      <View style={styles.empty}>
        <LeafIcon size={52} color={qm.leaf} strokeWidth={1.3} />
        <Typography preset="qmEmptyTitle" color={qm.ink} align="center" style={styles.emptyTitle}>{t('profile:qmFriends.emptyTitle')}</Typography>
        <Typography preset="qmBodyMd" color={qm.muted} align="center">{t('profile:qmFriends.emptyText')}</Typography>
        <QMButton icon={SearchIcon} label={t('profile:qmFriends.search')} onPress={() => navigation.navigate('SearchUsers')} style={styles.emptyBtn} />
        <AnimatedPressable scaleTo={0.97} onPress={() => navigation.navigate('InviteFriends')} style={[styles.inviteSoft, { backgroundColor: qm.lilac }]} accessibilityRole="button">
          <Typography preset="qmButtonLg" color={qm.lilacInk}>{t('profile:qmFriends.invite', { count: inviteReward })}</Typography>
        </AnimatedPressable>
      </View>
    );
  }

  const footer = friends.length > 0 ? (
    <AnimatedPressable scaleTo={0.98} onPress={() => navigation.navigate('InviteFriends')} style={styles.inviteWrap} accessibilityRole="button">
      <LinearGradient colors={qm.hero as unknown as string[]} locations={[0, 0.55, 1]} start={{ x: 0.18, y: 0 }} end={{ x: 0.82, y: 1 }} style={styles.invite}>
        <GiftIcon size={22} color={qm.goldText} />
        <Typography preset="qmSegment" color={qm.heroInk} style={styles.flex}>{t('profile:qmFriends.invite', { count: inviteReward })}</Typography>
        <ChevronRightIcon size={16} color={qm.heroInk} strokeWidth={2} />
      </LinearGradient>
    </AnimatedPressable>
  ) : null;

  return (
    <View style={[styles.flex, { backgroundColor: qm.bg }]}>
      <FlatList
        data={isError ? [] : friends}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={footer}
        ItemSeparatorComponent={Separator}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} tintColor={qm.violet} progressViewOffset={insets.top} />}
      />
      <QMSheet visible={!!menuFor} onClose={() => setMenuFor(null)} title={menuFor?.friend.name} actions={menu} />
      <QMConfirmDialog {...dialogProps} />
    </View>
  );
}

function Separator() {
  return <View style={styles.sep} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  dim: { opacity: 0.6 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl, flexGrow: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.s6 },
  touch: { width: TOUCH, height: TOUCH, borderRadius: TOUCH / 2, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute', top: -spacing.s2, right: -spacing.s2, minWidth: BADGE, height: BADGE, borderRadius: BADGE / 2,
    paddingHorizontal: spacing.s5, borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  h1: { marginTop: spacing.s6, marginBottom: spacing.s2 },
  reqBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg, paddingVertical: spacing.s14, paddingHorizontal: spacing.lg, borderRadius: radius.r20 },
  stack: { flexDirection: 'row' },
  stackItem: { borderRadius: STACK, borderWidth: 2 },
  stackOverlap: { marginLeft: -spacing.s10 },
  countPill: { minWidth: spacing.xxl, height: spacing.xxl, borderRadius: spacing.md, paddingHorizontal: spacing.s6, alignItems: 'center', justifyContent: 'center' },
  listGap: { height: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.s10, paddingLeft: spacing.md, paddingRight: spacing.s6, borderRadius: radius.r17 + 1 },
  rowMain: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  sub: { flexDirection: 'row', alignItems: 'center', gap: spacing.s5, marginTop: spacing.s2 },
  subText: { marginTop: spacing.s2 },
  sep: { height: spacing.sm },
  inviteWrap: { marginTop: spacing.lg },
  invite: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.s14, paddingHorizontal: spacing.lg, borderRadius: radius.r20 },
  loading: { marginTop: spacing.xxxl },
  empty: { alignItems: 'center', marginTop: spacing.s48, paddingHorizontal: spacing.lg },
  emptyTitle: { marginTop: spacing.md, marginBottom: spacing.s6 },
  emptyBtn: { alignSelf: 'stretch', marginTop: spacing.s22 },
  inviteSoft: { alignSelf: 'stretch', height: 52, marginTop: spacing.sm, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
