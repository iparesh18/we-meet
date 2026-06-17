import { Router } from 'express';
import * as ctrl from '../controllers/livekitController.js';
import { verifyHostKey } from '../middleware/verifyHostKey.js';
import { joinLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/host-token', verifyHostKey, ctrl.hostToken);
router.post('/student-token', joinLimiter, ctrl.studentToken);

export default router;
