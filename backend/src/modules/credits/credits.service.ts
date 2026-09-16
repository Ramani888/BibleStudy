import { prisma } from '../../config/db';
import { NotFoundError, ConflictError, ValidationError } from '../../utils/errors';
import { triggerAchievementCheck } from '../../utils/achievementCheck';
import { getEffectivePlan } from '../subscriptions/subscriptions.service';

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

const MAX_STREAK_FREEZES = 2;

export async function getStreak(userId: string): Promise<{ streak: number; longestStreak: number; freezes: number }> {
  const [rewards, freezeLogs, user] = await Promise.all([
    prisma.creditTransaction.findMany({ where: { userId, type: 'REWARD' }, select: { createdAt: true }, orderBy: { createdAt: 'asc' } }),
    prisma.streakFreezeLog.findMany({ where: { userId }, select: { date: true } }),
    prisma.user.findUnique({ where: { id: userId }, select: { streakFreezes: true } }),
  ]);
  const freezes = user?.streakFreezes ?? 0;

  if (rewards.length === 0 && freezeLogs.length === 0) return { streak: 0, longestStreak: 0, freezes };

  // Freeze-covered days count as present, so a bridged miss doesn't break the run.
  const days = new Set<string>(rewards.map(r => toLocalDateStr(r.createdAt)));
  for (const f of freezeLogs) days.add(f.date);

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

  return { streak, longestStreak: Math.max(streak, longest), freezes };
}

/**
 * Streak-freeze maintenance, run once per day after the daily claim:
 *  1) bridge the gap between today and the last present day (if coverable by
 *     available freezes) so a missed login doesn't break the streak,
 *  2) grant 1 freeze per new 7-day milestone (capped at MAX),
 *  3) premium users are auto-refilled to MAX.
 * Idempotent within a day: freeze logs are unique per (user, date).
 */
export async function maintainStreakFreezes(userId: string): Promise<void> {
  const [user, rewards, freezeLogs] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { streakFreezes: true, streakFreezeMilestone: true } }),
    prisma.creditTransaction.findMany({ where: { userId, type: 'REWARD' }, select: { createdAt: true } }),
    prisma.streakFreezeLog.findMany({ where: { userId }, select: { date: true } }),
  ]);
  if (!user) return;

  const days = new Set<string>(rewards.map(r => toLocalDateStr(r.createdAt)));
  const freezeDates = new Set<string>(freezeLogs.map(f => f.date));
  const present = (d: Date) => { const s = toLocalDateStr(d); return days.has(s) || freezeDates.has(s); };

  let freezes = user.streakFreezes;
  let milestone = user.streakFreezeMilestone;
  const today = new Date(); today.setHours(0, 0, 0, 0);

  // 1) Bridge consecutive missed days between today and the previous present day.
  const missed: Date[] = [];
  const c = new Date(today); c.setDate(c.getDate() - 1);
  while (!present(c) && missed.length <= MAX_STREAK_FREEZES) { missed.push(new Date(c)); c.setDate(c.getDate() - 1); }
  const priorPresent = present(c); // the day just before the missed run
  if (missed.length > 0 && priorPresent && missed.length <= freezes) {
    for (const d of missed) {
      const s = toLocalDateStr(d);
      await prisma.streakFreezeLog.create({ data: { userId, date: s } }).catch(() => {}); // unique guard
      freezeDates.add(s);
    }
    freezes -= missed.length;
  }

  // 2) Recompute streak (freeze days count) and grant milestone freezes.
  let streak = 0; const cur = new Date(today);
  while (present(cur)) { streak++; cur.setDate(cur.getDate() - 1); }
  if (streak >= milestone + 7) {
    const newMilestone = Math.floor(streak / 7) * 7;
    freezes = Math.min(MAX_STREAK_FREEZES, freezes + Math.floor((newMilestone - milestone) / 7));
    milestone = newMilestone;
  }

  // 3) Premium auto-refill (SUB-5: expiry-aware — a naturally-lapsed sub reads as FREE).
  if ((await getEffectivePlan(userId)) !== 'FREE') freezes = Math.max(freezes, MAX_STREAK_FREEZES);

  if (freezes !== user.streakFreezes || milestone !== user.streakFreezeMilestone) {
    await prisma.user.update({ where: { id: userId }, data: { streakFreezes: freezes, streakFreezeMilestone: milestone } });
  }
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
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // Serializable isolation closes the TOCTOU race: two concurrent claims on the same
  // day will both read "no reward yet", but the DB serializes them — the second one
  // retries and then finds the first one's row, causing the conflict throw.
  // P2034 = Prisma's serialization failure code.
  let updatedUser: { creditBalance: number };
  let transaction: { id: string; amount: number; type: string; description: string; createdAt: Date };

  try {
    [updatedUser, transaction] = await prisma.$transaction(async (tx) => {
      const rewardToday = await tx.creditTransaction.findFirst({
        where: {
          userId,
          type: 'REWARD',
          description: 'Daily login reward', // exclude achievement rewards (also type REWARD)
          createdAt: { gte: todayStart, lte: todayEnd },
        },
      });
      if (rewardToday) throw new ConflictError('Daily login reward already claimed today');

      return Promise.all([
        tx.user.update({
          where: { id: userId },
          data: { creditBalance: { increment: 1 } },
          select: { creditBalance: true },
        }),
        tx.creditTransaction.create({
          data: { userId, type: 'REWARD', amount: 1, description: 'Daily login reward' },
        }),
      ]);
    }, { isolationLevel: 'Serializable' });
  } catch (e) {
    if ((e as { code?: string }).code === 'P2034') {
      throw new ConflictError('Daily login reward already claimed today');
    }
    throw e;
  }

  triggerAchievementCheck(userId); // streak milestones
  await maintainStreakFreezes(userId).catch(() => {}); // bridge misses + grant/refill freezes

  return {
    balance: updatedUser.creditBalance,
    transaction,
    message: 'Daily login reward claimed! +1 credit',
  };
}

