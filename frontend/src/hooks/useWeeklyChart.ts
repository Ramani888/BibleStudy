import { useState } from 'react';
import Toast from 'react-native-toast-message';
import { useCreditBalance, useCreditStats } from './useCredits';
import type { CreditStatsPeriod, CreditInterval } from './useCredits';

export type { CreditStatsPeriod, CreditInterval };

const MAX_CUSTOM_DAYS = 90;

function fmtDate(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function getAvailableIntervals(
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

export function getDefaultInterval(
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

export function emptyMsgFor(period: CreditStatsPeriod): string {
  if (period === 'today')  return 'No activity today';
  if (period === 'custom') return 'No activity in selected range';
  if (period === 'week')   return 'No activity this week';
  if (period === 'month')  return 'No activity this month';
  return 'No activity this year';
}

export function useWeeklyChart(defaultPeriod: CreditStatsPeriod = 'week') {
  const [chartType,      setChartType]      = useState<'bar' | 'line' | 'donut' | 'balance'>('bar');
  const [period,         setPeriod]         = useState<CreditStatsPeriod>(defaultPeriod);
  const [selectedIdx,    setSelectedIdx]    = useState<number | null>(null);
  const [prevPeriod,     setPrevPeriod]     = useState<CreditStatsPeriod>(defaultPeriod);
  const [chartInterval,  setChartInterval]  = useState<CreditInterval>('day');
  const [customFrom,     setCustomFrom]     = useState<Date | null>(null);
  const [customTo,       setCustomTo]       = useState<Date | null>(null);
  const [prevCustomFrom, setPrevCustomFrom] = useState<Date | null>(null);
  const [prevCustomTo,   setPrevCustomTo]   = useState<Date | null>(null);
  const [pickingFrom,    setPickingFrom]    = useState(false);
  const [pickingTo,      setPickingTo]      = useState(false);
  const [fullscreen,     setFullscreen]     = useState(false);

  const { data: stats, isLoading } = useCreditStats(
    period, customFrom ?? undefined, customTo ?? undefined, chartInterval,
  );
  const { data: balanceData } = useCreditBalance();

  const safeStats   = stats ?? [];
  const currentBal  = balanceData?.balance ?? 0;
  const emptyMsg    = emptyMsgFor(period);
  const totalEarned = safeStats.reduce((s, d) => s + d.earned, 0);
  const totalUsed   = safeStats.reduce((s, d) => s + d.used,   0);
  const net         = totalEarned - totalUsed;
  const hasSummary  = !isLoading && (totalEarned > 0 || totalUsed > 0);
  const customLabel = customFrom && customTo
    ? `${fmtDate(customFrom)}–${fmtDate(customTo)}`
    : null;

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

  const handleIntervalChange = (iv: CreditInterval) => {
    setChartInterval(iv);
    setSelectedIdx(null);
    if ((iv === '1h' || iv === '2h') && chartType === 'bar') setChartType('line');
  };

  return {
    chartType, setChartType,
    period,
    selectedIdx, setSelectedIdx,
    chartInterval,
    customFrom, customTo,
    pickingFrom, pickingTo,
    fullscreen, setFullscreen,
    safeStats, currentBal, isLoading,
    emptyMsg, totalEarned, totalUsed, net, hasSummary, customLabel,
    handlePeriod, openCustomPicker,
    handleFromConfirm, handleToConfirm, handlePickerCancel, handleIntervalChange,
  };
}
