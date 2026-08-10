import React, { useMemo } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import type { ProfileScreenProps } from '../../navigation/types';
import type { LeaderboardEntry } from '../../types/friends.types';
import { type Theme, useTheme } from '../../theme';
import { Avatar } from '../../components/ui/Avatar';
import { Typography } from '../../components/ui/Typography';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ErrorState } from '../../components/feedback/ErrorState';
import { FlameIcon, TrophyIcon } from '../../components/icons';
import { useLeaderboard } from '../../hooks';

const MEDALS = ['🥇', '🥈', '🥉'];

const QUOTES: { maxRank: number; text: string; sub: string }[] = [
  { maxRank: 1,        text: "You're leading the way — keep that flame alive! 🔥",  sub: 'The crown is yours. Protect it.' },
  { maxRank: 3,        text: 'So close to the top — one faithful day can do it.',    sub: 'Push through, the finish is near.' },
  { maxRank: 10,       text: 'Consistency is your superpower. Keep showing up.',     sub: 'Small steps build mighty habits.' },
  { maxRank: Infinity, text: 'Every great journey begins with a single step.',       sub: "Today's streak is tomorrow's legacy." },
];

function getQuote(rank: number) {
  if (rank === 0) return { text: 'Every great journey begins with a single step.', sub: 'Start your streak today.' };
  return QUOTES.find(q => rank <= q.maxRank) ?? QUOTES[QUOTES.length - 1];
}

export function LeaderboardScreen({ navigation }: ProfileScreenProps<'Leaderboard'>) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { data: rows = [], isFetching, error, refetch } = useLeaderboard();

  const myRank = rows.findIndex(r => r.isMe) + 1;
  const quote = getQuote(myRank);

  const renderItem = ({ item, index }: { item: LeaderboardEntry; index: number }) => (
    <View style={[styles.row, item.isMe && styles.rowMe]}>
      <View style={styles.rank}>
        <Typography preset="label" color={index < 3 ? colors.textPrimary : colors.textSecondary}>
          {MEDALS[index] ?? index + 1}
        </Typography>
      </View>
      <Avatar uri={item.profileImage} name={item.name ?? ''} size="sm" />
      <View style={styles.info}>
        <Typography preset="label" numberOfLines={1}>
          {item.name}{item.isMe ? ' (you)' : ''}
        </Typography>
        <Typography preset="caption" color={colors.textSecondary}>
          Best {item.longestStreak} · {item.achievements} achievement{item.achievements === 1 ? '' : 's'}
        </Typography>
      </View>
      <View style={styles.streak}>
        <FlameIcon size={16} color={colors.warning} />
        <Typography preset="h4" color={colors.warning}>{item.streak}</Typography>
      </View>
    </View>
  );

  if (error) return <ErrorState message="Could not load leaderboard" onRetry={refetch} />;

  return (
    <Screen header={<ScreenHeader title="Leaderboard" onBack={() => navigation.goBack()} />}>
      <View style={{ flex: 1 }}>
      <FlatList
        data={rows}
        keyExtractor={item => item.userId}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
        ListHeaderComponent={
          <View style={styles.quoteCard}>
            <Typography preset="verse" color={colors.textOnPrimary} style={[styles.quoteMark, styles.quoteTopLeft]}>"</Typography>
            <Typography preset="verse" color={colors.textOnPrimary} style={[styles.quoteMark, styles.quoteBottomRight]}>"</Typography>
            <Typography preset="verse" color={colors.textOnPrimary} style={styles.quoteText}>{quote.text}</Typography>
            <Typography preset="label" color={colors.textOnPrimaryMuted} style={styles.quoteSub}>{quote.sub}</Typography>
          </View>
        }
        ListEmptyComponent={
          !isFetching ? (
            <EmptyState
              icon={<TrophyIcon size={48} color={colors.textDisabled} />}
              title="No one to rank yet"
              subtitle="Add friends to compete on study streaks."
              ctaLabel="Find Friends"
              onCta={() => navigation.navigate('SearchUsers')}
            />
          ) : null
        }
      />
      </View>
    </Screen>
  );
}

const makeStyles = ({ colors, spacing, layout }: Theme) => StyleSheet.create({
  list: { padding: layout.screenPaddingH, gap: spacing[2], flexGrow: 1 },
  quoteCard: {
    backgroundColor: colors.primary,
    borderRadius: layout.cardRadiusLg,
    minHeight: 190,
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[7],
    justifyContent: 'center',
    gap: spacing[3],
    overflow: 'hidden',
    marginBottom: spacing[4],
  },
  quoteText: { fontStyle: 'italic', textAlign: 'center' },
  quoteSub: { textAlign: 'center' },
  quoteMark: { position: 'absolute', fontSize: 52, lineHeight: 56, opacity: 0.22 },
  quoteTopLeft: { top: spacing[2], left: spacing[4] },
  quoteBottomRight: { bottom: spacing[2], right: spacing[4] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[2.5],
    paddingHorizontal: spacing[3],
    borderRadius: layout.cardRadius,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowMe: { borderColor: colors.primary, backgroundColor: colors.primarySurface },
  rank: { width: 28, alignItems: 'center' },
  info: { flex: 1, gap: spacing[0.5] },
  streak: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
});
