import { prisma } from '../config/db';

// True if the user is a member of any group whose group-study-plan includes this set.
// Lets group members study sets referenced by their group plans (D2), without cloning.
export async function memberHasGroupPlanAccess(userId: string, setId: string): Promise<boolean> {
  const steps = await prisma.studyPlanStep.findMany({
    where: { setId, plan: { groupId: { not: null } } },
    select: { plan: { select: { groupId: true } } },
  });
  const groupIds = [...new Set(steps.map(s => s.plan.groupId).filter((g): g is string => !!g))];
  if (groupIds.length === 0) return false;
  const membership = await prisma.groupMember.findFirst({ where: { userId, groupId: { in: groupIds } } });
  return !!membership;
}
