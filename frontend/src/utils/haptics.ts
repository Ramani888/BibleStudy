import RNHapticFeedback from 'react-native-haptic-feedback';

const OPTIONS = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

export function triggerHaptic(type: 'light' | 'medium' | 'success' = 'light'): void {
  try {
    if (type === 'success') {
      RNHapticFeedback.trigger('notificationSuccess', OPTIONS);
    } else if (type === 'medium') {
      RNHapticFeedback.trigger('impactMedium', OPTIONS);
    } else {
      RNHapticFeedback.trigger('impactLight', OPTIONS);
    }
  } catch {}
}
