import { Router } from 'express';
import * as plansController from './plans.controller';
import { validate } from '../../middlewares/validate.middleware';
import { authMiddleware } from '../../middlewares/auth.middleware';
import { CreatePlanDto, UpdatePlanDto, AddStepDto, ReorderStepsDto } from './plans.dto';

const router = Router();

router.use(authMiddleware);

router.post('/',                validate(CreatePlanDto), plansController.createPlan);
router.get('/',                 plansController.listPlans);
router.get('/group/:groupId',   plansController.listGroupPlans);
router.get('/:id/members-progress', plansController.getMembersProgress);
router.get('/:id',             plansController.getPlan);
router.patch('/:id',           validate(UpdatePlanDto), plansController.updatePlan);
router.delete('/:id',          plansController.deletePlan);

router.post('/:id/steps',      validate(AddStepDto), plansController.addStep);
router.patch('/:id/steps/reorder', validate(ReorderStepsDto), plansController.reorderSteps);
router.delete('/steps/:stepId', plansController.removeStep);

router.post('/steps/:stepId/complete',   plansController.completeStep);
router.delete('/steps/:stepId/complete', plansController.uncompleteStep);

export default router;
