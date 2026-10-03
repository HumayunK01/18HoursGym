import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.middleware.js';
import { ROLES } from '../config/constants.js';
import { createPlanSchema, updatePlanSchema } from '../types/schemas/plan.schema.js';
import { createClassSchema } from '../types/schemas/class.schema.js';
import {
  uuidParamSchema,
  paginationQuerySchema,
  memberQuerySchema,
} from '../types/schemas/common.schema.js';
import { z } from 'zod';

export const adminRouter = Router();

// Enforce BFLA: Must be authenticated and have ADMIN role
adminRouter.use(requireAuth, requireRole([ROLES.ADMIN]));

// KPI Analytics Overview
adminRouter.get('/analytics/overview', AdminController.getOverview);

// Member Roster & Account Moderation
adminRouter.get('/members', validateQuery(memberQuerySchema), AdminController.getMembers);
adminRouter.patch(
  '/members/:id/status',
  validateParams(uuidParamSchema),
  validateBody(z.object({ status: z.enum(['ACTIVE', 'SUSPENDED']) }).strict()),
  AdminController.updateMemberStatus
);

// Membership Plans Administration
adminRouter.post('/plans', validateBody(createPlanSchema), AdminController.createPlan);
adminRouter.patch(
  '/plans/:id',
  validateParams(uuidParamSchema),
  validateBody(updatePlanSchema),
  AdminController.updatePlan
);

// Class Scheduling Administration
adminRouter.post('/classes', validateBody(createClassSchema), AdminController.createClass);

// Payment & Revenue Ledger
adminRouter.get('/payments', validateQuery(paginationQuerySchema), AdminController.getPayments);
