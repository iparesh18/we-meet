import * as store from '../store/index.js';
import { ApiError } from '../utils/ApiError.js';
import { safeEqual } from '../utils/security.js';
import { sanitizeCode } from '../utils/sanitize.js';

/**
 * Gatekeeps actions that BOTH the host and a captain may perform
 * (admit/reject/remove/lock/unlock/end/attendance/…).
 *
 * Authorization is granted when either:
 *   - a valid host key is supplied (the teacher), or
 *   - a `captainId` is supplied that maps to a participant who is currently an
 *     admitted captain of this class. Because the captain's role is re-checked
 *     on every request, demoting them (role -> 'student') revokes access at once.
 *
 * On success it attaches `req.classSession` and `req.controller` ({ role,
 * participantId? }). Host-only actions (promote/demote a captain) keep using
 * `verifyHostKey` instead.
 */
export const verifyController = async (req, res, next) => {
  try {
    const classCode = sanitizeCode(req.params.classCode || req.body?.classCode || '');
    const hostKey = (req.body?.hostKey || req.query?.hostKey || '').toString();
    const captainId = (req.body?.captainId || req.query?.captainId || '').toString();

    if (!classCode) throw new ApiError(400, 'classCode is required');

    const cls = await store.getClassByCode(classCode);
    if (!cls) throw new ApiError(404, 'Class not found');

    if (hostKey && safeEqual(hostKey, cls.hostKey)) {
      req.classSession = cls;
      req.controller = { role: 'host' };
      return next();
    }

    if (captainId) {
      const p = await store.getParticipantById(captainId);
      if (p && p.classCode === cls.classCode && p.role === 'captain' && p.status === 'admitted') {
        req.classSession = cls;
        req.controller = { role: 'captain', participantId: p.id };
        return next();
      }
    }

    throw new ApiError(403, 'Host or captain authorization required');
  } catch (err) {
    next(err);
  }
};
