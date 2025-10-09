import { Router } from 'express';
import {
  inventoryReportController,
  remesasReportController,
  exportCsvController,
} from '../controllers/reports.controller.js';
import { requireAuth } from '../shared/auth.middleware.js';

const router = Router();
router.use(requireAuth);

router.get('/inventory', inventoryReportController);
router.get('/remesas', remesasReportController);
router.get('/export/csv', exportCsvController);

export default router;
