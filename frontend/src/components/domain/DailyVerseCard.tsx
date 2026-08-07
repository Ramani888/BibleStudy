import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { fontSizes, layout, spacing, Theme, useTheme } from '../../theme';
import { Typography } from '../ui/Typography';
import { Skeleton } from '../feedback/SkeletonLoader';
import type { DailyVerse } from '../../types';

interface DailyVerseCardProps {
  verse?: DailyVerse;
  loading?: boolean;
}

export function DailyVerseCard({ verse, loading }: DailyVerseCardProps) {
  const theme = useTheme();
  const { colors } = theme;
  const styles = useMemo(() => makeStyles(theme), [theme]);

  if (loading) {
    return (
      <View style={styles.card}>
        <Skeleton height={12} width="40%" borderRadius={6} />
        <View style={{ height: spacing[2.5] }} />
        <Skeleton height={16} width="100%" borderRadius={6} />
        <Skeleton height={16} width="85%" borderRadius={6} style={{ marginTop: spacing[1.5] }} />
        <Skeleton height={16} width="60%" borderRadius={6} style={{ marginTop: spacing[1.5] }} />
        <View style={{ height: spacing[3] }} />
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
        "{verse.text}"
      </Typography>

      <Typography preset="label" color={colors.primaryDark} style={styles.reference}>
        — {verse.reference}
      </Typography>

    </View>
  );
}

const makeStyles = ({ colors, spacing, layout }: Theme) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.primarySurface,
      borderRadius: layout.cardRadiusSm,
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
      borderRadius: spacing[0.5],
      backgroundColor: colors.primary,
    },
    label: {
      textTransform: 'uppercase',
      letterSpacing: 1,
      fontSize: fontSizes.xs,
    },
    verseText: {
      lineHeight: 26,
      fontStyle: 'italic',
    },
    reference: {
      fontSize: fontSizes.sm,
    },
  });
