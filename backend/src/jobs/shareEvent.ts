import cron from 'node-cron';
import { prisma } from '../config/db';
import { sendPushToUser } from '../utils/notifications';

const TITLE = 'Share your progress 🙌';
const BODY = 'Send your set or streak to your group — grow in the Word together.';

// Sunday nudge: turn existing users into a viral loop on church day.
// "Your group" = their real-world group (WhatsApp etc.) — the share opens the OS
// share sheet with a getverdance.com link; there is no in-app group feature.
async function sendShareEvent() {
  const rows = await prisma.deviceToken.findMany({
    distinct: ['userId'],
    select: { userId: true },
  });
  if (rows.length === 0) return;

  console.log(`[shareEvent] sending to ${rows.length} user(s)`);
  for (const { userId } of rows) {
    await sendPushToUser(userId, TITLE, BODY, { type: 'share_event' });
  }
  console.log('[shareEvent] done');
}

export function startShareEventJob() {
  // 16:00 UTC every Sunday (~late morning across the Americas).
  // ponytail: single UTC send-time, not per-user timezone; upgrade to per-tz if it matters.
  cron.schedule('0 16 * * 0', () => {
    sendShareEvent().catch(err => console.error('[shareEvent] job error:', err));
  });
  console.log('[shareEvent] scheduled Sundays at 16:00 UTC');
}
