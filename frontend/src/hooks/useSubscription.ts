import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { subscriptionsApi, authApi, getErrorMessage } from '../api';
import { useAuthStore } from '../store/auth.store';
import {
  identifyUser,
  refreshCustomerInfo,
  getPackages,
  purchaseByProductId,
  restore as rcRestore,
  PurchaseCancelled,
} from '../lib/purchases';
import { track } from '../lib/analytics';
import type { SubscriptionStatus } from '../types';

/** Backend-recorded status (cheap; recomputes expiry, downgrades a lapsed record to FREE). */
export function useSubscriptionStatus() {
  return useQuery<SubscriptionStatus>({
    queryKey: ['subscription', 'status'],
    queryFn: () => subscriptionsApi.status(),
  });
}

/**
 * Verify-on-open (E decision #1): link the RC user + nudge RC to sync once when the authed
 * app mounts, then refresh the backend user/status. Renewals that happened while the app was
 * closed are granted by the RC webhook; this just pulls the fresh state in.
 */
export function useSubscriptionSync() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const userId = useAuthStore(s => s.user?.id);
  const updateUser = useAuthStore(s => s.updateUser);
  const qc = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated || !userId) return;
    let cancelled = false;
    (async () => {
      await identifyUser(userId);
      await refreshCustomerInfo();
      if (cancelled) return;
      // Hit /status FIRST — it reconciles the server-side entitlement (a naturally-lapsed sub
      // downgrades to FREE even without an EXPIRATION webhook), so the me() refresh below returns the
      // reconciled plan the Paywall reads. Otherwise expiry only reflects once a webhook lands.
      try { await subscriptionsApi.status(); } catch { /* offline — me() still refreshes cached state */ }
      if (cancelled) return;
      try { updateUser(await authApi.me()); } catch { /* keep cached user */ }
      qc.invalidateQueries({ queryKey: ['subscription'] });
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated, userId, updateUser, qc]);
}

/** Purchase/restore flow over RevenueCat. Backend grants credits from the RC webhook. */
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

  const loadProducts = useCallback(() => {
    getPackages().catch(() => { /* store not ready */ });
  }, []);

  const buy = useCallback(async (productId: string) => {
    setError(null);
    setProcessing(true);
    try {
      await purchaseByProductId(productId);
      track('subscribed', { productId });
      await refreshUser();
    } catch (e) {
      if (!(e instanceof PurchaseCancelled)) setError(getErrorMessage(e));
    } finally {
      setProcessing(false);
    }
  }, [refreshUser]);

  const restore = useCallback(async () => {
    setError(null);
    setProcessing(true);
    try { await rcRestore(); await refreshUser(); }
    catch (e) { setError(getErrorMessage(e)); }
    finally { setProcessing(false); }
  }, [refreshUser]);

  return { loadProducts, buy, restore, processing, error };
}
