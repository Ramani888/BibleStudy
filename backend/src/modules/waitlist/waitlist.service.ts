import { prisma } from '../../config/db';
import { CreateWaitlistDtoType } from './waitlist.dto';

// Idempotent: re-submitting the same email refreshes the country instead of
// throwing on the unique constraint, so a double-submit still "succeeds".
export async function joinWaitlist(dto: CreateWaitlistDtoType) {
  return prisma.waitlist.upsert({
    where: { email: dto.email },
    update: { country: dto.country },
    create: { email: dto.email, country: dto.country },
    select: { id: true, email: true, createdAt: true },
  });
}
