import * as store from '../store/index.js';
import { ApiError } from '../utils/ApiError.js';
import { sanitizeName } from '../utils/sanitize.js';
import { getIO, rooms } from '../socket/io.js';
import * as livekit from './livekitService.js';

function waitingView(p) {
  return { id: p.id, name: p.name, status: p.status, requestedAt: p.requestedAt };
}

function admittedView(p) {
  return {
    id: p.id,
    name: p.name,
    status: p.status,
    admittedAt: p.admittedAt,
    leftAt: p.leftAt,
    role: p.role || 'student',
  };
}

async function emitLists(classCode) {
  const all = await store.getParticipantsByClass(classCode);
  const waiting = all.filter((p) => p.status === 'waiting').map(waitingView);
  const admitted = all.filter((p) => p.status === 'admitted').map(admittedView);
  const io = getIO();
  io?.to(rooms.host(classCode)).emit('waiting-list-updated', { waiting });
  io?.to(rooms.class(classCode)).emit('participants-updated', {
    admitted,
    count: admitted.length,
  });
}

export async function joinRequest({ classCode, name, deviceId }) {
  const cls = await store.getClassByCode(classCode);
  if (!cls) throw new ApiError(404, 'Class not found');
  if (!cls.isLive) throw new ApiError(410, 'This class has ended', { reason: 'ended' });
  if (cls.isLocked) {
    throw new ApiError(423, 'This class is locked. You cannot join now.', { reason: 'locked' });
  }

  const cleanName = sanitizeName(name);
  if (!cleanName || cleanName.length < 2) {
    throw new ApiError(400, 'Please enter a valid name (at least 2 characters).');
  }

  if (deviceId) {
    const blocked = await store.findBlockedByDevice(classCode, deviceId);
    if (blocked) {
      const reason = blocked.status; // 'removed' | 'rejected'
      const message =
        reason === 'removed'
          ? 'You were removed from this class and cannot rejoin.'
          : 'You were not admitted to this class.';
      throw new ApiError(403, message, { reason });
    }
  }

  const participant = await store.createParticipant({
    classId: cls.id,
    classCode,
    name: cleanName,
    deviceId: deviceId || null,
    status: 'waiting',
    requestedAt: new Date(),
    livekitIdentity: null,
  });

  const io = getIO();
  io?.to(rooms.host(classCode)).emit('new-waiting-student', { student: waitingView(participant) });
  await emitLists(classCode);

  return { participantId: participant.id, status: participant.status, name: participant.name };
}

function assertSameClass(participant, classCode) {
  if (classCode && participant.classCode !== classCode) {
    throw new ApiError(403, 'Participant does not belong to this class');
  }
}

export async function admit(participantId, classCode) {
  const p = await store.getParticipantById(participantId);
  if (!p) throw new ApiError(404, 'Participant not found');
  assertSameClass(p, classCode);
  if (p.status === 'admitted') return p;

  const updated = await store.updateParticipant(participantId, {
    status: 'admitted',
    admittedAt: p.admittedAt || new Date(),
    removedAt: null,
    leftAt: null,
    livekitIdentity: `student-${participantId}`,
  });

  getIO()
    ?.to(rooms.participant(participantId))
    .emit('student-admitted', { participantId, classCode: p.classCode });
  await emitLists(p.classCode);
  return updated;
}

export async function reject(participantId, classCode) {
  const p = await store.getParticipantById(participantId);
  if (!p) throw new ApiError(404, 'Participant not found');
  assertSameClass(p, classCode);

  const updated = await store.updateParticipant(participantId, { status: 'rejected' });
  getIO()?.to(rooms.participant(participantId)).emit('student-rejected', { participantId });
  await emitLists(p.classCode);
  return updated;
}

export async function remove(participantId, classCode) {
  const p = await store.getParticipantById(participantId);
  if (!p) throw new ApiError(404, 'Participant not found');
  assertSameClass(p, classCode);

  const updated = await store.updateParticipant(participantId, {
    status: 'removed',
    removedAt: new Date(),
  });

  const cls = await store.getClassByCode(p.classCode);
  if (cls && p.livekitIdentity) {
    await livekit.removeParticipantFromRoom(cls.roomName, p.livekitIdentity);
  }

  getIO()?.to(rooms.participant(participantId)).emit('student-removed', { participantId });
  await emitLists(p.classCode);
  return updated;
}

/**
 * Promote an admitted student to captain (a co-host) or demote them back.
 * Notifies the participant so their client can swap to / from the host UI, and
 * refreshes the roster so other students update who may subscribe to their media.
 */
export async function setCaptain(participantId, classCode, makeCaptain) {
  const p = await store.getParticipantById(participantId);
  if (!p) throw new ApiError(404, 'Participant not found');
  assertSameClass(p, classCode);
  if (p.status !== 'admitted') {
    throw new ApiError(400, 'Only students who are in the class can be made captain');
  }

  const role = makeCaptain ? 'captain' : 'student';
  if ((p.role || 'student') === role) return p;

  const updated = await store.updateParticipant(participantId, { role });
  getIO()
    ?.to(rooms.participant(participantId))
    .emit(makeCaptain ? 'captain-promoted' : 'captain-demoted', {
      participantId,
      classCode: p.classCode,
    });
  await emitLists(p.classCode);
  return updated;
}

/** Identities (`captain-<id>`) of every admitted captain in the class. */
export async function captainIdentities(classCode) {
  const all = await store.getParticipantsByClass(classCode);
  return all
    .filter((p) => p.role === 'captain' && p.status === 'admitted')
    .map((p) => `captain-${p.id}`);
}

/** Explicit "Leave" (student clicked leave / cancelled waiting). */
export async function leave(participantId) {
  const p = await store.getParticipantById(participantId);
  if (!p) return null;
  if (p.status === 'admitted' || p.status === 'waiting') {
    await store.updateParticipant(participantId, { status: 'left', leftAt: new Date() });
    await emitLists(p.classCode);
  }
  return true;
}

/** Socket disconnect — record last-seen time but keep them admitted so refresh works. */
export async function markDisconnected(participantId) {
  const p = await store.getParticipantById(participantId);
  if (!p) return;
  if (p.status === 'admitted') {
    await store.updateParticipant(participantId, { leftAt: new Date() });
    await emitLists(p.classCode);
  }
}

/** Student reconnected to the live room — clear the last-seen marker. */
export async function markRejoined(participantId) {
  const p = await store.getParticipantById(participantId);
  if (p && p.status === 'admitted' && p.leftAt) {
    await store.updateParticipant(participantId, { leftAt: null });
    await emitLists(p.classCode);
  }
}

export async function getStatus(participantId) {
  const p = await store.getParticipantById(participantId);
  if (!p) throw new ApiError(404, 'Participant not found');
  return { participantId: p.id, classCode: p.classCode, name: p.name, status: p.status };
}

export async function listForClass(classCode) {
  return store.getParticipantsByClass(classCode);
}
