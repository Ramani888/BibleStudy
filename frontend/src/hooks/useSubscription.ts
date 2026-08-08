import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useIAP, finishTransaction, type Purchase } from 'react-native-iap';

import { subscriptionsApi, authApi, getErrorMessage } from '../api';
import { useAuthStore } from '../store/auth.store';
import { getPlatformReceipt, currentStore, syncEntitlementOnOpen, ALL_PRODUCT_IDS } from '../utils/iap';
import type { SubscriptionStatus } from '../types';

/** Backend-recorded status (cheap; recomputes expiry, downgrades a lapsed record to FREE). */
export function useSubscriptionStatus() {
  return useQuery<SubscriptionStatus>({
    queryKey: ['subscription', 'status'],
    queryFn: () => subscriptionsApi.status(),
  });
}

/** Verify-on-open: re-sync entitlement once when the authed app mounts (E decision #1). */
export function useSubscriptionSync() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const updateUser = useAuthStore(s => s.updateUser);
  const qc = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    (async () => {
      await syncEntitlementOnOpen();
      if (cancelled) return;
      try { updateUser(await authApi.me()); } catch { /* keep cached user */ }
      qc.invalidateQueries({ queryKey: ['subscription'] });
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated, updateUser, qc]);
}

/** Purchase/restore flow over react-native-iap (event-based via useIAP). */
export function useIapSubscriptions() {
  const qc = useQueryClient();
  const updateUser = useAuthStore(s => s.updateUser);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    try { updateUser(await authApi.me()); } catch { /* keep cached */ }
    qc.invalidateQueries({ queryKey: ['credits'] });
    qc.invalidateQueries({ queryKey: ['subscription'] });
  }, [qc, updateUser]);

  const handleSuccess = useCallback(async (purchase: Purchase) => {
    try {
      const receipt = await getPlatformReceipt((purchase as { purchaseToken?: string | null }).purchaseToken);
      if (!receipt) throw new Error('Could not read purchase receipt');
      await subscriptionsApi.verify({ platform: currentStore(), productId: purchase.productId, receipt });
      await finishTransaction({ purchase, isConsumable: false });
      await refreshUser();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setProcessing(false);
    }
  }, [refreshUser]);

  const { connected, subscriptions, fetchProducts, requestPurchase } = useIAP({
    onPurchaseSuccess: handleSuccess,
    onPurchaseError: (e) => { setError(e.message); setProcessing(false); },
  });

  const loadProducts = useCallback(() => {
    fetchProducts({ skus: ALL_PRODUCT_IDS, type: 'subs' }).catch(() => { /* store not ready */ });
  }, [fetchProducts]);

  const buy = useCallback((productId: string) => {
    setError(null);
    setProcessing(true);
    requestPurchase({ type: 'subs', request: { apple: { sku: productId }, google: { skus: [productId] } } })
      .catch((e: unknown) => { setError(getErrorMessage(e)); setProcessing(false); });
  }, [requestPurchase]);

  const restore = useCallback(async () => {
    setError(null);
    setProcessing(true);
    try { await syncEntitlementOnOpen(); await refreshUser(); }
    catch (e) { setError(getErrorMessage(e)); }
    finally { setProcessing(false); }
  }, [refreshUser]);

  return { connected, subscriptions, loadProducts, buy, restore, processing, error };
}
