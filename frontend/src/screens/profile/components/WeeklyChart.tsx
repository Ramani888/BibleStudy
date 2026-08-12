import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Polyline,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Card, Typography } from '../../../components/ui';
import {
  BarChartIcon,
  CalendarIcon,
  CloseIcon,
  ExpandIcon,
  PieChartIcon,
  TrendingUpIcon,
  type IconComponent,
} from '../../../components/icons';
import { CARD_FILL_LIGHT, layout, radius, spacing, useTheme } from '../../../theme';
import type { DayStat } from '../../../hooks/useCredits';
import {
  useWeeklyChart,
  getAvailableIntervals,
  emptyMsgFor,
} from '../../../hooks/useWeeklyChart';
import type { CreditStatsPeriod, CreditInterval } from '../../../hooks/useWeeklyChart';

// ─── Types & constants ────────────────────────────────────────────────────────

type ChartType = 'bar' | 'line' | 'donut' | 'balance';
type Colors = ReturnType<typeof useTheme>['colors'];

const CHART_ICONS: { key: ChartType; Icon: IconComponent }[] = [
  { key: 'bar',     Icon: BarChartIcon    },
  { key: 'line',    Icon: TrendingUpIcon  },
  { key: 'donut',   Icon: PieChartIcon    },
  { key: 'balance', Icon: BarChartIcon    },
];

const PERIOD_CHIPS: { key: CreditStatsPeriod; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: '7D'    },
  { key: 'month', label: '30D'   },
  { key: 'year',  label: '1Y'    },
];

const INTERVAL_LABELS: Record<CreditInterval, string> = {
  '1h': '1H', '2h': '2H', '6h': '6H',
  day: 'Day', week: 'Week', month: 'Month', quarter: 'Qtr',
};

const ICON_BTN_SIZE = 18;
const CHIP_ICON_SIZE = 13;
const MAX_BAR_H = 140;
const FS_BAR_H  = 260;
const FS_SVG_H  = 300;
const SVG_H     = 180;
const SVG_PAD   = 12;
const DONUT_SIZE = 200;

// ─── Shared ───────────────────────────────────────────────────────────────────

