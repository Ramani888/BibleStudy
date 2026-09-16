import { prisma } from '../config/db';

// Firebase Admin is optional — only initialised when credentials are present.
// This avoids crashing the server in dev when FIREBASE_* env vars are not set.
let firebaseApp: import('firebase-admin').app.App | null = null;

async function getMessaging() {
  if (
    !process.env.FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_PRIVATE_KEY ||
    !process.env.FIREBASE_CLIENT_EMAIL
  ) {
    return null;
  }

  if (!firebaseApp) {
    const admin = await import('firebase-admin');
    if (!admin.apps.length) {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId:   process.env.FIREBASE_PROJECT_ID,
          privateKey:  process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      });
    } else {
      firebaseApp = admin.apps[0]!;
    }
  }

  const admin = await import('firebase-admin');
  return admin.messaging();
}

export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  try {
    // Persist in-app notification regardless of push config. Upsert on the (userId,type,referenceId)
    // unique key so a repeat of the SAME referenced event — a re-sent friend request (reuses its
    // request.id via the sendRequest upsert) or re-accepting after a friend cycle (friend_accepted +
    // accepter id) — re-surfaces as fresh + unread instead of being silently dropped by the
    // constraint (which also skipped the push). Null-ref events (e.g. the weekly share nudge) are not
    // deduped — Postgres treats null refs as distinct — so they always insert.
    const type = data?.type ?? 'general';
    const referenceId = data?.id ?? null;
    if (referenceId === null) {
      await prisma.notification.create({ data: { userId, title, body, type, referenceId: null } });
    } else {
      await prisma.notification.upsert({
        where: { userId_type_referenceId: { userId, type, referenceId } },
        create: { userId, title, body, type, referenceId },
        update: { title, body, read: false, createdAt: new Date() },
      });
    }

    const messaging = await getMessaging();
    if (!messaging) return; // Firebase not configured

    const tokens = await prisma.deviceToken.findMany({ where: { userId } });
    if (!tokens.length) return;

    const response = await messaging.sendEachForMulticast({
      tokens: tokens.map(t => t.token),
      notification: { title, body },
      data,
    });

    // Clean up stale/invalid device tokens
    const staleTokens: string[] = [];
    response.responses.forEach((res, idx) => {
      if (!res.success) {
        const code = res.error?.code;
        if (
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-registration-token'
        ) {
          staleTokens.push(tokens[idx].token);
        }
      }
    });
    if (staleTokens.length > 0) {
      await prisma.deviceToken.deleteMany({
        where: { token: { in: staleTokens }, userId },
      });
    }
  } catch (err) {
    // Push notification failures are non-critical — log but don't rethrow
    console.error('Push notification error:', err);
  }
}
