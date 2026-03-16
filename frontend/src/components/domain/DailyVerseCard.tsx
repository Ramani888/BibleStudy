import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '../../theme';
import { Typography } from '../ui/Typography';
import { Skeleton } from '../feedback/SkeletonLoader';
import type { DailyVerse } from '../../types';

interface DailyVerseCardProps {
  verse?: DailyVerse;
  loading?: boolean;
}

export function DailyVerseCard({ verse, loading }: DailyVerseCardProps) {
  if (loading) {
    return (
      <View style={styles.card}>
        <Skeleton height={12} width="40%" borderRadius={6} />
        <View style={{ height: 10 }} />
        <Skeleton height={16} width="100%" borderRadius={6} />
        <Skeleton height={16} width="85%" borderRadius={6} style={{ marginTop: 6 }} />
        <Skeleton height={16} width="60%" borderRadius={6} style={{ marginTop: 6 }} />
        <View style={{ height: 12 }} />
        <Skeleton height={12} width="30%" borderRadius={6} />
      </View>
    );
  }

  if (!verse) return null;

  return (
    <View style={styles.card}>
      <View style={styles.labelRow}>
        <View style={styles.dot} />
        <Typography preset="label" color={colors.primaryDark} style={styles.label}>
          Verse of the Day
        </Typography>
      </View>

      <Typography preset="bodyLg" color={colors.textPrimary} style={styles.verseText}>
        "{verse.verse}"
      </Typography>

      <Typography preset="label" color={colors.primaryDark} style={styles.reference}>
        — {verse.reference}
      </Typography>

      {verse.reflection && (
        <View style={styles.reflectionWrap}>
          <Typography preset="bodySm" color={colors.textSecondary}>
            {verse.reflection}
          </Typography>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primarySurface,
    borderRadius: 20,
    padding: spacing[5],
    borderWidth: 1,
    borderColor: colors.primaryLight,
    gap: spacing[3],
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1.5],
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  label: {
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 11,
  },
  verseText: {
    lineHeight: 26,
    fontStyle: 'italic',
  },
  reference: {
    fontSize: 13,
  },
  reflectionWrap: {
    borderTopWidth: 1,
    borderTopColor: colors.primaryLight,
    paddingTop: spacing[3],
  },
});
