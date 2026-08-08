import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { plansApi } from '../api';
import type { CreatePlanPayload } from '../types';

export function usePlans() {
  return useQuery({ queryKey: ['plans'], queryFn: () => plansApi.list() });
}

export function usePlan(id: string) {
  return useQuery({ queryKey: ['plans', id], queryFn: () => plansApi.get(id), enabled: !!id });
}

export function useGroupPlans(groupId: string) {
  return useQuery({
    queryKey: ['groupPlans', groupId],
    queryFn: () => plansApi.listGroup(groupId),
    enabled: !!groupId,
  });
}

export function useMembersProgress(planId: string) {
  return useQuery({
    queryKey: ['plans', planId, 'members'],
    queryFn: () => plansApi.membersProgress(planId),
    enabled: !!planId,
  });
}

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePlanPayload) => plansApi.create(payload),
    onSuccess: (_data, payload) => {
      qc.invalidateQueries({ queryKey: ['plans'] });
      if (payload.groupId) qc.invalidateQueries({ queryKey: ['groupPlans', payload.groupId] });
    },
  });
}

export function useDeletePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => plansApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plans'] }),
  });
}

export function useToggleStep(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ stepId, completed }: { stepId: string; completed: boolean }) =>
      completed ? plansApi.uncompleteStep(stepId) : plansApi.completeStep(stepId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plans', planId] });
      qc.invalidateQueries({ queryKey: ['plans'] });
      qc.invalidateQueries({ queryKey: ['groupPlans'] });   // group plan lists show my progress
      qc.invalidateQueries({ queryKey: ['credits'] });      // "Finished a Plan" may grant credits
      qc.invalidateQueries({ queryKey: ['achievements'] });
    },
  });
}
