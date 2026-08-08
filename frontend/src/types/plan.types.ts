export interface PlanListItem {
  id: string;
  title: string;
  description: string | null;
  totalSteps: number;
  completedSteps: number;
  createdAt: string;
}

export interface PlanStepSet {
  id: string;
  title: string;
  color: string | null;
  cardCount: number;
}

export interface PlanStep {
  id: string;
  order: number;
  title: string | null;
  set: PlanStepSet | null;
  completed: boolean;
  completedAt: string | null;
}

export interface PlanDetail {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  totalSteps: number;
  completedSteps: number;
  steps: PlanStep[];
}

export interface CreatePlanPayload {
  title: string;
  description?: string;
  setIds: string[];
  groupId?: string; // present → group plan (admins only)
}

export interface MemberProgress {
  userId: string;
  name: string;
  profileImage: string | null;
  completed: number;
  total: number;
}
