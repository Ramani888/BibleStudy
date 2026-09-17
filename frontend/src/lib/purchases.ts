import { Linking, Platform } from 'react-native';
import Config from 'react-native-config';
import Purchases, {
  type PurchasesPackage,
  type CustomerInfo,
} from 'react-native-purchases';
import { ALL_PRODUCT_IDS } from '../types';

/**
 * RevenueCat is the entitlement source of truth. The client purchases/restores via RC;
 * the backend grants credits + plan asynchronously from the RC webhook (see
 * backend subscriptions.service handleRcWebhook). So after a purchase the client just
 * refreshes the backend user — credits land within a few seconds of the webhook.
 */

let configured = false;

const apiKey = (): string =>
  (Platform.OS === 'ios' ? Config.REVENUECAT_IOS_API_KEY : Config.REVENUECAT_ANDROID_API_KEY) ?? '';

/** Call once at app start, before any other Purchases call. No-op if key missing (dev). */
export function configureRevenueCat(): void {
  if (configured) return;
  const key = apiKey();
  if (!key) return; // not configured yet — Paywall will show no packages
  Purchases.configure({ apiKey: key });
  configured = true;
}

/** Link the RC app user to our backend user id so webhooks arrive with app_user_id === userId. */
export async function identifyUser(userId: string): Promise<void> {
  if (!configured) configureRevenueCat();
  if (!configured) return;
  try { await Purchases.logIn(userId); } catch { /* offline — RC retries */ }
}

export async function logoutRevenueCat(): Promise<void> {
  if (!configured) return;
  try { await Purchases.logOut(); } catch { /* ignore */ }
}

/** Packages in the current offering (primes the RC cache; used to map productId → package). */
export async function getPackages(): Promise<PurchasesPackage[]> {
  if (!configured) return [];
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current?.availablePackages ?? [];
  } catch {
    return [];
  }
}

export class PurchaseCancelled extends Error {}

/** Purchase the package whose store product matches productId. Throws PurchaseCancelled on user cancel. */
export async function purchaseByProductId(productId: string): Promise<CustomerInfo> {
  if (!configured) throw new Error('Store not available');
  const pkgs = await getPackages();
  // iOS product id === productId exactly; Google Play (SDK v6+) reports "subId:basePlanId",
  // so fall back to a prefix match when the Play subscription id equals our productId.
  const pkg = pkgs.find(p => p.product.identifier === productId)
    ?? pkgs.find(p => p.product.identifier.startsWith(`${productId}:`));
  if (!pkg) throw new Error('Product not available');
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo;
  } catch (e) {
    if ((e as { userCancelled?: boolean }).userCancelled) throw new PurchaseCancelled();
    throw e;
  }
}

export async function restore(): Promise<CustomerInfo | null> {
  if (!configured) return null;
  return Purchases.restorePurchases();
}

/** Verify-on-open: nudge RC to sync (catches renewals). Backend status stays the credit truth. */
export async function refreshCustomerInfo(): Promise<void> {
  if (!configured) return;
  try { await Purchases.getCustomerInfo(); } catch { /* offline — leave as-is */ }
}

/** Deep-link to the OS subscription-management screen. */
export async function openManageSubscriptions(): Promise<void> {
  const url = Platform.OS === 'ios'
    ? 'https://apps.apple.com/account/subscriptions'
    : 'https://play.google.com/store/account/subscriptions';
  try { await Linking.openURL(url); } catch { /* store not available */ }
}

export { ALL_PRODUCT_IDS };
