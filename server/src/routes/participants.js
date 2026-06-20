import { Router } from 'express';
import * as ctrl from '../controllers/participantController.js';
import { verifyController } from '../middleware/verifyController.js';
import { joinLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/join-request', joinLimiter, ctrl.joinRequest);
router.get('/status/:participantId', ctrl.status);
// Host or captain may admit/reject/remove students and read the roster.
router.post('/:participantId/admit', verifyController, ctrl.admit);
router.post('/:participantId/reject', verifyController, ctrl.reject);
router.post('/:participantId/remove', verifyController, ctrl.remove);
router.get('/:classCode', verifyController, ctrl.list);

export default router;
