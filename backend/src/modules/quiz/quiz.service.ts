import { prisma } from '../../config/db';
import { RecordAttemptDtoType } from './quiz.dto';
import { NotFoundError } from '../../utils/errors';

/** Persist a finished quiz attempt and return it alongside the user's best % for the set. */
export async function recordAttempt(userId: string, dto: RecordAttemptDtoType) {
  const set = await prisma.set.findUnique({ where: { id: dto.setId }, select: { id: true } });
  if (!set) throw new NotFoundError('Set not found');

  const scorePct = Math.round((dto.correct / dto.total) * 100);

  const attempt = await prisma.quizAttempt.create({
    data: {
      userId,
      setId:   dto.setId,
      total:   dto.total,
      correct: dto.correct,
      scorePct,
    },
  });

  const best = await getBestForSet(userId, dto.setId);
  return { attempt, best };
}

/** Highest score % the user has achieved on a set, or null if never attempted. */
export async function getBestForSet(userId: string, setId: string): Promise<number | null> {
  const agg = await prisma.quizAttempt.aggregate({
    where: { userId, setId },
    _max: { scorePct: true },
  });
  return agg._max.scorePct ?? null;
}

/** Best score + attempt count per set for the user (feeds the Quiz hub badges). */
export async function getAllBest(userId: string) {
  const rows = await prisma.quizAttempt.groupBy({
    by: ['setId'],
    where: { userId },
    _max: { scorePct: true },
    _count: { _all: true },
  });
  return rows.map(r => ({
    setId:    r.setId,
    best:     r._max.scorePct ?? 0,
    attempts: r._count._all,
  }));
}
