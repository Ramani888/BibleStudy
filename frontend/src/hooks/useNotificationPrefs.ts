import { useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const STORAGE_KEY = '@bsp/notification_settings';

export interface NotificationPrefs {
  friendRequests: boolean;
  friendAccepted: boolean;
  achievements:   boolean;
  system:         boolean;
}

const DEFAULTS: NotificationPrefs = {
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
};

// Re-reads prefs from AsyncStorage every time the screen comes into focus.
export function useNotificationPrefs(): NotificationPrefs {
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULTS);

  useFocusEffect(useCallback(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      setPrefs(raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS);
    });
  }, []));

  return prefs;
}
