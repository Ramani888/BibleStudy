import { prisma } from '../../config/db';
import { NotFoundError, ConflictError } from '../../utils/errors';

// ─── Stats ────────────────────────────────────────────────────────────────────

export type StatPeriod   = 'today' | 'week' | 'month' | 'year' | 'custom';
export type StatInterval = '1h' | '2h' | '6h' | 'day' | 'week' | 'month' | 'quarter';

interface StatPoint { label: string; earned: number; used: number; }
type TxRow = { type: string; amount: number; createdAt: Date };

const DAY_LABELS   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function agg(label: string, txs: TxRow[]): StatPoint {
  return {
    label,
    earned: txs.filter(t => t.type === 'REWARD').reduce((s, t) => s + t.amount, 0),
    used:   txs.filter(t => t.type === 'USAGE').reduce((s, t) => s + Math.abs(t.amount), 0),
  };
}

function hourLabel(h: number): string {
  if (h === 0)  return '12am';
  if (h < 12)   return `${h}am`;
  if (h === 12) return '12pm';
  return `${h - 12}pm`;
}

function groupByHours(txs: TxRow[], step: number, dayStart: Date): StatPoint[] {
  const dayTxs = txs.filter(t => {
    const d = t.createdAt;
    return d.getFullYear() === dayStart.getFullYear() &&
           d.getMonth()    === dayStart.getMonth()    &&
           d.getDate()     === dayStart.getDate();
  });
  return Array.from({ length: 24 / step }, (_, i) => {
    const from = i * step;
    const to   = from + step;
    return agg(hourLabel(from), dayTxs.filter(t => { const h = t.createdAt.getHours(); return h >= from && h < to; }));
  });
}

function groupByDays(txs: TxRow[], start: Date, end: Date): StatPoint[] {
  const diffDays = Math.ceil((end.getTime() - start.getTime()) / 86400000);
  const useWeekday = diffDays <= 7;
  const result: StatPoint[] = [];
  const cur = new Date(start); cur.setHours(0, 0, 0, 0);
  while (cur <= end) {
    const dayEnd = new Date(cur); dayEnd.setHours(23, 59, 59, 999);
    const label  = useWeekday ? DAY_LABELS[cur.getDay()] : `${cur.getMonth() + 1}/${cur.getDate()}`;
    result.push(agg(label, txs.filter(t => t.createdAt >= cur && t.createdAt <= dayEnd)));
    cur.setDate(cur.getDate() + 1);
  }
  return result;
}

function groupByWeeks(txs: TxRow[], start: Date, end: Date): StatPoint[] {
  const result: StatPoint[] = [];
  const cur = new Date(start); cur.setHours(0, 0, 0, 0);
  let i = 1;
  while (cur <= end) {
    const wEnd = new Date(cur); wEnd.setDate(cur.getDate() + 6); wEnd.setHours(23, 59, 59, 999);
    if (wEnd > end) wEnd.setTime(end.getTime());
    result.push(agg(`Wk${i}`, txs.filter(t => t.createdAt >= cur && t.createdAt <= wEnd)));
    cur.setDate(cur.getDate() + 7);
    i++;
  }
  return result;
}

function groupByMonths(txs: TxRow[], start: Date, end: Date): StatPoint[] {
  const result: StatPoint[] = [];
  let cur = new Date(start.getFullYear(), start.getMonth(), 1);
  while (cur <= end) {
    const mEnd = new Date(cur.getFullYear(), cur.getMonth() + 1, 0); mEnd.setHours(23, 59, 59, 999);
    result.push(agg(MONTH_LABELS[cur.getMonth()], txs.filter(t => t.createdAt >= cur && t.createdAt <= mEnd)));
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
  }
  return result;
}

function groupByQuarters(txs: TxRow[], start: Date, end: Date): StatPoint[] {
  const result: StatPoint[] = [];
  const startQMonth = Math.floor(start.getMonth() / 3) * 3;
  let cur = new Date(start.getFullYear(), startQMonth, 1);
  while (cur <= end) {
    const qEnd = new Date(cur.getFullYear(), cur.getMonth() + 3, 0); qEnd.setHours(23, 59, 59, 999);
    if (qEnd > end) qEnd.setTime(end.getTime());
    const q = Math.floor(cur.getMonth() / 3) + 1;
    result.push(agg(`Q${q}`, txs.filter(t => t.createdAt >= cur && t.createdAt <= qEnd)));
    cur = new Date(cur.getFullYear(), cur.getMonth() + 3, 1);
  }
  return result;
}

