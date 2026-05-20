import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/Ionicons';
import { Card, Typography } from '../../../components/ui';
import { useCreditBalance, useCreditStats } from '../../../hooks';
import { colors, spacing } from '../../../theme';
import type { CreditStatsPeriod, CreditInterval, DayStat } from '../../../hooks/useCredits';

// ─── Types & constants ────────────────────────────────────────────────────────

type ChartType = 'bar' | 'line' | 'donut' | 'balance';

const CHART_ICONS: { key: ChartType; icon: string }[] = [
  { key: 'bar',     icon: 'bar-chart-outline'  },
  { key: 'line',    icon: 'trending-up-outline' },
  { key: 'donut',   icon: 'pie-chart-outline'   },
  { key: 'balance', icon: 'analytics-outline'   },
];

const PERIOD_CHIPS: { key: CreditStatsPeriod; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week',  label: '7D'    },
  { key: 'month', label: '30D'   },
  { key: 'year',  label: '1Y'    },
];

const MAX_CUSTOM_DAYS = 90;
const ICON_BTN_SIZE   = 18;
const CHIP_ICON_SIZE  = 13;
const MAX_BAR_H       = 140;
const SVG_H           = 180;
const SVG_PAD         = 12;
const DONUT_SIZE      = 200;

function fmtDate(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

const INTERVAL_LABELS: Record<CreditInterval, string> = {
  '1h': '1H', '2h': '2H', '6h': '6H',
  day: 'Day', week: 'Week', month: 'Month', quarter: 'Qtr',
};

function getAvailableIntervals(
  period: CreditStatsPeriod,
  customFrom: Date | null,
  customTo: Date | null,
): CreditInterval[] {
  switch (period) {
    case 'today': return ['6h', '2h', '1h'];
    case 'week':  return [];
    case 'month': return ['week', 'day'];
    case 'year':  return ['month', 'quarter'];
    case 'custom': {
      if (!customFrom || !customTo) return [];
      const sameDay =
        customFrom.getFullYear() === customTo.getFullYear() &&
        customFrom.getMonth()    === customTo.getMonth()    &&
        customFrom.getDate()     === customTo.getDate();
      if (sameDay) return ['6h', '2h', '1h'];
      const days = Math.ceil((customTo.getTime() - customFrom.getTime()) / 86400000);
      if (days <= 14) return [];
      return ['week', 'day'];
    }
    default: return [];
  }
}

function getDefaultInterval(
  period: CreditStatsPeriod,
  customFrom: Date | null,
  customTo: Date | null,
): CreditInterval {
  switch (period) {
    case 'today': return '6h';
    case 'week':  return 'day';
    case 'month': return 'week';
    case 'year':  return 'month';
    case 'custom': {
      if (!customFrom || !customTo) return 'day';
      const sameDay =
        customFrom.getFullYear() === customTo.getFullYear() &&
        customFrom.getMonth()    === customTo.getMonth()    &&
        customFrom.getDate()     === customTo.getDate();
      if (sameDay) return '6h';
      const days = Math.ceil((customTo.getTime() - customFrom.getTime()) / 86400000);
      if (days <= 14) return 'day';
      return 'week';
    }
    default: return 'day';
  }
}

function emptyMsgFor(period: CreditStatsPeriod): string {
  if (period === 'today')  return 'No activity today';
  if (period === 'custom') return 'No activity in selected range';
  if (period === 'week')   return 'No activity this week';
  if (period === 'month')  return 'No activity this month';
  return 'No activity this year';
}

// ─── Shared ───────────────────────────────────────────────────────────────────

function EmptyView({ height = SVG_H, message = 'No activity' }: { height?: number; message?: string }) {
  return (
    <View style={[s.centerBox, { height }]}>
      <Typography preset="bodySm" color={colors.textDisabled} style={s.emptyText}>
        {message}
      </Typography>
    </View>
  );
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────

function BarChartView({ stats, emptyMsg, maxBarH = MAX_BAR_H, selectedIdx, onSelect }: {
  stats: DayStat[]; emptyMsg: string; maxBarH?: number;
  selectedIdx: number | null; onSelect: (i: number | null) => void;
}) {
  const maxTotal = Math.max(...stats.map(d => d.earned + d.used), 1);
  const hasData  = stats.some(d => d.earned > 0 || d.used > 0);
  if (!hasData) return <EmptyView height={maxBarH + spacing[6]} message={emptyMsg} />;

  return (
    <View style={s.barBars}>
      {stats.map((day, idx) => {
        const total    = day.earned + day.used;
        const barH     = (total / maxTotal) * maxBarH;
        const earnedH  = total > 0 ? (day.earned / total) * barH : 0;
        const usedH    = total > 0 ? (day.used   / total) * barH : 0;
        const selected = selectedIdx === idx;
        return (
          <Pressable key={idx} style={s.barCol} onPress={() => onSelect(selected ? null : idx)}>
            <View style={[s.barTrack, { height: maxBarH }, selected && s.barTrackSelected]}>
              {total > 0 && (
                <View style={[s.barStack, { height: barH }]}>
                  {usedH   > 0 && <View style={[s.barSeg, { height: usedH,   backgroundColor: colors.error   }]} />}
                  {earnedH > 0 && <View style={[s.barSeg, { height: earnedH, backgroundColor: colors.success }]} />}
                </View>
              )}
            </View>
            <Typography preset="caption" color={selected ? colors.primary : colors.textDisabled}>{day.label}</Typography>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Line Chart ───────────────────────────────────────────────────────────────

function LineChartView({ stats, width, emptyMsg, svgH = SVG_H, selectedIdx, onSelect }: {
  stats: DayStat[]; width: number; emptyMsg: string; svgH?: number;
  selectedIdx: number | null; onSelect: (i: number | null) => void;
}) {
  const hasData = stats.some(d => d.earned > 0 || d.used > 0);
  if (!hasData) return <EmptyView height={svgH} message={emptyMsg} />;

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
        <Polyline points={usedPts}   stroke={colors.error}   strokeWidth={2} fill="none" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <React.Fragment key={i}>
            <Circle cx={p.x} cy={p.ey} r={selectedIdx === i ? 6 : 4} fill={colors.success} />
            <Circle cx={p.x} cy={p.uy} r={selectedIdx === i ? 6 : 4} fill={colors.error}   />
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

function DonutChartView({ stats, size = DONUT_SIZE }: { stats: DayStat[]; size?: number }) {
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

  const fSize  = Math.max(12, size * 0.088);
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
            stroke={colors.error} strokeWidth={sw} fill="none"
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

function BalanceChartView({ stats, currentBalance, width, svgH = SVG_H, emptyMsg, selectedIdx, onSelect }: {
  stats: DayStat[]; currentBalance: number; width: number; svgH?: number; emptyMsg: string;
  selectedIdx: number | null; onSelect: (i: number | null) => void;
}) {
  if (stats.length === 0) return <EmptyView height={svgH} message={emptyMsg} />;

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
            <Stop offset="0" stopColor={colors.primary} stopOpacity={0.3} />
            <Stop offset="1" stopColor={colors.primary} stopOpacity={0.02} />
          </LinearGradient>
        </Defs>
        <Path d={areaPath} fill="url(#balGrad)" />
        <Path d={linePath} stroke={colors.primary} strokeWidth={2} fill="none" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <React.Fragment key={i}>
            <Circle cx={p.x} cy={p.y} r={selectedIdx === i ? 6 : 4} fill={colors.primary} />
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

// ─── ChartBody (shared between card and fullscreen) ───────────────────────────

const LABEL_H = 24; // caption text row height

function ChartBody({
  stats,
  chartType,
  currentBalance,
  emptyMsg,
  isLoading,
  isFullscreen = false,
  selectedIdx,
  onSelect,
}: {
  stats: DayStat[];
  chartType: ChartType;
  currentBalance: number;
  emptyMsg: string;
  isLoading: boolean;
  isFullscreen?: boolean;
  selectedIdx: number | null;
  onSelect: (i: number | null) => void;
}) {
  const [width,  setWidth]  = useState(0);
  const [height, setHeight] = useState(0);

  const effectiveBarH    = isFullscreen && height > 0 ? height - LABEL_H - spacing[2] : MAX_BAR_H;
  const effectiveSvgH    = isFullscreen && height > 0 ? height - LABEL_H              : SVG_H;
  const effectiveDonutSz = isFullscreen && width > 0 && height > 0
    ? Math.min(Math.floor(Math.min(width, height) * 0.85), 320)
    : DONUT_SIZE;

  return (
    <View
      style={isFullscreen ? { flex: 1 } : undefined}
      onLayout={e => {
        setWidth(e.nativeEvent.layout.width);
        setHeight(e.nativeEvent.layout.height);
      }}
    >
      {isLoading ? (
        <View style={[s.centerBox, { height: effectiveSvgH }]}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : chartType === 'bar' ? (
        <BarChartView stats={stats} emptyMsg={emptyMsg} maxBarH={effectiveBarH} selectedIdx={selectedIdx} onSelect={onSelect} />
      ) : chartType === 'donut' ? (
        <DonutChartView stats={stats} size={effectiveDonutSz} />
      ) : width > 0 ? (
        chartType === 'line'
          ? <LineChartView stats={stats} width={width} emptyMsg={emptyMsg} svgH={effectiveSvgH} selectedIdx={selectedIdx} onSelect={onSelect} />
          : <BalanceChartView stats={stats} currentBalance={currentBalance} width={width} svgH={effectiveSvgH} emptyMsg={emptyMsg} selectedIdx={selectedIdx} onSelect={onSelect} />
      ) : (
        <View style={[s.centerBox, { height: effectiveSvgH }]}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function WeeklyChart() {
  const [chartType,       setChartType]       = useState<ChartType>('bar');
  const [period,          setPeriod]          = useState<CreditStatsPeriod>('week');
  const [selectedIdx,     setSelectedIdx]     = useState<number | null>(null);
  const [prevPeriod,      setPrevPeriod]      = useState<CreditStatsPeriod>('week');
  const [chartInterval,   setChartInterval]   = useState<CreditInterval>('day');
  const [customFrom,      setCustomFrom]      = useState<Date | null>(null);
  const [customTo,        setCustomTo]        = useState<Date | null>(null);
  const [prevCustomFrom,  setPrevCustomFrom]  = useState<Date | null>(null);
  const [prevCustomTo,    setPrevCustomTo]    = useState<Date | null>(null);
  const [pickingFrom,     setPickingFrom]     = useState(false);
  const [pickingTo,       setPickingTo]       = useState(false);
  const [fullscreen,      setFullscreen]      = useState(false);

  const { data: stats, isLoading } = useCreditStats(
    period,
    customFrom ?? undefined,
    customTo ?? undefined,
    chartInterval,
  );
  const { data: balanceData } = useCreditBalance();

  const safeStats     = stats ?? [];
  const currentBal    = balanceData?.balance ?? 0;
  const emptyMsg      = emptyMsgFor(period);
  const totalEarned   = safeStats.reduce((s, d) => s + d.earned, 0);
  const totalUsed     = safeStats.reduce((s, d) => s + d.used,   0);
  const net           = totalEarned - totalUsed;
  const hasSummary    = !isLoading && (totalEarned > 0 || totalUsed > 0);

  // ── Period handling ────────────────────────────────────────────────────────

  const handlePeriod = (p: CreditStatsPeriod) => {
    setPrevPeriod(period);
    setPeriod(p);
    setChartInterval(getDefaultInterval(p, null, null));
    setSelectedIdx(null);
    if (p !== 'custom') { setCustomFrom(null); setCustomTo(null); }
  };

  const openCustomPicker = () => {
    setPrevPeriod(period);
    setPrevCustomFrom(customFrom);
    setPrevCustomTo(customTo);
    setPeriod('custom');
    setCustomFrom(null);
    setCustomTo(null);
    setPickingFrom(true);
  };

  const handleFromConfirm = (date: Date) => {
    setCustomFrom(date);
    setPickingFrom(false);
    setPickingTo(true);
  };

  const handleToConfirm = (date: Date) => {
    setPickingTo(false);
    if (!customFrom) return;

    const diffDays = Math.ceil((date.getTime() - customFrom.getTime()) / (1000 * 60 * 60 * 24));

    if (date < customFrom) {
      Toast.show({ type: 'error', text1: 'End date must be after start date' });
      setPeriod(prevPeriod); setCustomFrom(null);
      return;
    }
    if (diffDays > MAX_CUSTOM_DAYS) {
      Toast.show({ type: 'error', text1: 'Max range is 90 days', text2: 'Please select a shorter range.' });
      setPeriod(prevPeriod); setCustomFrom(null);
      return;
    }
    setCustomTo(date);
    setChartInterval(getDefaultInterval('custom', customFrom, date));
    setSelectedIdx(null);
  };

  const handlePickerCancel = () => {
    setPickingFrom(false);
    setPickingTo(false);
    if (!customFrom || !customTo) {
      setPeriod(prevPeriod);
      setCustomFrom(prevCustomFrom);
      setCustomTo(prevCustomTo);
    }
  };

  // ── Sub-UI helpers ─────────────────────────────────────────────────────────

  const customLabel = customFrom && customTo
    ? `${fmtDate(customFrom)}–${fmtDate(customTo)}`
    : null;

  function renderChartIcons(closeIcon: boolean) {
    return (
      <View style={s.headerRight}>
        {CHART_ICONS.map(({ key, icon }) => (
          <Pressable
            key={key}
            style={[s.iconBtn, chartType === key && s.iconBtnActive]}
            onPress={() => { setChartType(key); setSelectedIdx(null); }}
          >
            <Icon
              name={icon}
              size={ICON_BTN_SIZE}
              color={chartType === key ? colors.primary : colors.textSecondary}
            />
          </Pressable>
        ))}
        <View style={s.iconDivider} />
        <Pressable
          style={s.iconBtn}
          onPress={closeIcon ? () => setFullscreen(false) : () => setFullscreen(true)}
        >
          <Icon
            name={closeIcon ? 'close-outline' : 'expand-outline'}
            size={ICON_BTN_SIZE}
            color={colors.textSecondary}
          />
        </Pressable>
      </View>
    );
  }

  function renderDetailStrip() {
    const sel = selectedIdx !== null ? safeStats[selectedIdx] : null;
    if (!sel) return null;
    return (
      <View style={s.detailStrip}>
        <Typography preset="label" color={colors.textSecondary}>{sel.label}</Typography>
        <View style={s.detailDot} />
        <Typography preset="label" color={colors.success}>+{sel.earned} earned</Typography>
        <View style={s.detailDot} />
        <Typography preset="label" color={colors.error}>−{sel.used} used</Typography>
      </View>
    );
  }

  const handleIntervalChange = (iv: CreditInterval) => {
    setChartInterval(iv);
    setSelectedIdx(null);
    if ((iv === '1h' || iv === '2h') && chartType === 'bar') {
      setChartType('line');
    }
  };

  function renderIntervalRow() {
    const available = getAvailableIntervals(period, customFrom, customTo);
    if (available.length < 2) return null;
    return (
      <View style={s.periodRow}>
        {available.map(iv => (
          <Pressable
            key={iv}
            style={[s.chip, chartInterval === iv && s.chipActive]}
            onPress={() => handleIntervalChange(iv)}
          >
            <Typography preset="label" color={chartInterval === iv ? colors.textOnPrimary : colors.textSecondary}>
              {INTERVAL_LABELS[iv]}
            </Typography>
          </Pressable>
        ))}
      </View>
    );
  }

  function renderPeriodRow() {
    return (
      <View style={s.periodRow}>
        {PERIOD_CHIPS.map(({ key, label }) => (
          <Pressable
            key={key}
            style={[s.chip, period === key && s.chipActive]}
            onPress={() => handlePeriod(key)}
          >
            <Typography preset="label" color={period === key ? colors.textOnPrimary : colors.textSecondary}>
              {label}
            </Typography>
          </Pressable>
        ))}
        <Pressable
          style={[s.chip, s.chipCustom, period === 'custom' && s.chipActive]}
          onPress={openCustomPicker}
        >
          <Icon
            name="calendar-outline"
            size={CHIP_ICON_SIZE}
            color={period === 'custom' ? colors.textOnPrimary : colors.textSecondary}
          />
          {customLabel && (
            <Typography preset="caption" color={period === 'custom' ? colors.textOnPrimary : colors.textSecondary}>
              {customLabel}
            </Typography>
          )}
        </Pressable>
      </View>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Card ── */}
      <Card style={s.card} shadow="sm">
        <View style={s.header}>
          <Typography preset="h4">Credit Activity</Typography>
          {renderChartIcons(false)}
        </View>
        {renderPeriodRow()}
        {renderIntervalRow()}
        <ChartBody
          stats={safeStats}
          chartType={chartType}
          currentBalance={currentBal}
          emptyMsg={emptyMsg}
          isLoading={isLoading}
          selectedIdx={selectedIdx}
          onSelect={setSelectedIdx}
        />
        {renderDetailStrip()}
        {hasSummary && (
          <View style={s.summaryRow}>
            <View style={s.summaryItem}>
              <Typography preset="h4" color={colors.success}>+{totalEarned}</Typography>
              <Typography preset="caption" color={colors.textSecondary}>Earned</Typography>
            </View>
            <View style={s.summaryDivider} />
            <View style={s.summaryItem}>
              <Typography preset="h4" color={colors.error}>−{totalUsed}</Typography>
              <Typography preset="caption" color={colors.textSecondary}>Used</Typography>
            </View>
            <View style={s.summaryDivider} />
            <View style={s.summaryItem}>
              <Typography preset="h4" color={net >= 0 ? colors.success : colors.error}>
                {net >= 0 ? '+' : ''}{net}
              </Typography>
              <Typography preset="caption" color={colors.textSecondary}>Net</Typography>
            </View>
          </View>
        )}
      </Card>

      {/* ── Fullscreen modal ── */}
      <Modal
        visible={fullscreen}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setFullscreen(false)}
      >
        <SafeAreaView style={s.fsContainer}>
          <View style={s.header}>
            <Typography preset="h4">Credit Activity</Typography>
            {renderChartIcons(true)}
          </View>
          {renderPeriodRow()}
          {renderIntervalRow()}
          <View style={s.fsChartArea}>
            <ChartBody
              stats={safeStats}
              chartType={chartType}
              currentBalance={currentBal}
              emptyMsg={emptyMsg}
              isLoading={isLoading}
              isFullscreen
              selectedIdx={selectedIdx}
              onSelect={setSelectedIdx}
            />
          </View>
          {renderDetailStrip()}
          {hasSummary && (
            <View style={s.summaryRow}>
              <View style={s.summaryItem}>
                <Typography preset="h4" color={colors.success}>+{totalEarned}</Typography>
                <Typography preset="caption" color={colors.textSecondary}>Earned</Typography>
              </View>
              <View style={s.summaryDivider} />
              <View style={s.summaryItem}>
                <Typography preset="h4" color={colors.error}>−{totalUsed}</Typography>
                <Typography preset="caption" color={colors.textSecondary}>Used</Typography>
              </View>
              <View style={s.summaryDivider} />
              <View style={s.summaryItem}>
                <Typography preset="h4" color={net >= 0 ? colors.success : colors.error}>
                  {net >= 0 ? '+' : ''}{net}
                </Typography>
                <Typography preset="caption" color={colors.textSecondary}>Net</Typography>
              </View>
            </View>
          )}
          {/* Date pickers rendered inside fullscreen modal to avoid iOS modal stacking crash */}
          <DateTimePickerModal
            isVisible={pickingFrom}
            mode="date"
            maximumDate={new Date()}
            onConfirm={handleFromConfirm}
            onCancel={handlePickerCancel}
          />
          <DateTimePickerModal
            isVisible={pickingTo}
            mode="date"
            minimumDate={customFrom ?? undefined}
            maximumDate={new Date()}
            onConfirm={handleToConfirm}
            onCancel={handlePickerCancel}
          />
        </SafeAreaView>
      </Modal>

      {/* ── Date pickers for non-fullscreen context ── */}
      {!fullscreen && (
        <>
          <DateTimePickerModal
            isVisible={pickingFrom}
            mode="date"
            maximumDate={new Date()}
            onConfirm={handleFromConfirm}
            onCancel={handlePickerCancel}
          />
          <DateTimePickerModal
            isVisible={pickingTo}
            mode="date"
            minimumDate={customFrom ?? undefined}
            maximumDate={new Date()}
            onConfirm={handleToConfirm}
            onCancel={handlePickerCancel}
          />
        </>
      )}
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  card: { backgroundColor: colors.background, gap: spacing[3] },

  // Header
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerRight:   { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
  iconBtn:       { padding: spacing[1.5], borderRadius: 6 },
  iconBtnActive: { backgroundColor: colors.primarySurface },
  iconDivider:   { width: 1, height: 16, backgroundColor: colors.border, marginHorizontal: spacing[1] },

  // Period row
  periodRow:  { flexDirection: 'row', gap: spacing[1.5], flexWrap: 'wrap' },
  chip:       {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1.5],
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipCustom: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },

  // Shared
  centerBox: { alignItems: 'center', justifyContent: 'center' },
  emptyText: { textAlign: 'center' },

  // Bar
  barBars:  { flexDirection: 'row', gap: spacing[2] },
  barCol:   { flex: 1, alignItems: 'center', gap: spacing[1] },
  barTrack: {
    width: '100%',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barStack:        { width: '100%' },
  barSeg:          { width: '100%' },
  barTrackSelected: { borderWidth: 1, borderColor: colors.primary },

  // Detail strip
  detailStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
    marginTop: spacing[2],
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
  },
  detailDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.border },

  // Summary row
  summaryRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing[3],
    marginTop: spacing[1],
  },
  summaryItem:    { flex: 1, alignItems: 'center', gap: spacing[0.5] },
  summaryDivider: { width: 1, backgroundColor: colors.border, marginVertical: spacing[1] },

  // Donut
  donutWrap: { alignItems: 'center' },

  // X-axis labels (line + balance)
  xLabels: { flexDirection: 'row', marginTop: spacing[1] },
  xLabel:  { flex: 1, textAlign: 'center' },

  // Fullscreen
  fsContainer: { flex: 1, backgroundColor: colors.background, padding: spacing[4], gap: spacing[3] },
  fsChartArea: { flex: 1, justifyContent: 'center' },
});
