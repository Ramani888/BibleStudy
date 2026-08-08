import { prisma } from '../../config/db';
import { NotFoundError, AppError, ForbiddenError } from '../../utils/errors';
import { triggerAchievementCheck } from '../../utils/achievementCheck';
import type { CreatePlanDtoType, UpdatePlanDtoType, AddStepDtoType, ReorderStepsDtoType } from './plans.dto';

async function assertGroupAdmin(userId: string, groupId: string) {
  const group = await prisma.group.findUnique({ where: { id: groupId }, select: { ownerId: true } });
  if (!group) throw new NotFoundError('Group not found');
  if (group.ownerId === userId) return;
  const m = await prisma.groupMember.findFirst({ where: { groupId, userId } });
  if (!m || m.role !== 'ADMIN') throw new ForbiddenError('Only group admins can manage group plans');
}

async function isGroupMember(userId: string, groupId: string): Promise<boolean> {
  return !!(await prisma.groupMember.findFirst({ where: { groupId, userId } }));
}

// Plan is accessible if the user owns it, or it's a group plan and they're a member.
async function assertCanAccessPlan(userId: string, planId: string) {
  const plan = await prisma.studyPlan.findUnique({ where: { id: planId }, select: { userId: true, groupId: true } });
  if (!plan) throw new NotFoundError('Plan not found');
  if (plan.userId === userId) return plan;
  if (plan.groupId && (await isGroupMember(userId, plan.groupId))) return plan;
  throw new NotFoundError('Plan not found');
}

// Verify all setIds exist and belong to the user (can't build a plan from others' sets).
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
  if (dto.groupId) await assertGroupAdmin(userId, dto.groupId); // group plan → admin only
  const plan = await prisma.studyPlan.create({
    data: {
      userId,
      title: dto.title,
      description: dto.description ?? null,
      groupId: dto.groupId ?? null,
      steps: { create: dto.setIds.map((setId, i) => ({ setId, order: i })) },
    },
    include: { steps: true },
  });
  return plan;
}

export async function listPlans(userId: string) {
  const plans = await prisma.studyPlan.findMany({
    where: { userId, groupId: null }, // personal plans only; group plans live under the group
    orderBy: { createdAt: 'desc' },
    include: {
      steps: { select: { id: true, progress: { where: { userId }, select: { stepId: true } } } },
    },
  });

  return plans.map(p => {
    const total = p.steps.length;
    const completed = p.steps.filter(s => s.progress.length > 0).length;
    return {
      id: p.id,
      title: p.title,
      description: p.description,
      totalSteps: total,
      completedSteps: completed,
      createdAt: p.createdAt,
    };
  });
}

export async function getPlan(userId: string, planId: string) {
  await assertCanAccessPlan(userId, planId); // owner or group member
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
  // Owner or group member may complete a step (tracks their own progress).
  const step = await prisma.studyPlanStep.findUnique({ where: { id: stepId }, select: { planId: true } });
  if (!step) throw new NotFoundError('Step not found');
  await assertCanAccessPlan(userId, step.planId);
  await prisma.studyPlanProgress.upsert({
    where: { userId_stepId: { userId, stepId } },
    create: { userId, stepId },
    update: {},
  });
  triggerAchievementCheck(userId); // may unlock "Finished a Plan"
}

export async function uncompleteStep(userId: string, stepId: string) {
  await prisma.studyPlanProgress.deleteMany({ where: { userId, stepId } });
}

// ── Group plans (D2) ──────────────────────────────────────────────────────────

export async function listGroupPlans(userId: string, groupId: string) {
  if (!(await isGroupMember(userId, groupId))) throw new NotFoundError('Group not found');
  const plans = await prisma.studyPlan.findMany({
    where: { groupId },
    orderBy: { createdAt: 'desc' },
    include: { steps: { select: { id: true, progress: { where: { userId }, select: { stepId: true } } } } },
  });
  return plans.map(p => ({
    id: p.id,
    title: p.title,
    description: p.description,
    totalSteps: p.steps.length,
    completedSteps: p.steps.filter(s => s.progress.length > 0).length, // caller's own progress
    createdAt: p.createdAt,
  }));
}

// Per-member completion for a group plan → the leaderboard.
export async function getMembersProgress(userId: string, planId: string) {
  const plan = await assertCanAccessPlan(userId, planId);
  if (!plan.groupId) throw new AppError('Not a group plan', 400, 'NOT_GROUP_PLAN');

  const [steps, members] = await Promise.all([
    prisma.studyPlanStep.findMany({ where: { planId }, select: { id: true } }),
    prisma.groupMember.findMany({
      where: { groupId: plan.groupId },
      select: { user: { select: { id: true, name: true, profileImage: true } } },
    }),
  ]);
  const stepIds = steps.map(s => s.id);
  const total = stepIds.length;

  const rows = await Promise.all(
    members.map(async m => ({
      userId: m.user.id,
      name: m.user.name,
      profileImage: m.user.profileImage,
      completed: total === 0 ? 0 : await prisma.studyPlanProgress.count({ where: { userId: m.user.id, stepId: { in: stepIds } } }),
      total,
    })),
  );
  // Highest completion first.
  rows.sort((a, b) => b.completed - a.completed);
  return rows;
}
