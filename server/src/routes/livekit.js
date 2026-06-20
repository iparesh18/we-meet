import { Router } from 'express';
import * as ctrl from '../controllers/livekitController.js';
import { verifyHostKey } from '../middleware/verifyHostKey.js';
import { verifyController } from '../middleware/verifyController.js';
import { joinLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/host-token', verifyHostKey, ctrl.hostToken);
router.post('/student-token', joinLimiter, ctrl.studentToken);
// A promoted captain swaps their student token for a captain (co-host) token.
router.post('/captain-token', verifyController, ctrl.captainToken);

export default router;
