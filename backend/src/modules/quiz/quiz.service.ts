import { prisma } from '../../config/db';
import { RecordAttemptDtoType } from './quiz.dto';
import { NotFoundError } from '../../utils/errors';

export async function recordAttempt(userId: string, dto: RecordAttemptDtoType) {
  const primarySetId = dto.setIds[0];
  const sets = await prisma.set.findMany({ where: { id: { in: dto.setIds } }, select: { id: true } });
  if (sets.length !== dto.setIds.length) throw new NotFoundError('One or more sets not found');

  const scorePct = Math.round((dto.correct / dto.total) * 100);
  const attempt = await prisma.quizAttempt.create({
    data: {
      userId,
      setId:   primarySetId,
      setIds:  dto.setIds,
      total:   dto.total,
      correct: dto.correct,
      scorePct,
      mode:     dto.mode ?? null,
      quizName: dto.quizName ?? null,
    },
  });

  const best = await getBestForSet(userId, primarySetId);
  return { attempt, best };
}

export async function updateAttempt(userId: string, attemptId: string, dto: RecordAttemptDtoType) {
  const scorePct = Math.round((dto.correct / dto.total) * 100);
  const updated = await prisma.quizAttempt.updateMany({
    where: { id: attemptId, userId },
    data: { setIds: dto.setIds, total: dto.total, correct: dto.correct, scorePct, mode: dto.mode ?? null, quizName: dto.quizName ?? null },
  });
  if (updated.count === 0) throw new NotFoundError('Attempt not found');
  const best = await getBestForSet(userId, dto.setIds[0]);
  return { best };
}

export async function deleteAttempt(userId: string, attemptId: string) {
  const deleted = await prisma.quizAttempt.deleteMany({ where: { id: attemptId, userId } });
  if (deleted.count === 0) throw new NotFoundError('Attempt not found');
}

export async function getBestForSet(userId: string, setId: string): Promise<number | null> {
  const agg = await prisma.quizAttempt.aggregate({
    where: { userId, setId },
    _max: { scorePct: true },
  });
  return agg._max.scorePct ?? null;
}

export async function getRecentAttempts(userId: string, limit = 20) {
  const rows = await prisma.quizAttempt.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { set: { select: { title: true } } },
  });

  const allSetIds = [...new Set(rows.flatMap(r => r.setIds.length > 0 ? r.setIds : [r.setId]))];
  const setMap = allSetIds.length > 0
    ? await prisma.set.findMany({ where: { id: { in: allSetIds } }, select: { id: true, title: true } })
        .then(sets => Object.fromEntries(sets.map(s => [s.id, s.title])))
    : {} as Record<string, string>;

  return rows.map(r => {
    const effectiveSetIds = r.setIds.length > 0 ? r.setIds : [r.setId];
    const setTitles = effectiveSetIds.map(id => setMap[id] ?? r.set.title);
    return {
      id:        r.id,
      setId:     r.setId,
      setIds:    effectiveSetIds,
      setTitles,
      setTitle:  r.set.title,
      mode:      r.mode,
      scorePct:  r.scorePct,
      total:     r.total,
      correct:   r.correct,
      quizName:    r.quizName ?? undefined,
      createdAt:   r.createdAt.toISOString(),
      practicedAt: (r.practicedAt ?? r.createdAt).toISOString(),
    };
  });
}

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
