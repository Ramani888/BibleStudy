import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import Toast from 'react-native-toast-message';
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
  return messaging().onMessage(async (remoteMessage) => {
    const { notification } = remoteMessage;
    if (notification) {
      Toast.show({
        type: 'info',
        text1: notification.title ?? 'Notification',
        text2: notification.body ?? '',
      });
    }
  });
}

/**
 * Handle navigation from a notification tap.
 * Parses the data payload and navigates to the appropriate screen.
 */
export function handleNotificationNavigation(
  data: Record<string, string> | undefined,
  navigate: (screen: string, params: object) => void
): void {
  if (!data?.type) return;
  switch (data.type) {
    case 'friend_request':
    case 'friend_accepted':
      navigate('ProfileTab', { screen: 'Friends' });
      break;
    case 'group':
      navigate('ProfileTab', { screen: 'GroupDetail', params: { groupId: data.id } });
      break;
    case 'gathering':
    case 'gathering_rsvp':
      navigate('MapTab', { screen: 'GatheringDetail', params: { gatheringId: data.id } });
      break;
    default:
      navigate('ProfileTab', { screen: 'Notifications' });
      break;
  }
}
