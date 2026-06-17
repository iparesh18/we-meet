import * as store from '../store/index.js';
import { ApiError } from '../utils/ApiError.js';
import { generateClassCode, generateHostKey } from '../utils/codes.js';
import { getIO, rooms } from '../socket/io.js';

function publicView(cls) {
  return {
    classCode: cls.classCode,
    title: cls.title,
    roomName: cls.roomName,
    isLive: cls.isLive,
    isLocked: cls.isLocked,
    startedAt: cls.startedAt,
    endedAt: cls.endedAt,
  };
}

export async function createClass({ title } = {}) {
  let classCode = generateClassCode(6);
  // Extremely unlikely collision, but make sure the code is unique.
  for (let i = 0; i < 5; i++) {
    const existing = await store.getClassByCode(classCode);
    if (!existing) break;
    classCode = generateClassCode(6);
  }

  const hostKey = generateHostKey();
  const roomName = `swastik-${classCode}`;
  const inviteLink = `/join/${classCode}`;
  const privateHostLink = `/host/${classCode}?hostKey=${hostKey}`;

  return store.createClass({
    title: title || 'Swastik Class',
    classCode,
    roomName,
    hostKey,
    inviteLink,
    privateHostLink,
    isLive: true,
    isLocked: false,
    startedAt: new Date(),
    endedAt: null,
  });
}

export async function getPublic(classCode) {
  const cls = await store.getClassByCode(classCode);
  if (!cls) throw new ApiError(404, 'Class not found');
  return publicView(cls);
}

export async function getForHost(classCode) {
  const cls = await store.getClassByCode(classCode);
  if (!cls) throw new ApiError(404, 'Class not found');
  const participants = await store.getParticipantsByClass(classCode);
  return {
    class: {
      ...publicView(cls),
      inviteLink: cls.inviteLink,
      privateHostLink: cls.privateHostLink,
    },
    participants,
  };
}

export async function setLock(classCode, locked) {
  const cls = await store.updateClass(classCode, { isLocked: locked });
  if (!cls) throw new ApiError(404, 'Class not found');
  getIO()
    ?.to(rooms.class(classCode))
    .emit(locked ? 'room-locked' : 'room-unlocked', { classCode });
  return publicView(cls);
}

export async function endClass(classCode) {
  const cls = await store.updateClass(classCode, { isLive: false, endedAt: new Date() });
  if (!cls) throw new ApiError(404, 'Class not found');
  getIO()?.to(rooms.class(classCode)).emit('room-ended', { classCode });
  return publicView(cls);
}
