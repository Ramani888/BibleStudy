import { ActivityType } from '@prisma/client';
import { prisma } from '../config/db';
import { triggerAchievementCheck } from './achievementCheck';

export async function logActivity(
  userId: string,
  type: ActivityType,
  referenceId?: string
): Promise<void> {
  try {
    await prisma.activity.create({ data: { userId, type, referenceId } });
    // Covers CREATED_CARD/SET, JOINED_GROUP, ADDED_FRIEND achievements in one place.
    triggerAchievementCheck(userId);
  } catch {
    // Non-critical — never let activity logging break a user-facing action
  }
}
