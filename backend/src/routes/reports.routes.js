import { Router } from 'express';
import {
  inventoryReportController,
  remesasReportController,
  exportCsvController,
  exportPdfController,
} from '../controllers/reports.controller.js';
import { requireAuth } from '../shared/auth.middleware.js';

const router = Router();
router.use(requireAuth);

router.get('/inventory', inventoryReportController);
router.get('/remesas', remesasReportController);
router.get('/export/csv', exportCsvController);
router.get('/export/pdf', exportPdfController);

export default router;
