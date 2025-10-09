import { Router } from 'express';
import { requireAuth, requireAdmin } from '../shared/auth.middleware.js';
import { listAdminsController } from '../controllers/admins.controller.js';

const router = Router();

router.use(requireAuth, requireAdmin);
router.get('/', listAdminsController);

export default router;
