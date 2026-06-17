import { Router } from 'express';
import * as ctrl from '../controllers/participantController.js';
import { verifyHostKey } from '../middleware/verifyHostKey.js';
import { joinLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/join-request', joinLimiter, ctrl.joinRequest);
router.get('/status/:participantId', ctrl.status);
router.post('/:participantId/admit', verifyHostKey, ctrl.admit);
router.post('/:participantId/reject', verifyHostKey, ctrl.reject);
router.post('/:participantId/remove', verifyHostKey, ctrl.remove);
router.get('/:classCode', verifyHostKey, ctrl.list);

export default router;
