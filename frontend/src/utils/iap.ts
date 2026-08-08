import { Platform } from 'react-native';
import {
  initConnection,
  getActiveSubscriptions,
  getReceiptDataIOS,
  deepLinkToSubscriptions,
} from 'react-native-iap';
import { subscriptionsApi } from '../api';
import { ALL_PRODUCT_IDS, type VerifyPurchasePayload } from '../types';

let connected = false;

/** initConnection is idempotent-safe to call once; guards repeat calls. */
export async function ensureIapConnection(): Promise<void> {
  if (connected) return;
  await initConnection();
  connected = true;
}

/** Base64 app receipt (iOS) / purchase token (Android) → what the backend verifies. */
export async function getPlatformReceipt(fallbackToken?: string | null): Promise<string | null> {
  if (Platform.OS === 'ios') {
    try { return await getReceiptDataIOS(); } catch { return null; }
  }
  return fallbackToken ?? null;
}

export const currentStore = (): VerifyPurchasePayload['platform'] =>
  Platform.OS === 'ios' ? 'APPLE' : 'GOOGLE';

export async function openManageSubscriptions(): Promise<void> {
  try { await deepLinkToSubscriptions(); } catch { /* store not available */ }
}

/**
 * Verify-on-open (locked E decision #1): re-check entitlement at launch.
 * If the store reports an active subscription, re-verify its receipt with the
 * backend (catches renewals → extends expiry). Otherwise fall back to the cheap
 * backend status call, which downgrades a lapsed record to FREE.
 * Never throws — a missing/unconfigured store must not break app start.
 */
export async function syncEntitlementOnOpen(): Promise<void> {
  try {
    await ensureIapConnection();
    const actives = await getActiveSubscriptions();
    const active = actives?.[0];
    if (active) {
      const productId = active.currentPlanId ?? active.productId;
      const receipt = await getPlatformReceipt(active.purchaseToken);
      if (receipt) {
        await subscriptionsApi.verify({ platform: currentStore(), productId, receipt });
        return;
      }
    }
    await subscriptionsApi.status();
  } catch {
    try { await subscriptionsApi.status(); } catch { /* offline — leave as-is */ }
  }
}

export { ALL_PRODUCT_IDS };
