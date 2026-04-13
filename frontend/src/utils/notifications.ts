import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { apiPost, apiClient } from '../api/client';

/**
 * Request push notification permission, obtain the FCM device token,
 * and register it with the backend.
 *
 * Safe to call multiple times — the backend upserts on the token value.
 * Silently returns if permission is denied or Firebase is not configured.
 */
export async function registerDeviceToken(): Promise<void> {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) return;

    const token = await messaging().getToken();
    if (!token) return;

    await apiPost('/users/device-token', {
      token,
      platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
    });
  } catch {
    // Firebase not configured or network error — non-critical
  }
}

/**
 * Remove the current device's FCM token from the backend.
 * Called on logout so the device stops receiving push notifications.
 */
export async function removeDeviceToken(): Promise<void> {
  try {
    const token = await messaging().getToken();
    if (!token) return;
    await apiClient.delete('/users/device-token', { data: { token } });
  } catch {
    // Non-critical — token will expire naturally
  }
}

/**
 * Listen for FCM token refreshes and re-register with the backend.
 * Returns an unsubscribe function.
 */
export function onTokenRefresh(): () => void {
  return messaging().onTokenRefresh(async (token) => {
    try {
      await apiPost('/users/device-token', {
        token,
        platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
      });
    } catch {
      // Non-critical
    }
  });
}

/**
 * Set up foreground notification display.
 * By default, Firebase suppresses notifications when the app is in the foreground.
 * This handler ensures they still appear.
 */
export function setupForegroundHandler(): () => void {
  return messaging().onMessage(async (_remoteMessage) => {
    // react-native-toast-message or in-app UI can be shown here.
    // The notification is already displayed natively on iOS via
    // AppDelegate's userNotificationCenter willPresent handler.
    // On Android, heads-up notifications show automatically for
    // high-priority messages sent from the backend.
  });
}
