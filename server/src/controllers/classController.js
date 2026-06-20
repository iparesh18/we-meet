import { asyncHandler } from '../utils/asyncHandler.js';
import * as classService from '../services/classService.js';
import { sanitizeCode, sanitizeText } from '../utils/sanitize.js';

export const createClass = asyncHandler(async (req, res) => {
  const title = sanitizeText(req.body?.title || '', 80) || 'Swastik Class';
  const cls = await classService.createClass({ title });
  res.status(201).json({
    classCode: cls.classCode,
    hostKey: cls.hostKey,
    roomName: cls.roomName,
    inviteLink: cls.inviteLink,
    privateHostLink: cls.privateHostLink,
    isLive: cls.isLive,
    isLocked: cls.isLocked,
    startedAt: cls.startedAt,
    title: cls.title,
  });
});

export const getPublic = asyncHandler(async (req, res) => {
  const code = sanitizeCode(req.params.classCode);
  res.json(await classService.getPublic(code));
});

export const getHost = asyncHandler(async (req, res) => {
  const includePrivate = req.controller?.role === 'host';
  res.json(await classService.getForHost(req.classSession.classCode, { includePrivate }));
});

export const lock = asyncHandler(async (req, res) => {
  res.json(await classService.setLock(req.classSession.classCode, true));
});

export const unlock = asyncHandler(async (req, res) => {
  res.json(await classService.setLock(req.classSession.classCode, false));
});

export const end = asyncHandler(async (req, res) => {
  res.json(await classService.endClass(req.classSession.classCode));
});
