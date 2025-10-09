import { Router } from 'express';
import {
  createRemesaController,
  listRemesasController,
  getRemesaController,
  confirmRemesaController,
  cancelRemesaController,
  listPendingForDniController,
  markDeliveredController,
} from '../controllers/remesas.controller.js';
import { requireAuth } from '../shared/auth.middleware.js';

const router = Router();
router.use(requireAuth);

router.get('/', listRemesasController);
router.get('/:id', getRemesaController);
router.post('/', createRemesaController);
router.post('/:id/confirm', confirmRemesaController);
router.post('/:id/cancel', cancelRemesaController);
router.get('/pending/by-dni/:dni', listPendingForDniController);
router.post('/:id/deliver', markDeliveredController);

export default router;
