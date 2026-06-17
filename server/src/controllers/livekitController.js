import { asyncHandler } from '../utils/asyncHandler.js';
import * as livekit from '../services/livekitService.js';
import * as store from '../store/index.js';
import { ApiError } from '../utils/ApiError.js';
import { sanitizeName } from '../utils/sanitize.js';

export const hostToken = asyncHandler(async (req, res) => {
  const cls = req.classSession; // set by verifyHostKey
  const name = sanitizeName(req.body?.name || 'Host') || 'Host';
  const data = await livekit.createToken({
    room: cls.roomName,
    identity: `host-${cls.classCode}`,
    name,
    role: 'host',
  });
  res.json(data);
});

export const studentToken = asyncHandler(async (req, res) => {
  const { participantId } = req.body || {};
  const p = await store.getParticipantById(participantId);
  if (!p) throw new ApiError(404, 'Participant not found');
  if (p.status !== 'admitted') {
    throw new ApiError(403, 'You are not admitted to this class.', { reason: p.status });
  }

  const cls = await store.getClassByCode(p.classCode);
  if (!cls) throw new ApiError(404, 'Class not found');
  if (!cls.isLive) throw new ApiError(410, 'This class has ended.', { reason: 'ended' });

  const identity = p.livekitIdentity || `student-${p.id}`;
  if (!p.livekitIdentity) {
    await store.updateParticipant(p.id, { livekitIdentity: identity });
  }

  const data = await livekit.createToken({
    room: cls.roomName,
    identity,
    name: p.name,
    role: 'student',
  });
  res.json(data);
});
