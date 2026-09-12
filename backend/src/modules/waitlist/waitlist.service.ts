import { prisma } from '../../config/db';
import { CreateWaitlistDtoType } from './waitlist.dto';
import { sendWaitlistWelcomeEmail } from '../../utils/email';

// Idempotent: re-submitting the same email refreshes the country instead of
// throwing on the unique constraint, so a double-submit still "succeeds".
// Returns the entry plus the signup's 1-based position in line.
export async function joinWaitlist(dto: CreateWaitlistDtoType) {
  const existing = await prisma.waitlist.findUnique({ where: { email: dto.email } });

  const entry = existing
    ? await prisma.waitlist.update({
        where: { email: dto.email },
        data: { country: dto.country },
        select: { id: true, email: true, createdAt: true },
      })
    : await prisma.waitlist.create({
        data: { email: dto.email, country: dto.country },
        select: { id: true, email: true, createdAt: true },
      });

  // Welcome email only on first sign-up. Fire-and-forget — a mail failure must
  // never fail the request.
  if (!existing) {
    sendWaitlistWelcomeEmail(dto.email).catch(() => {});
  }

  // Position = number of rows created on or before this one (stable for re-submits).
  const position = await prisma.waitlist.count({
    where: { createdAt: { lte: entry.createdAt } },
  });

  return { ...entry, position };
}

export async function getWaitlistCount(): Promise<number> {
  return prisma.waitlist.count();
}