function EmptyView({ height = SVG_H, message = 'No activity', colors }: {
  height?: number; message?: string; colors: Colors;
}) {
  return (
    <View style={[s.centerBox, { height }]}>
      <Typography preset="caption" color={colors.textDisabled} style={s.emptyText}>
        {message}
      </Typography>
    </View>
  );
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────

function BarChartView({ stats, emptyMsg, maxBarH = MAX_BAR_H, selectedIdx, onSelect, colors }: {
  stats: DayStat[]; emptyMsg: string; maxBarH?: number;
  selectedIdx: number | null; onSelect: (i: number | null) => void;
  colors: Colors;
}) {
  const maxTotal = Math.max(...stats.map(d => d.earned + d.used), 1);
  const hasData  = stats.some(d => d.earned > 0 || d.used > 0);
  if (!hasData) return <EmptyView height={maxBarH + spacing.xxl} message={emptyMsg} colors={colors} />;

  return (
    <View style={s.barBars}>
      {stats.map((day, idx) => {
        const total    = day.earned + day.used;
        const barH     = (total / maxTotal) * maxBarH;
        const earnedH  = total > 0 ? (day.earned / total) * barH : 0;
        const usedH    = total > 0 ? (day.used   / total) * barH : 0;
        const selected = selectedIdx === idx;
        return (
          <Pressable key={idx} style={({ pressed }) => [s.barCol, pressed && s.barColPressed]} onPress={() => onSelect(selected ? null : idx)}>
            <View style={[s.barTrack, { height: maxBarH, backgroundColor: colors.surfaceMuted }, selected && { borderWidth: 1, borderColor: colors.accent }]}>
              {total > 0 && (
                <View style={[s.barStack, { height: barH }]}>
                  {usedH   > 0 && <View style={[s.barSeg, { height: usedH,   backgroundColor: colors.alert   }]} />}
                  {earnedH > 0 && <View style={[s.barSeg, { height: earnedH, backgroundColor: colors.success }]} />}
                </View>
              )}
            </View>
            <Typography preset="caption" color={selected ? colors.accent : colors.textDisabled}>{day.label}</Typography>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Line Chart ───────────────────────────────────────────────────────────────

function LineChartView({ stats, width, emptyMsg, svgH = SVG_H, selectedIdx, onSelect, colors }: {
  stats: DayStat[]; width: number; emptyMsg: string; svgH?: number;
  selectedIdx: number | null; onSelect: (i: number | null) => void;
  colors: Colors;
}) {
  const hasData = stats.some(d => d.earned > 0 || d.used > 0);
  if (!hasData) return <EmptyView height={svgH} message={emptyMsg} colors={colors} />;

  const maxVal = Math.max(...stats.map(d => Math.max(d.earned, d.used)), 1);
  const xStep  = (width - SVG_PAD * 2) / Math.max(stats.length - 1, 1);
  const chartH = svgH - SVG_PAD * 2;

  const pts = stats.map((d, i) => ({
    x:  SVG_PAD + i * xStep,
    ey: SVG_PAD + chartH - (d.earned / maxVal) * chartH,
    uy: SVG_PAD + chartH - (d.used   / maxVal) * chartH,
  }));

  const earnedPts = pts.map(p => `${p.x},${p.ey}`).join(' ');
  const usedPts   = pts.map(p => `${p.x},${p.uy}`).join(' ');

  return (
    <View>
      <Svg width={width} height={svgH}>
        <Polyline points={earnedPts} stroke={colors.success} strokeWidth={2} fill="none" strokeLinejoin="round" />
        <Polyline points={usedPts}   stroke={colors.alert}   strokeWidth={2} fill="none" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <React.Fragment key={i}>
            <Circle cx={p.x} cy={p.ey} r={selectedIdx === i ? 6 : 4} fill={colors.success} />
            <Circle cx={p.x} cy={p.uy} r={selectedIdx === i ? 6 : 4} fill={colors.alert}   />
            <Circle cx={p.x} cy={p.ey} r={14} fill="transparent" onPress={() => onSelect(selectedIdx === i ? null : i)} />
            <Circle cx={p.x} cy={p.uy} r={14} fill="transparent" onPress={() => onSelect(selectedIdx === i ? null : i)} />
          </React.Fragment>
        ))}
      </Svg>
      <View style={s.xLabels}>
        {stats.map((d, i) => (
          <Typography key={i} preset="caption" color={colors.textDisabled} style={s.xLabel}>{d.label}</Typography>
        ))}
      </View>
    </View>
  );
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────

function DonutChartView({ stats, size = DONUT_SIZE, colors }: {
  stats: DayStat[]; size?: number; colors: Colors;
}) {
  const totalEarned = stats.reduce((sum, d) => sum + d.earned, 0);
  const totalUsed   = stats.reduce((sum, d) => sum + d.used,   0);
  const total       = totalEarned + totalUsed;

  const r   = size * 0.344;
  const sw  = size * 0.113;
  const c   = 2 * Math.PI * r;
  const cx  = size / 2;
  const cy  = size / 2;

  const earnedDash = total > 0 ? (totalEarned / total) * c : 0;
  const usedDash   = total > 0 ? (totalUsed   / total) * c : 0;
  const earnedDeg  = total > 0 ? (totalEarned / total) * 360 : 0;

  const fSize   = Math.max(12, size * 0.088);
  const fSizeSm = Math.max(10, size * 0.075);

  return (
    <View style={s.donutWrap}>
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cy} r={r} stroke={colors.border} strokeWidth={sw} fill="none" />
        {earnedDash > 0 && (
          <Circle
            cx={cx} cy={cy} r={r}
            stroke={colors.success} strokeWidth={sw} fill="none"
            strokeDasharray={`${earnedDash} ${c}`}
            transform={`rotate(-90, ${cx}, ${cy})`}
            strokeLinecap="round"
          />
        )}
        {usedDash > 0 && (
          <Circle
            cx={cx} cy={cy} r={r}
            stroke={colors.alert} strokeWidth={sw} fill="none"
            strokeDasharray={`${usedDash} ${c}`}
            transform={`rotate(${earnedDeg - 90}, ${cx}, ${cy})`}
            strokeLinecap="round"
          />
        )}
        <SvgText x={cx} y={cy - size * 0.05} textAnchor="middle" fontSize={fSize} fontWeight="bold" fill={colors.textPrimary}>
          {total === 0 ? 'No data' : `${totalEarned} earned`}
        </SvgText>
        <SvgText x={cx} y={cy + size * 0.075} textAnchor="middle" fontSize={fSizeSm} fill={colors.textSecondary}>
          {total === 0 ? 'this period' : `${totalUsed} used`}
        </SvgText>
      </Svg>
    </View>
  );
}

// ─── Balance Chart ────────────────────────────────────────────────────────────

function BalanceChartView({ stats, currentBalance, width, svgH = SVG_H, emptyMsg, selectedIdx, onSelect, colors }: {
  stats: DayStat[]; currentBalance: number; width: number; svgH?: number; emptyMsg: string;
  selectedIdx: number | null; onSelect: (i: number | null) => void;
  colors: Colors;
}) {
  if (stats.length === 0) return <EmptyView height={svgH} message={emptyMsg} colors={colors} />;

  const netPerDay = stats.map(d => d.earned - d.used);
  const totalNet  = netPerDay.reduce((a, b) => a + b, 0);
  const startBal  = currentBalance - totalNet;

  const balances: number[] = [];
  netPerDay.forEach((net, i) => balances.push(i === 0 ? startBal + net : balances[i - 1] + net));

  const minBal = Math.min(...balances);
  const maxBal = Math.max(...balances);
  const range  = maxBal - minBal;
  const xStep  = (width - SVG_PAD * 2) / Math.max(balances.length - 1, 1);
  const chartH = svgH - SVG_PAD * 2;

  const yFor = (b: number) =>
    range === 0 ? SVG_PAD + chartH / 2 : SVG_PAD + chartH - ((b - minBal) / range) * chartH;

  const pts      = balances.map((b, i) => ({ x: SVG_PAD + i * xStep, y: yFor(b) }));
  const linePath = `M ${pts.map(p => `${p.x},${p.y}`).join(' L ')}`;
  const areaPath = `${linePath} L ${pts[pts.length - 1].x},${svgH} L ${pts[0].x},${svgH} Z`;

  return (
    <View>
      <Svg width={width} height={svgH}>
        <Defs>
          <LinearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.accent} stopOpacity={0.3} />
            <Stop offset="1" stopColor={colors.accent} stopOpacity={0.02} />
          </LinearGradient>
        </Defs>
        <Path d={areaPath} fill="url(#balGrad)" />
        <Path d={linePath} stroke={colors.accent} strokeWidth={2} fill="none" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <React.Fragment key={i}>
            <Circle cx={p.x} cy={p.y} r={selectedIdx === i ? 6 : 4} fill={colors.accent} />
            <Circle cx={p.x} cy={p.y} r={14} fill="transparent" onPress={() => onSelect(selectedIdx === i ? null : i)} />
          </React.Fragment>
        ))}
      </Svg>
      <View style={s.xLabels}>
        {stats.map((d, i) => (
          <Typography key={i} preset="caption" color={colors.textDisabled} style={s.xLabel}>{d.label}</Typography>
        ))}
      </View>
    </View>
  );
}

