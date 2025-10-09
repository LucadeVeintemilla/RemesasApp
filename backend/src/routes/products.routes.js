import { Router } from 'express';
import {
  createProductController,
  listProductsController,
  getProductController,
  updateProductController,
  deleteProductController,
} from '../controllers/products.controller.js';
import { requireAuth } from '../shared/auth.middleware.js';

const router = Router();
router.use(requireAuth);

router.get('/', listProductsController);
router.get('/:id', getProductController);
router.post('/', createProductController);
router.put('/:id', updateProductController);
router.delete('/:id', deleteProductController);

export default router;
