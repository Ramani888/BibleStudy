import { ActivityType } from '@prisma/client';
import { prisma } from '../config/db';

export async function logActivity(
  userId: string,
  type: ActivityType,
  referenceId?: string
): Promise<void> {
  try {
    await prisma.activity.create({ data: { userId, type, referenceId } });
  } catch {
    // Non-critical — never let activity logging break a user-facing action
  }
}