// ─── ChartBody ────────────────────────────────────────────────────────────────

function ChartBody({
  stats, chartType, currentBalance, emptyMsg, isLoading,
  isFullscreen = false, selectedIdx, onSelect, colors,
}: {
  stats: DayStat[]; chartType: ChartType; currentBalance: number; emptyMsg: string;
  isLoading: boolean; isFullscreen?: boolean;
  selectedIdx: number | null; onSelect: (i: number | null) => void;
  colors: Colors;
}) {
  const [width, setWidth] = useState(0);

  const effectiveBarH    = isFullscreen ? FS_BAR_H : MAX_BAR_H;
  const effectiveSvgH    = isFullscreen ? FS_SVG_H : SVG_H;
  const effectiveDonutSz = isFullscreen ? 260 : DONUT_SIZE;

  return (
    <View onLayout={e => setWidth(e.nativeEvent.layout.width)}>
      {isLoading ? (
        <View style={[s.centerBox, { height: effectiveSvgH }]}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : chartType === 'bar' ? (
        <BarChartView stats={stats} emptyMsg={emptyMsg} maxBarH={effectiveBarH} selectedIdx={selectedIdx} onSelect={onSelect} colors={colors} />
      ) : chartType === 'donut' ? (
        <DonutChartView stats={stats} size={effectiveDonutSz} colors={colors} />
      ) : width > 0 ? (
        chartType === 'line'
          ? <LineChartView stats={stats} width={width} emptyMsg={emptyMsg} svgH={effectiveSvgH} selectedIdx={selectedIdx} onSelect={onSelect} colors={colors} />
          : <BalanceChartView stats={stats} currentBalance={currentBalance} width={width} svgH={effectiveSvgH} emptyMsg={emptyMsg} selectedIdx={selectedIdx} onSelect={onSelect} colors={colors} />
      ) : (
        <View style={[s.centerBox, { height: effectiveSvgH }]}>
          <ActivityIndicator color={colors.accent} />
        </View>
      )}
    </View>
  );
}

// ─── Control sub-components ───────────────────────────────────────────────────

function ChartIconsBar({ chartType, colors, onChartType, onToggleFullscreen, isFullscreenMode }: {
  chartType: ChartType; colors: Colors;
  onChartType: (t: ChartType) => void;
  onToggleFullscreen: () => void;
  isFullscreenMode: boolean;
}) {
  return (
    <View style={s.headerRight}>
      {CHART_ICONS.map(({ key, Icon }) => (
        <Pressable
          key={key}
          style={({ pressed }) => [styles.iconBtn, chartType === key && { backgroundColor: colors.accentSoft }, pressed && styles.btnPressed]}
          onPress={() => onChartType(key)}
        >
          <Icon size={ICON_BTN_SIZE} color={chartType === key ? colors.accent : colors.textSecondary} />
        </Pressable>
      ))}
      <View style={[styles.iconDivider, { backgroundColor: colors.border }]} />
      <Pressable style={({ pressed }) => [styles.iconBtn, pressed && styles.btnPressed]} onPress={onToggleFullscreen}>
        {isFullscreenMode
          ? <CloseIcon  size={ICON_BTN_SIZE} color={colors.textSecondary} />
          : <ExpandIcon size={ICON_BTN_SIZE} color={colors.textSecondary} />
        }
      </Pressable>
    </View>
  );
}

function PeriodRow({ period, customLabel, colors, onPeriod, onOpenCustom }: {
  period: CreditStatsPeriod; customLabel: string | null; colors: Colors;
  onPeriod: (p: CreditStatsPeriod) => void;
  onOpenCustom: () => void;
}) {
  return (
    <View style={s.periodRow}>
      {PERIOD_CHIPS.map(({ key, label }) => (
        <Pressable
          key={key}
          style={({ pressed }) => [styles.chip, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }, period === key && { backgroundColor: colors.accent, borderColor: colors.accent }, pressed && styles.btnPressed]}
          onPress={() => onPeriod(key)}
        >
          <Typography preset="label" color={period === key ? colors.textOnAccent : colors.textSecondary}>
            {label}
          </Typography>
        </Pressable>
      ))}
      <Pressable
        style={({ pressed }) => [styles.chip, styles.chipCustom, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }, period === 'custom' && { backgroundColor: colors.accent, borderColor: colors.accent }, pressed && styles.btnPressed]}
        onPress={onOpenCustom}
      >
        <CalendarIcon size={CHIP_ICON_SIZE} color={period === 'custom' ? colors.textOnAccent : colors.textSecondary} />
        {customLabel && (
          <Typography preset="caption" color={period === 'custom' ? colors.textOnAccent : colors.textSecondary}>
            {customLabel}
          </Typography>
        )}
      </Pressable>
    </View>
  );
}

