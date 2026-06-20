import { Router } from 'express';
import * as ctrl from '../controllers/attendanceController.js';
import { verifyController } from '../middleware/verifyController.js';

const router = Router();

// Host or captain may download attendance.
router.get('/:classCode', verifyController, ctrl.download);

export default router;
