import { setIO, getIO, rooms } from './io.js';
import * as store from '../store/index.js';
import { safeEqual } from '../utils/security.js';
import { sanitizeCode, sanitizeText } from '../utils/sanitize.js';
import * as participantService from '../services/participantService.js';
import * as classService from '../services/classService.js';
import * as livekitService from '../services/livekitService.js';

async function verifyHost(classCode, hostKey) {
  const cls = await store.getClassByCode(classCode);
  if (!cls) return null;
  if (!hostKey || !safeEqual(String(hostKey), cls.hostKey)) return null;
  return cls;
}

export function initSocket(io) {
  setIO(io);

  io.on('connection', (socket) => {
    // ---- presence / room membership ----
    socket.on('host-join-room', async (payload = {}, cb) => {
      const classCode = sanitizeCode(payload.classCode);
      const cls = await verifyHost(classCode, payload.hostKey);
      if (!cls) {
        cb?.({ ok: false, error: 'Invalid host key' });
        return;
      }
      socket.data.role = 'host';
      socket.data.classCode = classCode;
      socket.join(rooms.host(classCode));
      socket.join(rooms.class(classCode));

      const all = await store.getParticipantsByClass(classCode);
      cb?.({
        ok: true,
        waiting: all
          .filter((p) => p.status === 'waiting')
          .map((p) => ({ id: p.id, name: p.name, requestedAt: p.requestedAt, status: p.status })),
        admitted: all
          .filter((p) => p.status === 'admitted')
          .map((p) => ({ id: p.id, name: p.name, admittedAt: p.admittedAt, leftAt: p.leftAt, status: p.status })),
      });
    });

    socket.on('student-join-waiting', async (payload = {}) => {
      const classCode = sanitizeCode(payload.classCode);
      const p = await store.getParticipantById(payload.participantId);
      if (!p || p.classCode !== classCode) return;
      socket.data.role = 'student';
      socket.data.classCode = classCode;
      socket.data.participantId = p.id;
      socket.join(rooms.class(classCode));
      socket.join(rooms.participant(p.id));
      await store.setParticipantSocket(p.id, socket.id);
    });

    socket.on('student-join-live', async (payload = {}) => {
      const classCode = sanitizeCode(payload.classCode);
      const p = await store.getParticipantById(payload.participantId);
      if (!p || p.classCode !== classCode) return;
      socket.data.role = 'student';
      socket.data.classCode = classCode;
      socket.data.participantId = p.id;
      socket.join(rooms.class(classCode));
      socket.join(rooms.participant(p.id));
      await store.setParticipantSocket(p.id, socket.id);
      await participantService.markRejoined(p.id);
    });

    // ---- host mutations (also exposed over REST; both verify the host key) ----
    socket.on('host-allow-student', async (payload = {}, cb) => {
      const cls = await verifyHost(sanitizeCode(payload.classCode), payload.hostKey);
      if (!cls) return cb?.({ ok: false, error: 'Invalid host key' });
      await participantService.admit(payload.participantId, cls.classCode);
      cb?.({ ok: true });
    });

    socket.on('host-reject-student', async (payload = {}, cb) => {
      const cls = await verifyHost(sanitizeCode(payload.classCode), payload.hostKey);
      if (!cls) return cb?.({ ok: false, error: 'Invalid host key' });
      await participantService.reject(payload.participantId, cls.classCode);
      cb?.({ ok: true });
    });

    socket.on('host-remove-student', async (payload = {}, cb) => {
      const cls = await verifyHost(sanitizeCode(payload.classCode), payload.hostKey);
      if (!cls) return cb?.({ ok: false, error: 'Invalid host key' });
      await participantService.remove(payload.participantId, cls.classCode);
      cb?.({ ok: true });
    });

    socket.on('host-lock-room', async (payload = {}, cb) => {
      const cls = await verifyHost(sanitizeCode(payload.classCode), payload.hostKey);
      if (!cls) return cb?.({ ok: false, error: 'Invalid host key' });
      await classService.setLock(cls.classCode, true);
      cb?.({ ok: true });
    });

    socket.on('host-unlock-room', async (payload = {}, cb) => {
      const cls = await verifyHost(sanitizeCode(payload.classCode), payload.hostKey);
      if (!cls) return cb?.({ ok: false, error: 'Invalid host key' });
      await classService.setLock(cls.classCode, false);
      cb?.({ ok: true });
    });

    socket.on('host-end-class', async (payload = {}, cb) => {
      const cls = await verifyHost(sanitizeCode(payload.classCode), payload.hostKey);
      if (!cls) return cb?.({ ok: false, error: 'Invalid host key' });
      await classService.endClass(cls.classCode);
      cb?.({ ok: true });
    });

    // ---- host mutes a single student's microphone (host-only) ----
    socket.on('host-mute-student', async (payload = {}, cb) => {
      const cls = await verifyHost(sanitizeCode(payload.classCode), payload.hostKey);
      if (!cls) return cb?.({ ok: false, error: 'Invalid host key' });

      const p = await store.getParticipantById(payload.participantId);
      if (!p || p.classCode !== cls.classCode) {
        return cb?.({ ok: false, error: 'Student not found in this class' });
      }

      // 1) Best-effort hard enforcement at the SFU (no-op if LiveKit's server API
      //    isn't configured). Mutes the published mic track server-side.
      if (p.livekitIdentity) {
        await livekitService.muteParticipantAudio(cls.roomName, p.livekitIdentity);
      }

      // 2) Reliable path: tell the student's client to mute its local mic and
      //    show a notice. Works even when the LiveKit server API is unavailable.
      getIO()?.to(rooms.participant(p.id)).emit('force-muted', { participantId: p.id });

      cb?.({ ok: true, name: p.name });
    });

    // ---- host mutes every student at once (host-only) ----
    socket.on('host-mute-all', async (payload = {}, cb) => {
      const cls = await verifyHost(sanitizeCode(payload.classCode), payload.hostKey);
      if (!cls) return cb?.({ ok: false, error: 'Invalid host key' });

      // 1) Reliable path: one broadcast to the class — every student's client
      //    mutes its local mic + shows the notice. The host doesn't listen for
      //    `force-muted`, so this only affects students.
      getIO()?.to(rooms.class(cls.classCode)).emit('force-muted', { all: true });

      // 2) Best-effort hard enforcement at the SFU for each admitted student.
      const all = await store.getParticipantsByClass(cls.classCode);
      const admitted = all.filter((p) => p.status === 'admitted' && p.livekitIdentity);
      await Promise.all(
        admitted.map((p) => livekitService.muteParticipantAudio(cls.roomName, p.livekitIdentity))
      );

      cb?.({ ok: true, count: admitted.length });
    });

    // ---- screen share status relay (LiveKit carries the media itself) ----
    socket.on('host-screen-share', async (payload = {}) => {
      const cls = await verifyHost(sanitizeCode(payload.classCode), payload.hostKey);
      if (!cls) return;
      getIO()
        ?.to(rooms.class(cls.classCode))
        .emit(payload.active ? 'screen-share-started' : 'screen-share-stopped', {
          classCode: cls.classCode,
        });
    });

    // ---- optional host announcements (host -> everyone, read-only) ----
    socket.on('host-announcement', async (payload = {}) => {
      const cls = await verifyHost(sanitizeCode(payload.classCode), payload.hostKey);
      if (!cls) return;
      const message = sanitizeText(payload.message || '', 300);
      if (!message) return;
      getIO()
        ?.to(rooms.class(cls.classCode))
        .emit('announcement', { message, at: new Date().toISOString() });
    });

    socket.on('participant-left', async (payload = {}) => {
      if (payload.participantId) await participantService.leave(payload.participantId);
    });

    socket.on('disconnect', async () => {
      const pid = socket.data.participantId;
      if (pid) await participantService.markDisconnected(pid);
    });
  });
}
