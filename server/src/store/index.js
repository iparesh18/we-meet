import mongoose from 'mongoose';
import { ClassSession } from '../models/ClassSession.js';
import { Participant } from '../models/Participant.js';
import { generateId } from '../utils/codes.js';
import { logger } from '../utils/logger.js';

/**
 * Repository layer. Uses MongoDB/Mongoose when available, otherwise an
 * in-memory store with the exact same async interface. Controllers/services
 * never touch the models directly — they go through here.
 */

let mode = 'memory';
const mem = {
  classes: new Map(), // classCode -> class object
  participants: new Map(), // id -> participant object
};

export function initStore(useMongo) {
  mode = useMongo ? 'mongo' : 'memory';
  logger.info(`[store] Using ${mode === 'mongo' ? 'MongoDB' : 'in-memory'} store`);
}

export function getStoreMode() {
  return mode;
}

// --- helpers ---------------------------------------------------------------

function serialize(doc) {
  if (!doc) return null;
  if (doc._id !== undefined) {
    const out = { ...doc, id: doc._id.toString() };
    delete out._id;
    delete out.__v;
    if (out.classId && typeof out.classId.toString === 'function') {
      out.classId = out.classId.toString();
    }
    return out;
  }
  return { ...doc };
}

function isValidObjectId(id) {
  return typeof id === 'string' && mongoose.isValidObjectId(id);
}

// --- classes ---------------------------------------------------------------

export async function createClass(data) {
  if (mode === 'mongo') {
    const doc = await ClassSession.create(data);
    return serialize(doc.toObject());
  }
  const now = new Date();
  const cls = {
    id: generateId(),
    title: data.title || 'Swastik Class',
    classCode: data.classCode,
    roomName: data.roomName,
    hostKey: data.hostKey,
    inviteLink: data.inviteLink,
    privateHostLink: data.privateHostLink,
    isLive: data.isLive ?? true,
    isLocked: data.isLocked ?? false,
    startedAt: data.startedAt || now,
    endedAt: data.endedAt || null,
    createdAt: now,
    updatedAt: now,
  };
  mem.classes.set(cls.classCode, cls);
  return { ...cls };
}

export async function getClassByCode(classCode) {
  if (!classCode) return null;
  if (mode === 'mongo') {
    return serialize(await ClassSession.findOne({ classCode }).lean());
  }
  const cls = mem.classes.get(classCode);
  return cls ? { ...cls } : null;
}

export async function updateClass(classCode, updates) {
  if (mode === 'mongo') {
    return serialize(
      await ClassSession.findOneAndUpdate(
        { classCode },
        { $set: updates },
        { new: true }
      ).lean()
    );
  }
  const cls = mem.classes.get(classCode);
  if (!cls) return null;
  Object.assign(cls, updates, { updatedAt: new Date() });
  return { ...cls };
}

// --- participants ----------------------------------------------------------

export async function createParticipant(data) {
  if (mode === 'mongo') {
    const doc = await Participant.create(data);
    return serialize(doc.toObject());
  }
  const now = new Date();
  const participant = {
    id: generateId(),
    classId: data.classId || null,
    classCode: data.classCode,
    name: data.name,
    socketId: data.socketId || null,
    livekitIdentity: data.livekitIdentity || null,
    deviceId: data.deviceId || null,
    role: data.role || 'student',
    status: data.status || 'waiting',
    requestedAt: data.requestedAt || now,
    admittedAt: data.admittedAt || null,
    removedAt: data.removedAt || null,
    leftAt: data.leftAt || null,
    createdAt: now,
    updatedAt: now,
  };
  mem.participants.set(participant.id, participant);
  return { ...participant };
}

export async function getParticipantById(id) {
  if (!id) return null;
  if (mode === 'mongo') {
    if (!isValidObjectId(id)) return null;
    return serialize(await Participant.findById(id).lean());
  }
  const p = mem.participants.get(id);
  return p ? { ...p } : null;
}

export async function updateParticipant(id, updates) {
  if (mode === 'mongo') {
    if (!isValidObjectId(id)) return null;
    return serialize(
      await Participant.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean()
    );
  }
  const p = mem.participants.get(id);
  if (!p) return null;
  Object.assign(p, updates, { updatedAt: new Date() });
  return { ...p };
}

export async function setParticipantSocket(id, socketId) {
  return updateParticipant(id, { socketId });
}

export async function getParticipantsByClass(classCode) {
  if (mode === 'mongo') {
    const docs = await Participant.find({ classCode }).sort({ createdAt: 1 }).lean();
    return docs.map(serialize);
  }
  return [...mem.participants.values()]
    .filter((p) => p.classCode === classCode)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map((p) => ({ ...p }));
}

/** Has this device already been removed/rejected from this class? */
export async function findBlockedByDevice(classCode, deviceId) {
  if (!deviceId) return null;
  if (mode === 'mongo') {
    return serialize(
      await Participant.findOne({
        classCode,
        deviceId,
        status: { $in: ['removed', 'rejected'] },
      }).lean()
    );
  }
  const found = [...mem.participants.values()].find(
    (p) =>
      p.classCode === classCode &&
      p.deviceId === deviceId &&
      (p.status === 'removed' || p.status === 'rejected')
  );
  return found ? { ...found } : null;
}
