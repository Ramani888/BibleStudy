import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import Toast from 'react-native-toast-message';
import { apiPost } from '../api/client';
import i18n from '../i18n';

/**
 * Obtain the FCM device token and register it with the backend.
 *
 * `prompt` controls the OS permission dialog:
 *  - `false` (default): only registers if permission was ALREADY granted —
 *    never shows a dialog. Use at login so opted-in users keep push silently
 *    while new users are not walled with a prompt.
 *  - `true`: requests permission (may show the OS dialog). Use at a contextual,
 *    user-initiated opt-in (e.g. turning on a notification setting).
 *
 * Returns whether the device ended up registered (i.e. permission granted).
 * Safe to call multiple times — the backend upserts on the token value.
 */
export async function registerDeviceToken({ prompt = false }: { prompt?: boolean } = {}): Promise<boolean> {
  try {
    const authStatus = prompt
      ? await messaging().requestPermission()
      : await messaging().hasPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) return false;

    const token = await messaging().getToken();
    if (!token) return false;

    await apiPost('/users/device-token', {
      token,
      platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
    });
    return true;
  } catch {
    // Firebase not configured or network error — non-critical
    return false;
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
    await apiPost('/users/device-token/remove', { token });
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
        text1: notification.title ?? i18n.t('common:notification', 'Notification'),
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
    case 'share_event':
      navigate('HomeTab', {});
      break;
    default:
      navigate('ProfileTab', { screen: 'Notifications' });
      break;
  }
}
