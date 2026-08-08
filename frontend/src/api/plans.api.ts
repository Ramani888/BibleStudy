import { apiGet, apiPost, apiPatch, apiDelete } from './client';
import type { PlanListItem, PlanDetail, CreatePlanPayload, MemberProgress } from '../types';

export const plansApi = {
  list: () => apiGet<PlanListItem[]>('/plans'),
  listGroup: (groupId: string) => apiGet<PlanListItem[]>(`/plans/group/${groupId}`),
  membersProgress: (id: string) => apiGet<MemberProgress[]>(`/plans/${id}/members-progress`),
  get: (id: string) => apiGet<PlanDetail>(`/plans/${id}`),
  create: (payload: CreatePlanPayload) => apiPost<PlanDetail>('/plans', payload),
  update: (id: string, payload: { title?: string; description?: string | null }) =>
    apiPatch<void>(`/plans/${id}`, payload),
  remove: (id: string) => apiDelete(`/plans/${id}`),
  completeStep: (stepId: string) => apiPost<void>(`/plans/steps/${stepId}/complete`),
  uncompleteStep: (stepId: string) => apiDelete(`/plans/steps/${stepId}/complete`),
};
