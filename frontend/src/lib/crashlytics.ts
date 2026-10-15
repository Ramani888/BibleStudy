import {
  getCrashlytics,
  log,
  recordError as fbRecordError,
  setCrashlyticsCollectionEnabled,
  setUserId,
} from '@react-native-firebase/crashlytics';

/**
 * Crash reporting via Firebase Crashlytics. Mirrors lib/analytics.ts: one small
 * module, called from App.tsx (user link) and analytics.store (opt-out).
 *
 * firebase.json ships auto-collection OFF, so nothing is sent until
 * setCrashReportingEnabled() runs. The flag is persisted natively, so after the
 * first launch an opted-in user is covered from cold start (native crashes before
 * JS boots included). Never enabled in __DEV__ — dev crashes would bury real ones.
 *
 * Privacy: only the backend user id is attached (never email/name), matching the
 * "Collected, linked to user, not shared" data-safety declaration.
 */

const crashlytics = getCrashlytics();

/** Follows the Settings analytics toggle (LGPD opt-out covers diagnostics too). */
export function setCrashReportingEnabled(enabled: boolean): void {
  setCrashlyticsCollectionEnabled(crashlytics, enabled && !__DEV__).catch(() => {});
}

/** Link reports to the signed-in user; pass null on logout. */
export function setCrashUser(userId: string | null): void {
  setUserId(crashlytics, userId ?? '').catch(() => {});
}

/** Breadcrumb shown in the report's log, e.g. the screen trail before a crash. */
export function crashLog(message: string): void {
  log(crashlytics, message);
}

/** Report an error we caught ourselves (it would not crash the app on its own). */
export function recordError(error: unknown, context?: string): void {
  const err = error instanceof Error ? error : new Error(String(error));
  if (context) log(crashlytics, context);
  fbRecordError(crashlytics, err);
}
