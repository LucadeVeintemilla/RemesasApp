import { Router } from 'express';
import {
  createRemesaController,
  listRemesasController,
  getRemesaController,
  confirmRemesaController,
  cancelRemesaController,
  listPendingForDniController,
  markDeliveredController,
  updateRemesaController,
} from '../controllers/remesas.controller.js';
import { requireAuth } from '../shared/auth.middleware.js';

const router = Router();
router.use(requireAuth);

router.get('/', listRemesasController);
router.get('/pending/by-dni/:dni', listPendingForDniController);
router.get('/:id', getRemesaController);
router.post('/', createRemesaController);
router.put('/:id', updateRemesaController);
router.post('/:id/confirm', confirmRemesaController);
router.post('/:id/cancel', cancelRemesaController);
router.post('/:id/deliver', markDeliveredController);

export default router;
