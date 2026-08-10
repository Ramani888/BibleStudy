import { Request, Response } from 'express';
import * as plansService from './plans.service';
import { sendSuccess, handleControllerError } from '../../utils/response';

export async function createPlan(req: Request, res: Response): Promise<void> {
  try {
    const plan = await plansService.createPlan(req.user!.id, req.body);
    sendSuccess(res, plan, 'Plan created', 201);
  } catch (error) { handleControllerError(res, error, 'Failed to create plan'); }
}

export async function listPlans(req: Request, res: Response): Promise<void> {
  try {
    const plans = await plansService.listPlans(req.user!.id);
    sendSuccess(res, plans, 'Plans retrieved');
  } catch (error) { handleControllerError(res, error, 'Failed to list plans'); }
}


export async function getPlan(req: Request, res: Response): Promise<void> {
  try {
    const plan = await plansService.getPlan(req.user!.id, req.params.id);
    sendSuccess(res, plan, 'Plan retrieved');
  } catch (error) { handleControllerError(res, error, 'Failed to get plan'); }
}

export async function updatePlan(req: Request, res: Response): Promise<void> {
  try {
    await plansService.updatePlan(req.user!.id, req.params.id, req.body);
    sendSuccess(res, null, 'Plan updated');
  } catch (error) { handleControllerError(res, error, 'Failed to update plan'); }
}

export async function deletePlan(req: Request, res: Response): Promise<void> {
  try {
    await plansService.deletePlan(req.user!.id, req.params.id);
    sendSuccess(res, null, 'Plan deleted');
  } catch (error) { handleControllerError(res, error, 'Failed to delete plan'); }
}

export async function addStep(req: Request, res: Response): Promise<void> {
  try {
    const step = await plansService.addStep(req.user!.id, req.params.id, req.body);
    sendSuccess(res, step, 'Step added', 201);
  } catch (error) { handleControllerError(res, error, 'Failed to add step'); }
}

export async function removeStep(req: Request, res: Response): Promise<void> {
  try {
    await plansService.removeStep(req.user!.id, req.params.stepId);
    sendSuccess(res, null, 'Step removed');
  } catch (error) { handleControllerError(res, error, 'Failed to remove step'); }
}

export async function reorderSteps(req: Request, res: Response): Promise<void> {
  try {
    await plansService.reorderSteps(req.user!.id, req.params.id, req.body);
    sendSuccess(res, null, 'Steps reordered');
  } catch (error) { handleControllerError(res, error, 'Failed to reorder steps'); }
}

export async function completeStep(req: Request, res: Response): Promise<void> {
  try {
    await plansService.completeStep(req.user!.id, req.params.stepId);
    sendSuccess(res, null, 'Step completed');
  } catch (error) { handleControllerError(res, error, 'Failed to complete step'); }
}

export async function uncompleteStep(req: Request, res: Response): Promise<void> {
  try {
    await plansService.uncompleteStep(req.user!.id, req.params.stepId);
    sendSuccess(res, null, 'Step marked incomplete');
  } catch (error) { handleControllerError(res, error, 'Failed to update step'); }
}
