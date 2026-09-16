import { Prisma } from '@prisma/client';
import { prisma } from '../../config/db';
import { CreateWaitlistDtoType } from './waitlist.dto';
import { sendWaitlistWelcomeEmail } from '../../utils/email';

// Idempotent: re-submitting the same email refreshes the country instead of
// throwing on the unique constraint, so a double-submit still "succeeds".
// Returns the entry plus the signup's 1-based position in line.
export async function joinWaitlist(dto: CreateWaitlistDtoType) {
  // Create-then-catch, NOT read-then-create: two concurrent first-time submits of the same email
  // (a double-tapped join) would both see no existing row and both create → the loser hits the
  // `email @unique` (P2002) → 500. The create IS the "first sign-up" signal.
  let isNew = false;
  try {
    await prisma.waitlist.create({ data: { email: dto.email, country: dto.country }, select: { id: true } });
    isNew = true;
  } catch (e) {
    // Duplicate submit. Deliberately DON'T update the existing row: this endpoint is unauthenticated,
    // so overwriting an existing subscriber's country would let anyone retarget their staggered-launch
    // invite. A repeat submit is a silent no-op (still "succeeds" for the caller).
    if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002')) throw e;
  }

  // Welcome email only on first sign-up. Fire-and-forget — a mail failure must
  // never fail the request.
  if (isNew) {
    sendWaitlistWelcomeEmail(dto.email).catch(() => {});
  }

  // Return a uniform acknowledgement with NO per-request signal. Anything that varies by whether
  // this submit inserted a row — a stored rank/timestamp, or "position = current count" — lets an
  // unauthenticated caller distinguish a new signup from a repeat (membership oracle) and misreports
  // a resubmitting user's rank. Social proof is shown from the separate public GET /count.
  // (A residual ±1 oracle exists via GET /count itself — see the note in PLAN.md; closing it means
  // coarsening the public counter, a product/copy decision left to the owner.)
  return {};
}

export async function getWaitlistCount(): Promise<number> {
  // Coarsen the public counter to the nearest 10 (floor). An EXACT public count next to an
  // idempotent join is a membership oracle: read N, submit a target email, re-read → N+1 means a new
  // signup, N means the address was already on the list. Bucketing hides a single signup's ±1 delta
  // (and a rare bucket-boundary crossing isn't attributable to any specific email), while an
  // approximate number is all the social-proof display needs.
  const n = await prisma.waitlist.count();
  return Math.floor(n / 10) * 10;
}
