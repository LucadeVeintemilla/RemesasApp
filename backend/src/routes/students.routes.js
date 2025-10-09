import { Router } from 'express';
import {
  createStudentController,
  listStudentsController,
  getStudentController,
  updateStudentController,
  deleteStudentController,
} from '../controllers/students.controller.js';
import { requireAuth } from '../shared/auth.middleware.js';

const router = Router();
router.use(requireAuth);

router.get('/', listStudentsController);
router.get('/:id', getStudentController);
router.post('/', createStudentController);
router.put('/:id', updateStudentController);
router.delete('/:id', deleteStudentController);

export default router;
