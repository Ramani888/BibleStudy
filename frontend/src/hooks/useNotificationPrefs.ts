import { useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useNotifications } from './useNotifications';

export const NOTIF_PREFS_KEY = '@bsp/notification_settings';

export interface NotificationPrefs {
  friendRequests: boolean;
  friendAccepted: boolean;
  achievements:   boolean;
  system:         boolean;
}

export const NOTIF_DEFAULTS: NotificationPrefs = {
  friendRequests: true,
  friendAccepted: true,
  achievements:   true,
  system:         true,
};

export const TYPE_TO_PREF: Record<string, keyof NotificationPrefs> = {
  achievement:     'achievements',
  friend_request:  'friendRequests',
  friend_accepted: 'friendAccepted',
  system:          'system',
  share_event:     'system',
};

// Re-reads prefs from AsyncStorage every time the screen comes into focus.
export function useNotificationPrefs(): NotificationPrefs {
  const [prefs, setPrefs] = useState<NotificationPrefs>(NOTIF_DEFAULTS);

  useFocusEffect(useCallback(() => {
    AsyncStorage.getItem(NOTIF_PREFS_KEY).then(raw => {
      setPrefs(raw ? { ...NOTIF_DEFAULTS, ...JSON.parse(raw) } : NOTIF_DEFAULTS);
    });
  }, []));

  return prefs;
}

/** Unread notifications the user hasn't muted — the bell dot/count on Home and Profile. */
export function useUnreadCount(): number {
  const { data } = useNotifications(1);
  const prefs = useNotificationPrefs();
  return (data?.notifications ?? []).filter(n => {
    if (n.read) return false;
    const prefKey = TYPE_TO_PREF[n.type];
    return prefKey ? prefs[prefKey] !== false : true;
  }).length;
}
