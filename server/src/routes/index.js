import { Router } from 'express';
import classes from './classes.js';
import participants from './participants.js';
import livekit from './livekit.js';
import attendance from './attendance.js';
import { configured } from '../services/livekitService.js';
import { getStoreMode } from '../store/index.js';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ ok: true, livekit: configured(), store: getStoreMode() });
});

router.use('/classes', classes);
router.use('/participants', participants);
router.use('/livekit', livekit);
router.use('/attendance', attendance);

export default router;
