import { Router } from 'express';
import * as ctrl from '../controllers/classController.js';
import { verifyController } from '../middleware/verifyController.js';
import { createLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/create', createLimiter, ctrl.createClass);
router.get('/:classCode/public', ctrl.getPublic);
// Host or captain may open the control view / change lock / end the class.
router.get('/:classCode/host', verifyController, ctrl.getHost);
router.post('/:classCode/lock', verifyController, ctrl.lock);
router.post('/:classCode/unlock', verifyController, ctrl.unlock);
router.post('/:classCode/end', verifyController, ctrl.end);

export default router;
