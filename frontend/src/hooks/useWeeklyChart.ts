import { useState } from 'react';
import { useCreditBalance, useCreditStats } from './useCredits';
import type { CreditInterval } from './useCredits';

export type { CreditInterval };
export type SimplePeriod = 'week' | 'month' | 'year';
export type IntervalOption = { key: CreditInterval; label: string };

const DEFAULT_INTERVAL: Record<SimplePeriod, CreditInterval> = {
  week:  'day',
  month: 'week',
  year:  'month',
};

const INTERVAL_OPTIONS: Record<SimplePeriod, IntervalOption[]> = {
  week:  [],
  month: [{ key: 'day', label: 'Daily' }, { key: 'week', label: 'Weekly' }],
  year:  [{ key: 'week', label: 'Weekly' }, { key: 'month', label: 'Monthly' }],
};

export const PERIOD_OPTIONS: { key: SimplePeriod; label: string }[] = [
  { key: 'week',  label: '7D'  },
  { key: 'month', label: '30D' },
  { key: 'year',  label: '1Y'  },
];

export function useWeeklyChart(defaultPeriod: SimplePeriod = 'week') {
  const [period,        setPeriod]        = useState<SimplePeriod>(defaultPeriod);
  const [chartInterval, setChartInterval] = useState<CreditInterval>(DEFAULT_INTERVAL[defaultPeriod]);
  const [selectedIdx,   setSelectedIdx]   = useState<number | null>(null);

  const { data: stats, isLoading } = useCreditStats(period, undefined, undefined, chartInterval);
  const { data: balanceData } = useCreditBalance();

  const safeStats   = stats ?? [];
  const currentBal  = balanceData?.balance ?? 0;
  const totalEarned = safeStats.reduce((s, d) => s + d.earned, 0);
  const totalUsed   = safeStats.reduce((s, d) => s + d.used,   0);
  const net         = totalEarned - totalUsed;
  const hasSummary  = !isLoading && (totalEarned > 0 || totalUsed > 0);
  const intervalOptions = INTERVAL_OPTIONS[period];

  const handlePeriod = (p: SimplePeriod) => {
    setPeriod(p);
    setChartInterval(DEFAULT_INTERVAL[p]);
    setSelectedIdx(null);
  };

  const handleIntervalChange = (iv: CreditInterval) => {
    setChartInterval(iv);
    setSelectedIdx(null);
  };

  return {
    period, handlePeriod,
    chartInterval, handleIntervalChange,
    intervalOptions,
    selectedIdx, setSelectedIdx,
    safeStats, currentBal, isLoading,
    totalEarned, totalUsed, net, hasSummary,
  };
}
