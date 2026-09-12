import InAppReview from 'react-native-in-app-review';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Fire the OS "rate this app" sheet once per milestone (quiz win, achievement,
// streak). The OS itself rate-limits (Apple ~3x/year) and silently no-ops when it
// declines — so this never blocks the UI and needs no fallback alert.
// We record the flag BEFORE calling so a milestone is asked at most once, whether
// or not the OS actually showed the sheet.
export async function requestReviewOnce(milestone: string): Promise<void> {
  try {
    const key = `@bsp/review_${milestone}`;
    if (await AsyncStorage.getItem(key)) return;
    if (!InAppReview.isAvailable()) return;
    await AsyncStorage.setItem(key, 'true');
    await InAppReview.RequestInAppReview();
  } catch {
    // A rating prompt failing must never affect the app.
  }
}
