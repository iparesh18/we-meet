import { Router } from 'express';
import * as ctrl from '../controllers/classController.js';
import { verifyHostKey } from '../middleware/verifyHostKey.js';
import { createLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/create', createLimiter, ctrl.createClass);
router.get('/:classCode/public', ctrl.getPublic);
router.get('/:classCode/host', verifyHostKey, ctrl.getHost);
router.post('/:classCode/lock', verifyHostKey, ctrl.lock);
router.post('/:classCode/unlock', verifyHostKey, ctrl.unlock);
router.post('/:classCode/end', verifyHostKey, ctrl.end);

export default router;
