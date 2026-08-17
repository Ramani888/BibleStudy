import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Card, Typography } from '../../../components/ui';
import { CARD_FILL_LIGHT, layout, radius, spacing, useTheme } from '../../../theme';
import type { DayStat } from '../../../hooks/useCredits';
import {
  useWeeklyChart,
  PERIOD_OPTIONS,
  type SimplePeriod,
  type CreditInterval,
} from '../../../hooks/useWeeklyChart';

type Colors = ReturnType<typeof useTheme>['colors'];

const HALF_H    = 100; // px per half above/below zero line
const BAR_R     = 3;   // bar corner radius

// ─── Helpers ──────────────────────────────────────────────────────────────────

function threeLabels(stats: DayStat[]): (string | null)[] {
  if (stats.length === 0) return [];
  const mid = Math.floor((stats.length - 1) / 2);
  return stats.map((d, i) =>
    (i === 0 || i === mid || i === stats.length - 1) ? d.label : null,
  );
}

// ─── PeriodTabs ───────────────────────────────────────────────────────────────

function PeriodTabs({ period, onChange, colors }: {
  period: SimplePeriod;
  onChange: (p: SimplePeriod) => void;
  colors: Colors;
}) {
  return (
    <View style={[s.segControl, { backgroundColor: colors.surfaceMuted }]}>
      {PERIOD_OPTIONS.map(o => {
        const active = o.key === period;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            style={({ pressed }) => [
              s.segTab,
              active && { backgroundColor: colors.accent },
              pressed && !active && s.segTabPressed,
            ]}
          >
            <Typography
              preset="caption"
              color={active ? '#fff' : colors.textSecondary}
              style={s.segLabel}
            >
              {o.label}
            </Typography>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── IntervalTabs ─────────────────────────────────────────────────────────────

function IntervalTabs({ options, selected, onChange, colors }: {
  options: { key: CreditInterval; label: string }[];
  selected: CreditInterval;
  onChange: (iv: CreditInterval) => void;
  colors: Colors;
}) {
  if (!options.length) return null;
  return (
    <View style={s.intervalRow}>
      {options.map((o, i) => {
        const active = o.key === selected;
        return (
          <React.Fragment key={o.key}>
            {i > 0 && (
              <Typography preset="caption" color={colors.textDisabled}>·</Typography>
            )}
            <Pressable onPress={() => onChange(o.key)} hitSlop={8}>
              <Typography
                preset="caption"
                color={active ? colors.accent : colors.textDisabled}
                style={active ? s.intervalActive : undefined}
              >
                {o.label}
              </Typography>
            </Pressable>
          </React.Fragment>
        );
      })}
    </View>
  );
}

// ─── DivergingBarChart ────────────────────────────────────────────────────────

function DivergingBarChart({ stats, selectedIdx, onSelect, colors }: {
  stats: DayStat[];
  selectedIdx: number | null;
  onSelect: (i: number | null) => void;
  colors: Colors;
}) {
  const hasData = stats.some(d => d.earned > 0 || d.used > 0);

  if (!hasData) {
    return (
      <View style={[s.centerBox, { height: HALF_H * 2 + 1 }]}>
        <Typography preset="caption" color={colors.textDisabled}>No activity</Typography>
      </View>
    );
  }

  const maxVal = Math.max(...stats.map(d => Math.max(d.earned, d.used)), 1);
  const labels = threeLabels(stats);
  const hasSel = selectedIdx !== null;

  return (
    <View>
      <View style={s.barsRow}>
        {stats.map((day, idx) => {
          const earnedH = day.earned > 0 ? Math.max((day.earned / maxVal) * HALF_H, 2) : 0;
          const usedH   = day.used   > 0 ? Math.max((day.used   / maxVal) * HALF_H, 2) : 0;
          const sel     = selectedIdx === idx;
          const dimmed  = hasSel && !sel;

          return (
            <Pressable
              key={idx}
              style={({ pressed }) => [s.barCol, pressed && { opacity: 0.6 }]}
              onPress={() => onSelect(sel ? null : idx)}
            >
              {/* Earned half — bar grows up from zero */}
              <View style={s.earnedHalf}>
                {earnedH > 0 && (
                  <View style={[
                    s.barTop,
                    { height: earnedH, backgroundColor: colors.success, opacity: dimmed ? 0.3 : 1 },
                  ]} />
                )}
              </View>

              {/* Zero line — accent when selected */}
              <View style={[s.zeroSeg, { backgroundColor: sel ? colors.accent : colors.border }]} />

              {/* Used half — bar grows down from zero */}
              <View style={s.usedHalf}>
                {usedH > 0 && (
                  <View style={[
                    s.barBottom,
                    { height: usedH, backgroundColor: colors.alert, opacity: dimmed ? 0.3 : 1 },
                  ]} />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* X-axis: first · mid · last only */}
      <View style={s.xAxis}>
        {labels
          .filter((l): l is string => l !== null)
          .map((label, i) => (
            <Typography key={i} preset="caption" color={colors.textDisabled} style={s.xLabel}>
              {label}
            </Typography>
          ))}
      </View>
    </View>
  );
}

// ─── DetailCard ───────────────────────────────────────────────────────────────

function DetailCard({ stat, colors }: { stat: DayStat; colors: Colors }) {
  const net = stat.earned - stat.used;
  return (
    <View style={[s.detailCard, { backgroundColor: colors.surfaceMuted }]}>
      <Typography preset="label" color={colors.textSecondary}>{stat.label}</Typography>
      <View style={[s.dot, { backgroundColor: colors.border }]} />
      <Typography preset="label" color={colors.success}>+{stat.earned}</Typography>
      <View style={[s.dot, { backgroundColor: colors.border }]} />
      <Typography preset="label" color={colors.alert}>−{stat.used}</Typography>
      <View style={[s.dot, { backgroundColor: colors.border }]} />
      <Typography preset="label" color={net >= 0 ? colors.success : colors.alert}>
        net {net >= 0 ? '+' : ''}{net}
      </Typography>
    </View>
  );
}

// ─── SummaryRow ───────────────────────────────────────────────────────────────

function SummaryRow({ totalEarned, totalUsed, net, colors }: {
  totalEarned: number; totalUsed: number; net: number; colors: Colors;
}) {
  return (
    <View style={[s.summaryRow, { borderTopColor: colors.border }]}>
      <View style={s.summaryItem}>
        <Typography preset="h4" color={colors.success}>+{totalEarned}</Typography>
        <Typography preset="caption" color={colors.textSecondary}>Earned</Typography>
      </View>
      <View style={[s.summaryDiv, { backgroundColor: colors.border }]} />
      <View style={s.summaryItem}>
        <Typography preset="h4" color={colors.alert}>−{totalUsed}</Typography>
        <Typography preset="caption" color={colors.textSecondary}>Used</Typography>
      </View>
      <View style={[s.summaryDiv, { backgroundColor: colors.border }]} />
      <View style={s.summaryItem}>
        <Typography preset="h4" color={net >= 0 ? colors.success : colors.alert}>
          {net >= 0 ? '+' : ''}{net}
        </Typography>
        <Typography preset="caption" color={colors.textSecondary}>Net</Typography>
      </View>
    </View>
  );
}

// ─── WeeklyChart ──────────────────────────────────────────────────────────────

export function WeeklyChart({ defaultPeriod = 'week' }: { defaultPeriod?: SimplePeriod }) {
  const theme = useTheme();
  const { colors } = theme;
  const isDark = theme.name === 'dark';

  const chart = useWeeklyChart(defaultPeriod);
  const selectedStat = chart.selectedIdx !== null ? chart.safeStats[chart.selectedIdx] : null;

  return (
    <>
      {/* Section title — standalone, above card */}
      <Typography preset="h4" style={s.sectionTitle}>Credit Activity</Typography>

      <Card style={{ ...s.card, backgroundColor: isDark ? colors.chipIdle : CARD_FILL_LIGHT }} shadow="sm">

        {/* Full-width period tabs at top of card */}
        <PeriodTabs
          period={chart.period}
          onChange={chart.handlePeriod}
          colors={colors}
        />

        {/* Legend + interval sub-tabs */}
        <View style={s.cardTop}>
          <View style={s.legend}>
            <View style={[s.legendDot, { backgroundColor: colors.success }]} />
            <Typography preset="caption" color={colors.textSecondary}>Earned</Typography>
            <View style={[s.legendDot, { backgroundColor: colors.alert }]} />
            <Typography preset="caption" color={colors.textSecondary}>Used</Typography>
          </View>
          <IntervalTabs
            options={chart.intervalOptions}
            selected={chart.chartInterval}
            onChange={chart.handleIntervalChange}
            colors={colors}
          />
        </View>

        {/* Chart body */}
        {chart.isLoading ? (
          <View style={[s.centerBox, { height: HALF_H * 2 + 1 }]}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : (
          <DivergingBarChart
            stats={chart.safeStats}
            selectedIdx={chart.selectedIdx}
            onSelect={chart.setSelectedIdx}
            colors={colors}
          />
        )}

        {/* Selected day detail */}
        {selectedStat && <DetailCard stat={selectedStat} colors={colors} />}

        {/* Period totals */}
        {chart.hasSummary && (
          <SummaryRow
            totalEarned={chart.totalEarned}
            totalUsed={chart.totalUsed}
            net={chart.net}
            colors={colors}
          />
        )}
      </Card>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  sectionTitle:  { marginBottom: spacing.md },
  card:          { gap: spacing.md },
  cardTop:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  legend:        { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendDot:     { width: 8, height: 8, borderRadius: 4 },
  centerBox:     { alignItems: 'center', justifyContent: 'center' },

  // Segmented period control
  segControl:    { flexDirection: 'row', borderRadius: radius.sm, padding: 3 },
  segTab:        { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radius.r6 },
  segTabPressed: { opacity: 0.6 },
  segLabel:      { fontSize: 11, fontWeight: '500' },

  // Interval text tabs
  intervalRow:   { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  intervalActive: { fontWeight: '600' },

  // Diverging bars
  barsRow:    { flexDirection: 'row', gap: 3 },
  barCol:     { flex: 1 },
  earnedHalf: { height: HALF_H, justifyContent: 'flex-end' },
  usedHalf:   { height: HALF_H, justifyContent: 'flex-start' },
  zeroSeg:    { height: 1 },
  barTop:     { width: '100%', borderTopLeftRadius: BAR_R, borderTopRightRadius: BAR_R },
  barBottom:  { width: '100%', borderBottomLeftRadius: BAR_R, borderBottomRightRadius: BAR_R },

  // X-axis
  xAxis:  { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  xLabel: { fontSize: 10 },

  // Detail card (selected bar)
  detailCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, paddingVertical: spacing.sm, borderRadius: radius.sm,
  },
  dot: { width: 3, height: 3, borderRadius: 2 },

  // Summary row
  summaryRow:  { flexDirection: 'row', borderTopWidth: 1, paddingTop: spacing.md },
  summaryItem: { flex: 1, alignItems: 'center', gap: spacing.s2 },
  summaryDiv:  { width: 1, marginVertical: spacing.xs },
});
