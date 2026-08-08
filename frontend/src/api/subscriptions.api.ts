import { apiGet, apiPost } from './client';
import type { SubscriptionStatus, VerifyPurchasePayload, VerifyPurchaseResult } from '../types';

export const subscriptionsApi = {
  status: () => apiGet<SubscriptionStatus>('/subscriptions/status'),
  verify: (payload: VerifyPurchasePayload) => apiPost<VerifyPurchaseResult>('/subscriptions/verify', payload),
};