function IntervalRow({ period, customFrom, customTo, chartInterval, colors, onIntervalChange }: {
  period: CreditStatsPeriod; customFrom: Date | null; customTo: Date | null;
  chartInterval: CreditInterval; colors: Colors;
  onIntervalChange: (iv: CreditInterval) => void;
}) {
  const available = getAvailableIntervals(period, customFrom, customTo);
  if (available.length < 2) return null;
  return (
    <View style={s.periodRow}>
      {available.map(iv => (
        <Pressable
          key={iv}
          style={({ pressed }) => [styles.chip, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }, chartInterval === iv && { backgroundColor: colors.accent, borderColor: colors.accent }, pressed && styles.btnPressed]}
          onPress={() => onIntervalChange(iv)}
        >
          <Typography preset="label" color={chartInterval === iv ? colors.textOnAccent : colors.textSecondary}>
            {INTERVAL_LABELS[iv]}
          </Typography>
        </Pressable>
      ))}
    </View>
  );
}

function DetailStrip({ selectedIdx, stats, colors }: {
  selectedIdx: number | null; stats: DayStat[]; colors: Colors;
}) {
  const sel = selectedIdx !== null ? stats[selectedIdx] : null;
  if (!sel) return null;
  return (
    <View style={[styles.detailStrip, { backgroundColor: colors.surfaceMuted }]}>
      <Typography preset="label" color={colors.textSecondary}>{sel.label}</Typography>
      <View style={[styles.detailDot, { backgroundColor: colors.border }]} />
      <Typography preset="label" color={colors.success}>+{sel.earned} earned</Typography>
      <View style={[styles.detailDot, { backgroundColor: colors.border }]} />
      <Typography preset="label" color={colors.alert}>−{sel.used} used</Typography>
    </View>
  );
}

