import { asyncHandler } from '../utils/asyncHandler.js';
import * as participantService from '../services/participantService.js';
import { sanitizeCode } from '../utils/sanitize.js';

export const joinRequest = asyncHandler(async (req, res) => {
  const classCode = sanitizeCode(req.body?.classCode);
  const { name, deviceId } = req.body || {};
  const result = await participantService.joinRequest({
    classCode,
    name,
    deviceId: typeof deviceId === 'string' ? deviceId.slice(0, 80) : null,
  });
  res.status(201).json(result);
});

export const admit = asyncHandler(async (req, res) => {
  res.json(await participantService.admit(req.params.participantId, req.classSession.classCode));
});

export const reject = asyncHandler(async (req, res) => {
  res.json(await participantService.reject(req.params.participantId, req.classSession.classCode));
});

export const remove = asyncHandler(async (req, res) => {
  res.json(await participantService.remove(req.params.participantId, req.classSession.classCode));
});

export const status = asyncHandler(async (req, res) => {
  res.json(await participantService.getStatus(req.params.participantId));
});

export const list = asyncHandler(async (req, res) => {
  const code = sanitizeCode(req.params.classCode);
  res.json({ participants: await participantService.listForClass(code) });
});
