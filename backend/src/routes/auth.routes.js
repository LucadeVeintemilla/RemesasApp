import { Router } from 'express';
import { loginController, createAdminController } from '../controllers/auth.controller.js';
import { requireAuth, requireAdmin } from '../shared/auth.middleware.js';

const router = Router();

router.post('/login', loginController);
router.post('/admins', requireAuth, requireAdmin, createAdminController);

export default router;
