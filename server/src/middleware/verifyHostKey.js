import * as store from '../store/index.js';
import { ApiError } from '../utils/ApiError.js';
import { safeEqual } from '../utils/security.js';
import { sanitizeCode } from '../utils/sanitize.js';

/**
 * Gatekeeps all host-only actions. The class code can come from the route
 * params or the body; the host key from the body or query string.
 * On success, attaches the resolved class to req.classSession.
 */
export const verifyHostKey = async (req, res, next) => {
  try {
    const classCode = sanitizeCode(req.params.classCode || req.body?.classCode || '');
    const hostKey = (req.body?.hostKey || req.query?.hostKey || '').toString();

    if (!classCode) throw new ApiError(400, 'classCode is required');

    const cls = await store.getClassByCode(classCode);
    if (!cls) throw new ApiError(404, 'Class not found');

    if (!hostKey || !safeEqual(hostKey, cls.hostKey)) {
      throw new ApiError(403, 'Invalid or missing host key');
    }

    req.classSession = cls;
    next();
  } catch (err) {
    next(err);
  }
};
