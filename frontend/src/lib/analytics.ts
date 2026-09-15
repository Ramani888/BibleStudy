import Config from 'react-native-config';
import { PostHog } from 'posthog-react-native';

/**
 * Product analytics via PostHog. Mirrors lib/purchases.ts: configured once at app
 * start, key from react-native-config, and a NO-OP when the key is missing
 * (dev / not yet provisioned) so nothing breaks before a PostHog project exists.
 *
 * Minimal data-safety footprint (LGPD + App-Store "Collected, not Shared; no ad ID"):
 * we construct PostHog DIRECTLY — not via <PostHogProvider> — so touch/screen
 * autocapture is off. Only explicit track() calls and app-lifecycle events are sent.
 * EU cloud host keeps data residency in-region.
 */

export type AnalyticsEvent =
  | 'cards_generated'
  | 'quiz_completed'
  | 'share_tapped'
  | 'subscribed'
  | 'referral_signup'; // wired in task #2 (referral rewards)

let client: PostHog | null = null;
// Remembered across configure so identify()/app-open ordering is race-free: if a
// user is already known before the (async) configure runs, we identify on init.
let currentUserId: string | null = null;

/**
 * Call once at app start AFTER the opt-out preference is known (see analytics.store
 * hydrate). Passing optedOut constructs PostHog opted-out from the start, so the
 * lifecycle "Application Opened" event never fires for a user who opted out —
 * closing the cold-start leak. No-op if key missing.
 */
export function configureAnalytics(opts?: { optedOut?: boolean }): void {
  if (client) return;
  // DEV fallback so a Metro reload activates analytics without a native rebuild
  // (Config.* is baked at build time). Release uses the baked .env value.
  const key = Config.POSTHOG_API_KEY || (__DEV__ ? 'phc_m8AYwBvJvvGjnoLuBtJLqxRshS8roM7VU4pU9BvFeNc6' : '');
  if (!key) return; // not configured yet — analytics stays a no-op
  client = new PostHog(key, {
    host: Config.POSTHOG_HOST || 'https://us.i.posthog.com',
    // Application Opened/Installed/Updated captured automatically — covers "app_open".
    captureAppLifecycleEvents: true,
    defaultOptIn: !opts?.optedOut,
  });
  if (currentUserId) client.identify(currentUserId);
}

/** Link subsequent events to the backend user id (call on login). */
export function identify(userId: string): void {
  currentUserId = userId;
  client?.identify(userId);
}

/** Unlink on logout so the next session starts a fresh anonymous id. */
export function resetAnalytics(): void {
  currentUserId = null;
  client?.reset();
}

export function track(
  event: AnalyticsEvent,
  props?: Record<string, string | number | boolean | null>,
): void {
  client?.capture(event, props);
}

/** Opt-out toggle (persisted by PostHog; respected until re-enabled). */
export function setAnalyticsEnabled(enabled: boolean): void {
  if (!client) return;
  (enabled ? client.optIn() : client.optOut()).catch(() => {});
}
