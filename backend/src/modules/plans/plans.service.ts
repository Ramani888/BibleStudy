import { prisma } from '../../config/db';
import { NotFoundError, AppError } from '../../utils/errors';
import { triggerAchievementCheck } from '../../utils/achievementCheck';
import type { CreatePlanDtoType, UpdatePlanDtoType, AddStepDtoType, ReorderStepsDtoType } from './plans.dto';

async function assertOwnedSets(userId: string, setIds: string[]) {
  const owned = await prisma.set.count({ where: { id: { in: setIds }, userId } });
  if (owned !== new Set(setIds).size) throw new AppError('One or more sets not found', 400, 'INVALID_SETS');
}

async function assertOwnedPlan(userId: string, planId: string) {
  const plan = await prisma.studyPlan.findFirst({ where: { id: planId, userId } });
  if (!plan) throw new NotFoundError('Plan not found');
  return plan;
}

export async function createPlan(userId: string, dto: CreatePlanDtoType) {
  await assertOwnedSets(userId, dto.setIds);
  return prisma.studyPlan.create({
    data: {
      userId,
      title: dto.title,
      description: dto.description ?? null,
      steps: { create: dto.setIds.map((setId, i) => ({ setId, order: i })) },
    },
    include: { steps: true },
  });
}

export async function listPlans(userId: string) {
  const plans = await prisma.studyPlan.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      steps: { select: { id: true, progress: { where: { userId }, select: { stepId: true } } } },
    },
  });

  return plans.map(p => {
    const total = p.steps.length;
    const completed = p.steps.filter(s => s.progress.length > 0).length;
    return { id: p.id, title: p.title, description: p.description, totalSteps: total, completedSteps: completed, createdAt: p.createdAt };
  });
}

export async function getPlan(userId: string, planId: string) {
  await assertOwnedPlan(userId, planId);
  const plan = await prisma.studyPlan.findFirst({
    where: { id: planId },
    include: {
      steps: {
        orderBy: { order: 'asc' },
        include: {
          set: { select: { id: true, title: true, color: true, _count: { select: { cards: true } } } },
          progress: { where: { userId }, select: { completedAt: true } },
        },
      },
    },
  });
  if (!plan) throw new NotFoundError('Plan not found');

  const steps = plan.steps.map(s => ({
    id: s.id,
    order: s.order,
    title: s.title,
    set: s.set ? { id: s.set.id, title: s.set.title, color: s.set.color, cardCount: s.set._count.cards } : null,
    completed: s.progress.length > 0,
    completedAt: s.progress[0]?.completedAt ?? null,
  }));

  return {
    id: plan.id,
    title: plan.title,
    description: plan.description,
    createdAt: plan.createdAt,
    totalSteps: steps.length,
    completedSteps: steps.filter(s => s.completed).length,
    steps,
  };
}

export async function updatePlan(userId: string, planId: string, dto: UpdatePlanDtoType) {
  await assertOwnedPlan(userId, planId);
  await prisma.studyPlan.update({
    where: { id: planId },
    data: { ...(dto.title !== undefined && { title: dto.title }), ...(dto.description !== undefined && { description: dto.description }) },
  });
}

export async function deletePlan(userId: string, planId: string) {
  await assertOwnedPlan(userId, planId);
  await prisma.studyPlan.delete({ where: { id: planId } });
}

export async function addStep(userId: string, planId: string, dto: AddStepDtoType) {
  await assertOwnedPlan(userId, planId);
  await assertOwnedSets(userId, [dto.setId]);
  const max = await prisma.studyPlanStep.aggregate({ where: { planId }, _max: { order: true } });
  return prisma.studyPlanStep.create({
    data: { planId, setId: dto.setId, title: dto.title ?? null, order: (max._max.order ?? -1) + 1 },
  });
}

export async function removeStep(userId: string, stepId: string) {
  const step = await prisma.studyPlanStep.findFirst({ where: { id: stepId, plan: { userId } } });
  if (!step) throw new NotFoundError('Step not found');
  await prisma.studyPlanStep.delete({ where: { id: stepId } });
}

export async function reorderSteps(userId: string, planId: string, dto: ReorderStepsDtoType) {
  await assertOwnedPlan(userId, planId);
  await prisma.$transaction(
    dto.stepIds.map((id, i) =>
      prisma.studyPlanStep.updateMany({ where: { id, planId }, data: { order: i } }),
    ),
  );
}

export async function completeStep(userId: string, stepId: string) {
  const step = await prisma.studyPlanStep.findUnique({ where: { id: stepId }, select: { planId: true } });
  if (!step) throw new NotFoundError('Step not found');
  await assertOwnedPlan(userId, step.planId);
  await prisma.studyPlanProgress.upsert({
    where: { userId_stepId: { userId, stepId } },
    create: { userId, stepId },
    update: {},
  });
  triggerAchievementCheck(userId);
}

export async function uncompleteStep(userId: string, stepId: string) {
  await prisma.studyPlanProgress.deleteMany({ where: { userId, stepId } });
}