// ─── Referrals ──────────────────────────────────────────────────────────────
// Redeem-a-code model (no deferred deep-link infra): a new user enters a friend's
// code once; both sides get credits. Change the reward numbers here — single source.
export const REFERRER_REWARD = 5;  // credits the inviter earns per successful referral
export const NEW_USER_REWARD = 5;  // credits the redeemer earns for using a code
export const REFERRER_CAP    = 25; // max rewarded referrals per inviter (anti-farming)

// Unambiguous alphabet (no 0/O/1/I) for codes people type from a WhatsApp message.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function randomCode(len = 6): string {
  let out = '';
  for (let i = 0; i < len; i++) out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return out;
}

/** Return the user's own invite code (lazy-generating + persisting one on first request). */
export async function getReferralInfo(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true, referralRedeemedAt: true },
  });
  if (!user) throw new NotFoundError('User not found');

  let code = user.referralCode;
  if (!code) {
    // Assign a unique code; retry on the rare collision.
    for (let attempt = 0; attempt < 5 && !code; attempt++) {
      const candidate = randomCode();
      try {
        await prisma.user.update({ where: { id: userId }, data: { referralCode: candidate } });
        code = candidate;
      } catch (e) {
        if ((e as { code?: string }).code !== 'P2002') throw e; // P2002 = unique clash → retry
      }
    }
    if (!code) throw new ConflictError('Could not generate a referral code, please try again');
  }

  const referredCount = await prisma.creditTransaction.count({
    where: { userId, type: 'REWARD', description: 'Referral reward (friend joined)' },
  });

  return {
    code,
    referredCount,
    rewardPerReferral: REFERRER_REWARD,
    newUserReward: NEW_USER_REWARD,
    alreadyRedeemed: user.referralRedeemedAt !== null,
  };
}

/** Redeem a friend's code once. Grants both sides atomically. */
export async function redeemReferral(userId: string, rawCode: string) {
  const code = rawCode.trim().toUpperCase();
  if (!code) throw new ValidationError('Enter a referral code');

  const referrer = await prisma.user.findUnique({
    where: { referralCode: code },
    select: { id: true, referredById: true },
  });
  if (!referrer) throw new NotFoundError('That referral code is invalid');
  if (referrer.id === userId) throw new ValidationError('You cannot use your own referral code');
  // Reject the 2-account reciprocal cycle (A↔B). N-account cycles are a documented non-goal.
  if (referrer.referredById === userId) throw new ValidationError('Circular referral not allowed');

  // referralRedeemedAt is the durable idempotency key (referredById is SetNull-able on referrer deletion).
  const me = await prisma.user.findUnique({ where: { id: userId }, select: { referralRedeemedAt: true } });
  if (!me) throw new NotFoundError('User not found');
  if (me.referralRedeemedAt) throw new ConflictError('You have already redeemed a referral code');

  // Serializable so two concurrent redeems can't both pass the marker check.
  let balance: number;
  try {
    balance = await prisma.$transaction(async (tx) => {
      const fresh = await tx.user.findUnique({ where: { id: userId }, select: { referralRedeemedAt: true } });
      if (fresh?.referralRedeemedAt) throw new ConflictError('You have already redeemed a referral code');

      // Re-read the referrer inside the txn to catch a simultaneous A↔B pair
      // (serializable would otherwise surface it as a P2034 retry).
      const freshReferrer = await tx.user.findUnique({ where: { id: referrer.id }, select: { referredById: true } });
      if (freshReferrer?.referredById === userId) throw new ValidationError('Circular referral not allowed');

      // Grant the new user their bonus + record who referred them + stamp the durable marker.
      const updated = await tx.user.update({
        where: { id: userId },
        data: { referredById: referrer.id, referralRedeemedAt: new Date(), creditBalance: { increment: NEW_USER_REWARD } },
        select: { creditBalance: true },
      });
      await tx.creditTransaction.create({
        data: { userId, type: 'REWARD', amount: NEW_USER_REWARD, description: 'Referral reward (used a code)' },
      });

      // Reward the inviter, unless they've hit the cap. Guard against the
      // referrer being deleted between the outer lookup and here (P2025) —
      // the new user still keeps their bonus; we just skip the inviter reward.
      const inviterRewards = await tx.creditTransaction.count({
        where: { userId: referrer.id, type: 'REWARD', description: 'Referral reward (friend joined)' },
      });
      if (inviterRewards < REFERRER_CAP) {
        try {
          await tx.user.update({
            where: { id: referrer.id },
            data: { creditBalance: { increment: REFERRER_REWARD } },
          });
          await tx.creditTransaction.create({
            data: { userId: referrer.id, type: 'REWARD', amount: REFERRER_REWARD, description: 'Referral reward (friend joined)' },
          });
        } catch (e) {
          if ((e as { code?: string }).code !== 'P2025') throw e; // referrer gone → skip reward
        }
      }

      return updated.creditBalance;
    }, { isolationLevel: 'Serializable' });
  } catch (e) {
    // P2034 = serialization failure. This fires both for a genuine same-user
    // double-redeem AND for two different users redeeming the same referrer at
    // once — so a generic retry message is the only correct wording. A real
    // repeat redeem is caught by the referredById checks with a clear message.
    if ((e as { code?: string }).code === 'P2034') {
      throw new ConflictError('Could not apply the referral code, please try again');
    }
    throw e;
  }

  return { balance, granted: NEW_USER_REWARD };
}