function resolveInterval(period: StatPeriod, start: Date, end: Date, interval?: StatInterval): StatInterval {
  if (interval) return interval;
  switch (period) {
    case 'today':  return '6h';
    case 'week':   return 'day';
    case 'month':  return 'week';
    case 'year':   return 'month';
    case 'custom': {
      const days = Math.ceil((end.getTime() - start.getTime()) / 86400000);
      if (days <= 1)  return '6h';
      if (days <= 14) return 'day';
      return 'week';
    }
    default: return 'day';
  }
}

export async function getStats(
  userId: string,
  period: StatPeriod,
  fromDate?: Date,
  toDate?: Date,
  interval?: StatInterval,
): Promise<StatPoint[]> {
  const now = new Date();
  let start: Date;
  let end: Date = now;

  switch (period) {
    case 'today':
      start = new Date(now); start.setHours(0, 0, 0, 0); break;
    case 'week':
      start = new Date(now); start.setDate(now.getDate() - 6); start.setHours(0, 0, 0, 0); break;
    case 'month':
      start = new Date(now); start.setDate(now.getDate() - 27); start.setHours(0, 0, 0, 0); break;
    case 'year':
      start = new Date(now.getFullYear(), now.getMonth() - 11, 1); break;
    case 'custom':
      start = new Date(fromDate!); start.setHours(0, 0, 0, 0);
      end   = new Date(toDate!);   end.setHours(23, 59, 59, 999);
      break;
    default:
      start = new Date(now); start.setDate(now.getDate() - 6); start.setHours(0, 0, 0, 0);
  }

  const iv = resolveInterval(period, start, end, interval);

  const txs = await prisma.creditTransaction.findMany({
    where: { userId, type: { in: ['REWARD', 'USAGE'] }, createdAt: { gte: start, lte: end } },
    select: { type: true, amount: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  switch (iv) {
    case '1h':      return groupByHours(txs, 1, start);
    case '2h':      return groupByHours(txs, 2, start);
    case '6h':      return groupByHours(txs, 6, start);
    case 'day':     return groupByDays(txs, start, end);
    case 'week':    return groupByWeeks(txs, start, end);
    case 'month':   return groupByMonths(txs, start, end);
    case 'quarter': return groupByQuarters(txs, start, end);
    default:        return groupByDays(txs, start, end);
  }
}

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function getStreak(userId: string): Promise<{ streak: number; longestStreak: number }> {
  const rewards = await prisma.creditTransaction.findMany({
    where: { userId, type: 'REWARD' },
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  if (rewards.length === 0) return { streak: 0, longestStreak: 0 };

  const days = new Set<string>(rewards.map(r => toLocalDateStr(r.createdAt)));

  // Current streak: count consecutive days from today backwards
  let streak = 0;
  const cur = new Date();
  while (days.has(toLocalDateStr(cur))) {
    streak++;
    cur.setDate(cur.getDate() - 1);
  }

  // Longest streak across all history
  const sorted = Array.from(days).sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const next = new Date(sorted[i]);
    if ((next.getTime() - prev.getTime()) / 86400000 === 1) {
      run++;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }

  return { streak, longestStreak: Math.max(streak, longest) };
}

export async function getBalance(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { creditBalance: true },
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return { balance: user.creditBalance };
}

export async function getTransactions(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    prisma.creditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.creditTransaction.count({ where: { userId } }),
  ]);

  return {
    transactions,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}

export async function claimDailyLogin(userId: string) {
  // Check if user already claimed today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const rewardToday = await prisma.creditTransaction.findFirst({
    where: {
      userId,
      type: 'REWARD',
      createdAt: {
        gte: todayStart,
        lte: todayEnd,
      },
    },
  });

  if (rewardToday) {
    throw new ConflictError('Daily login reward already claimed today');
  }

  const [updatedUser, transaction] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { creditBalance: { increment: 1 } },
      select: { creditBalance: true },
    }),
    prisma.creditTransaction.create({
      data: {
        userId,
        type: 'REWARD',
        amount: 1,
        description: 'Daily login reward',
      },
    }),
  ]);

  return {
    balance: updatedUser.creditBalance,
    transaction,
    message: 'Daily login reward claimed! +1 credit',
  };
}
