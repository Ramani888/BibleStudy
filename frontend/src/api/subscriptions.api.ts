import { apiGet } from './client';
import type { SubscriptionStatus } from '../types';

// RevenueCat is the sole entitlement source; purchases go through the RC SDK and the backend grants
// via the webhook. The legacy POST /subscriptions/verify was removed (see backend PLAN.md #20).
export const subscriptionsApi = {
  status: () => apiGet<SubscriptionStatus>('/subscriptions/status'),
};
