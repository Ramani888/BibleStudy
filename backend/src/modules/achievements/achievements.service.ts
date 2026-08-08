import { prisma } from '../../config/db';
import { getStreak } from '../credits/credits.service';
import { sendPushToUser } from '../../utils/notifications';
import { ACHIEVEMENTS, type AchievementMetric } from './achievements.defs';

// Compute every metric the achievement defs reference, from existing data.
async function computeMetrics(userId: string): Promise<Record<AchievementMetric, number>> {
  const [
    cardsCreated,
    setsCreated,
    quizzesTaken,
    perfectQuizzes,
    quizModes,
    friends,
    groupsJoined,
    aiQuestions,
    streakInfo,
    userPlans,
  ] = await Promise.all([
    prisma.activity.count({ where: { userId, type: 'CREATED_CARD' } }),
    prisma.activity.count({ where: { userId, type: 'CREATED_SET' } }),
    prisma.quizAttempt.count({ where: { userId } }),
    prisma.quizAttempt.count({ where: { userId, scorePct: 100 } }),
    prisma.quizAttempt.findMany({ where: { userId, mode: { not: null } }, select: { mode: true }, distinct: ['mode'] }),
    prisma.friendship.count({ where: { userId } }),
    prisma.groupMember.count({ where: { userId } }),
    prisma.aIChat.count({ where: { userId } }),
    getStreak(userId),
    prisma.studyPlan.findMany({
      where: { userId },
      select: { steps: { select: { progress: { where: { userId }, select: { stepId: true } } } } },
    }),
  ]);

  // A plan counts as completed when it has steps and every step has progress.
  const plansCompleted = userPlans.filter(
    p => p.steps.length > 0 && p.steps.every(s => s.progress.length > 0),
  ).length;

  return {
    cards_created: cardsCreated,
    sets_created: setsCreated,
    quizzes_taken: quizzesTaken,
    perfect_quiz: perfectQuizzes,
    quiz_modes: quizModes.length,
    streak: streakInfo.longestStreak, // longest so an unlocked streak badge never re-locks
    friends,
    groups_joined: groupsJoined,
    ai_questions: aiQuestions,
    plans_completed: plansCompleted,
  };
}

// Unlock any newly-earned achievements: persist the unlock, grant bonus credits,
// and notify. Safe to call often (idempotent — already-unlocked keys are skipped).
// Returns the list of newly-unlocked achievement keys.
export async function checkAchievements(userId: string): Promise<string[]> {
  const [metrics, existing] = await Promise.all([
    computeMetrics(userId),
    prisma.userAchievement.findMany({ where: { userId }, select: { key: true } }),
  ]);
  const unlockedKeys = new Set(existing.map(a => a.key));

  const newly = ACHIEVEMENTS.filter(
    a => !unlockedKeys.has(a.key) && metrics[a.metric] >= a.threshold,
  );
  if (newly.length === 0) return [];

  // Persist unlocks + grant credits atomically per achievement.
  await prisma.$transaction([
    prisma.userAchievement.createMany({
      data: newly.map(a => ({ userId, key: a.key })),
      skipDuplicates: true,
    }),
    prisma.user.update({
      where: { id: userId },
      data: { creditBalance: { increment: newly.reduce((s, a) => s + a.reward, 0) } },
    }),
    prisma.creditTransaction.createMany({
      data: newly.map(a => ({
        userId,
        type: 'REWARD' as const,
        amount: a.reward,
        description: `Achievement unlocked: ${a.title}`,
      })),
    }),
  ]);

  // Notify (non-critical — persists in-app notification + optional push).
  await Promise.all(
    newly.map(a =>
      sendPushToUser(userId, '🏆 Achievement unlocked!', `${a.title} — +${a.reward} credits`, {
        type: 'achievement',
        id: a.key,
      }).catch(() => {}),
    ),
  );

  return newly.map(a => a.key);
}

// Full achievement list for the user, with unlocked status + progress.
// Runs a check first so opening the screen unlocks anything pending (decision C-3).
export async function getAchievements(userId: string) {
  await checkAchievements(userId);

  const [metrics, unlocked] = await Promise.all([
    computeMetrics(userId),
    prisma.userAchievement.findMany({ where: { userId }, select: { key: true, unlockedAt: true } }),
  ]);
  const unlockedMap = new Map(unlocked.map(u => [u.key, u.unlockedAt]));

  return ACHIEVEMENTS.map(a => {
    const current = metrics[a.metric];
    return {
      key: a.key,
      title: a.title,
      description: a.description,
      icon: a.icon,
      category: a.category,
      reward: a.reward,
      threshold: a.threshold,
      progress: Math.min(current, a.threshold),
      unlocked: unlockedMap.has(a.key),
      unlockedAt: unlockedMap.get(a.key) ?? null,
    };
  });
}