function SummaryRow({ hasSummary, totalEarned, totalUsed, net, colors }: {
  hasSummary: boolean; totalEarned: number; totalUsed: number; net: number; colors: Colors;
}) {
  if (!hasSummary) return null;
  return (
    <View style={[styles.summaryRow, { borderTopColor: colors.border }]}>
      <View style={s.summaryItem}>
        <Typography preset="h4" color={colors.success}>+{totalEarned}</Typography>
        <Typography preset="caption" color={colors.textSecondary}>Earned</Typography>
      </View>
      <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
      <View style={s.summaryItem}>
        <Typography preset="h4" color={colors.alert}>−{totalUsed}</Typography>
        <Typography preset="caption" color={colors.textSecondary}>Used</Typography>
      </View>
      <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
      <View style={s.summaryItem}>
        <Typography preset="h4" color={net >= 0 ? colors.success : colors.alert}>
          {net >= 0 ? '+' : ''}{net}
        </Typography>
        <Typography preset="caption" color={colors.textSecondary}>Net</Typography>
      </View>
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function WeeklyChart({ defaultPeriod = 'week' }: { defaultPeriod?: CreditStatsPeriod }) {
  const theme = useTheme();
  const { colors } = theme;
  const isDark = theme.name === 'dark';
  const insets = useSafeAreaInsets();

  const chart = useWeeklyChart(defaultPeriod);

  const sharedChartProps = {
    stats: chart.safeStats, chartType: chart.chartType, currentBalance: chart.currentBal,
    emptyMsg: chart.emptyMsg, isLoading: chart.isLoading,
    selectedIdx: chart.selectedIdx, onSelect: chart.setSelectedIdx, colors,
  };

  const controls = (isFullscreenMode: boolean) => (
    <ChartIconsBar
      chartType={chart.chartType}
      colors={colors}
      onChartType={t => { chart.setChartType(t); chart.setSelectedIdx(null); }}
      onToggleFullscreen={() => chart.setFullscreen(!chart.fullscreen)}
      isFullscreenMode={isFullscreenMode}
    />
  );

  const datePickers = (
    <>
      <DateTimePickerModal
        isVisible={chart.pickingFrom}
        mode="date"
        maximumDate={new Date()}
        onConfirm={chart.handleFromConfirm}
        onCancel={chart.handlePickerCancel}
      />
      <DateTimePickerModal
        isVisible={chart.pickingTo}
        mode="date"
        minimumDate={chart.customFrom ?? undefined}
        maximumDate={new Date()}
        onConfirm={chart.handleToConfirm}
        onCancel={chart.handlePickerCancel}
      />
    </>
  );

  return (
    <>
      <Card style={{ ...styles.card, backgroundColor: isDark ? colors.chipIdle : CARD_FILL_LIGHT }} shadow="sm">
        <View style={s.header}>
          <Typography preset="h4">Credit Activity</Typography>
          {controls(false)}
        </View>
        <PeriodRow period={chart.period} customLabel={chart.customLabel} colors={colors} onPeriod={chart.handlePeriod} onOpenCustom={chart.openCustomPicker} />
        <IntervalRow period={chart.period} customFrom={chart.customFrom} customTo={chart.customTo} chartInterval={chart.chartInterval} colors={colors} onIntervalChange={chart.handleIntervalChange} />
        <ChartBody {...sharedChartProps} />
        <DetailStrip selectedIdx={chart.selectedIdx} stats={chart.safeStats} colors={colors} />
        <SummaryRow hasSummary={chart.hasSummary} totalEarned={chart.totalEarned} totalUsed={chart.totalUsed} net={chart.net} colors={colors} />
      </Card>

      <Modal visible={chart.fullscreen} animationType="slide" onRequestClose={() => chart.setFullscreen(false)}>
        <View style={[styles.fsContainer, { backgroundColor: colors.background, paddingTop: insets.top + spacing.sm, paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
          <View style={s.header}>
            <Typography preset="h4">Credit Activity</Typography>
            {controls(true)}
          </View>
          <PeriodRow period={chart.period} customLabel={chart.customLabel} colors={colors} onPeriod={chart.handlePeriod} onOpenCustom={chart.openCustomPicker} />
          <IntervalRow period={chart.period} customFrom={chart.customFrom} customTo={chart.customTo} chartInterval={chart.chartInterval} colors={colors} onIntervalChange={chart.handleIntervalChange} />
          <ChartBody {...sharedChartProps} isFullscreen />
          <DetailStrip selectedIdx={chart.selectedIdx} stats={chart.safeStats} colors={colors} />
          <View style={s.fsSpacer} />
          <SummaryRow hasSummary={chart.hasSummary} totalEarned={chart.totalEarned} totalUsed={chart.totalUsed} net={chart.net} colors={colors} />
          {datePickers}
        </View>
      </Modal>

      {!chart.fullscreen && datePickers}
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerRight:   { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  periodRow:     { flexDirection: 'row', gap: spacing.s6, flexWrap: 'wrap' },
  centerBox:     { alignItems: 'center', justifyContent: 'center' },
  emptyText:     { textAlign: 'center' },
  barBars:       { flexDirection: 'row', gap: spacing.sm },
  barCol:        { flex: 1, alignItems: 'center', gap: spacing.xs },
  barTrack:      { width: '100%', borderRadius: spacing.xs, justifyContent: 'flex-end', overflow: 'hidden' }, // ponytail: r4 off-grid (no token), spacing.xs=4 as proxy
  barColPressed: { opacity: 0.85 },
  barStack:      { width: '100%' },
  barSeg:        { width: '100%' },
  donutWrap:     { alignItems: 'center' },
  xLabels:       { flexDirection: 'row', marginTop: spacing.xs },
  xLabel:        { flex: 1, textAlign: 'center' },
  summaryItem:   { flex: 1, alignItems: 'center', gap: spacing.s2 },
  fsSpacer:      { flex: 1 },
});

const styles = StyleSheet.create({
  card:           { gap: spacing.md },
  iconBtn:        { padding: spacing.s6, borderRadius: radius.r6 },
  iconDivider:    { width: 1, height: spacing.lg, marginHorizontal: spacing.xs },
  btnPressed:     { opacity: 0.85 },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.s6,
    borderRadius: layout.pillRadius,
    borderWidth: 1,
  },
  chipCustom:     { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  detailStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
    borderRadius: radius.sm,
  },
  detailDot:      { width: spacing.s3, height: spacing.s3, borderRadius: radius.r2 },
  summaryRow:     { flexDirection: 'row', borderTopWidth: 1, paddingTop: spacing.md, marginTop: spacing.xs },
  summaryDivider: { width: 1, marginVertical: spacing.xs },
  fsContainer:    { flex: 1, padding: spacing.lg, gap: spacing.md },
});
