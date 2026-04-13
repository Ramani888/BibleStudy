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
    const messaging = await getMessaging();
    if (!messaging) return; // Firebase not configured

    const tokens = await prisma.deviceToken.findMany({ where: { userId } });
    if (!tokens.length) return;

    await messaging.sendEachForMulticast({
      tokens: tokens.map(t => t.token),
      notification: { title, body },
      data,
    });
  } catch (err) {
    // Push notification failures are non-critical — log but don't rethrow
    console.error('Push notification error:', err);
  }
}
