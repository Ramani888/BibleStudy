import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { plansApi } from '../api';
import type { CreatePlanPayload } from '../types';

export function usePlans() {
  return useQuery({ queryKey: ['plans'], queryFn: () => plansApi.list() });
}

export function usePlan(id: string) {
  return useQuery({ queryKey: ['plans', id], queryFn: () => plansApi.get(id), enabled: !!id });
}

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePlanPayload) => plansApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plans'] }),
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
      qc.invalidateQueries({ queryKey: ['credits'] });
      qc.invalidateQueries({ queryKey: ['achievements'] });
    },
  });
}
