import { Router } from 'express';
import {
  createLotController,
  listLotsByProductController,
  getLotController,
  updateLotController,
  deleteLotController,
} from '../controllers/lots.controller.js';
import { requireAuth } from '../shared/auth.middleware.js';

const router = Router();
router.use(requireAuth);

router.get('/product/:productId', listLotsByProductController);
router.get('/:id', getLotController);
router.post('/', createLotController);
router.put('/:id', updateLotController);
router.delete('/:id', deleteLotController);

export default router;
