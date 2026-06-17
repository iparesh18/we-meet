import { Router } from 'express';
import * as ctrl from '../controllers/attendanceController.js';
import { verifyHostKey } from '../middleware/verifyHostKey.js';

const router = Router();

router.get('/:classCode', verifyHostKey, ctrl.download);

export default router;
