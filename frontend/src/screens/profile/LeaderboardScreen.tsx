import React, { useCallback, useEffect } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  Easing, ReduceMotion, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import type { ProfileScreenProps } from '../../navigation/types';
import type { LeaderboardEntry } from '../../types/friends.types';
import { QMAvatar, QMBackButton, QMEmpty, qmRowEnter } from '../../components/qm';
import { AnimatedPressable, Typography } from '../../components/ui';
import { FriendsIcon, InfoIcon, LeafIcon, PlusIcon } from '../../components/icons';
import { useLeaderboard, useTabBarSpace } from '../../hooks';
import { loadFailed } from '../../utils/queryState';
import { qmFont, radius, spacing, useTheme } from '../../theme';

const AVATAR = 42;
const RANK_W = 24;
const SWAY_DEG = 4;
const SWAY_MS = 2500;
const FIND_H = 54;

/** The hero leaf sways gently, like a leaf in a morning breeze. */
function SwayLeaf() {
  const { qm } = useTheme();
  const r = useSharedValue(-SWAY_DEG);
  useEffect(() => {
    r.value = withRepeat(withSequence(
      withTiming(SWAY_DEG, { duration: SWAY_MS, easing: Easing.inOut(Easing.ease), reduceMotion: ReduceMotion.System }),
      withTiming(-SWAY_DEG, { duration: SWAY_MS, easing: Easing.inOut(Easing.ease), reduceMotion: ReduceMotion.System }),
    ), -1);
  }, [r]);
  const sway = useAnimatedStyle(() => ({ transform: [{ rotate: `${r.value}deg` }] }));
  return (
    <Animated.View style={sway}>
      <LeafIcon size={40} color={qm.leaf} strokeWidth={1.5} />
    </Animated.View>
  );
}

export function LeaderboardScreen({ navigation }: ProfileScreenProps<'Leaderboard'>) {
  const { t } = useTranslation(['profile', 'common']);
  const { qm } = useTheme();
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const leaderQuery = useLeaderboard();
  const { data: rows = [], isLoading, isFetching, refetch } = leaderQuery;
  const isError = loadFailed(leaderQuery); // offline with nothing cached → error, not "No one to walk with"
  const myRank = rows.findIndex(r => r.isMe) + 1;

  const renderItem = useCallback(({ item, index }: { item: LeaderboardEntry; index: number }) => {
    const name = item.isMe ? t('profile:qmLeader.you') : item.name;
    return (
      <Animated.View
        entering={qmRowEnter(index + 1)}
        style={[
          styles.row,
          item.isMe
            ? [styles.meRow, { backgroundColor: qm.lilac, borderColor: qm.violet }]
            : { backgroundColor: qm.surface, boxShadow: qm.cardShadow },
        ]}
        accessibilityLabel={`${index + 1}. ${name}, ${t('profile:qmLeader.streakA11y', { count: item.streak })}`}
      >
        <Typography preset="qmFieldLabel" color={qm.muted} align="center" style={styles.rank}>{index + 1}</Typography>
        <QMAvatar uri={item.profileImage} name={item.name} size={AVATAR} />
        <View style={styles.flex}>
          <Typography preset="qmBodyLg" color={qm.ink} numberOfLines={1}>{name}</Typography>
          <Typography preset="qmMeta" color={qm.muted} numberOfLines={1} style={styles.meta}>
            {t('profile:qmLeader.meta', { best: item.longestStreak, count: item.achievements })}
          </Typography>
        </View>
        <View style={styles.streak}>
          <LeafIcon size={15} color={qm.leaf} filled />
          <Typography style={[styles.streakNum, { color: qm.leafText }]}>{item.streak}</Typography>
        </View>
      </Animated.View>
    );
  }, [qm, t]);

  const header = (
    <View style={{ paddingTop: insets.top + spacing.sm }}>
      <QMBackButton onPress={navigation.goBack} label={t('profile:qmLeader.back')} />
      <Typography preset="qmPageTitle" color={qm.ink} style={styles.h1}>{t('profile:qmLeader.title')}</Typography>
      <Typography preset="qmBodyMd" color={qm.muted}>{t('profile:qmLeader.sub')}</Typography>
      <Animated.View entering={qmRowEnter(0)}>
        <LinearGradient colors={qm.hero as unknown as string[]} locations={[0, 0.55, 1]} start={{ x: 0.18, y: 0 }} end={{ x: 0.82, y: 1 }} style={styles.hero}>
          <SwayLeaf />
          <View style={styles.flex}>
            <Typography preset="qmCardTitle" color={qm.heroInk}>{t('profile:qmLeader.verse')}</Typography>
            <Typography preset="qmMeta" color={qm.heroMuted} style={styles.ref}>
              {t('profile:qmLeader.ref')} · {myRank > 0 ? t('profile:qmLeader.yourRank', { rank: myRank }) : t('profile:qmLeader.noRank')}
            </Typography>
          </View>
        </LinearGradient>
      </Animated.View>
      <View style={styles.listGap} />
    </View>
  );

  let empty: React.ReactElement | null = null;
  if (isError) empty = <QMEmpty icon={InfoIcon} title={t('profile:qmLeader.loadFailed')} action={{ label: t('profile:qmLeader.tryAgain'), onPress: () => refetch() }} />;
  else if (!isLoading) empty = <QMEmpty icon={FriendsIcon} title={t('profile:qmLeader.emptyTitle')} text={t('profile:qmLeader.emptyText')} />;

  return (
    <View style={[styles.flex, { backgroundColor: qm.bg }]}>
      <FlatList
        data={isError ? [] : rows}
        keyExtractor={item => item.userId}
        renderItem={renderItem}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={rows.length > 0 ? <Typography preset="qmMeta" color={qm.muted} align="center" style={styles.private}>{t('profile:qmLeader.private')}</Typography> : null}
        ItemSeparatorComponent={Separator}
        contentContainerStyle={[styles.content, { paddingBottom: spacing.xl + tabSpace }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} tintColor={qm.violet} progressViewOffset={insets.top} />}
      />
      <View style={[styles.footer, { marginBottom: tabSpace, backgroundColor: qm.bg }]}>
        <AnimatedPressable
          scaleTo={0.97}
          onPress={() => navigation.navigate('SearchUsers')}
          style={[styles.find, { backgroundColor: qm.lilac }]}
          accessibilityRole="button"
        >
          <PlusIcon size={18} color={qm.lilacInk} strokeWidth={2} />
          <Typography preset="qmButtonLg" color={qm.lilacInk}>{t('profile:qmLeader.findFriends')}</Typography>
        </AnimatedPressable>
      </View>
    </View>
  );
}

function Separator() {
  return <View style={styles.sep} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, flexGrow: 1 },
  h1: { marginTop: spacing.s6, marginBottom: spacing.xs },
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.s14, marginTop: spacing.lg, padding: spacing.s18, borderRadius: radius.r20 + 2 },
  ref: { marginTop: spacing.xs },
  listGap: { height: spacing.s18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.s14, borderRadius: radius.r17 + 1 },
  meRow: { borderWidth: 2 },
  rank: { width: RANK_W },
  meta: { marginTop: spacing.s2 },
  streak: { flexDirection: 'row', alignItems: 'center', gap: spacing.s5 },
  streakNum: { fontFamily: qmFont.serifMedium, fontSize: 19, lineHeight: 24 },
  sep: { height: spacing.sm },
  private: { marginTop: spacing.lg, marginHorizontal: spacing.s6 },
  footer: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  find: { height: FIND_H, borderRadius: radius.r17 + 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
});
