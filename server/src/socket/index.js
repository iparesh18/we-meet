import { setIO, getIO, rooms } from './io.js';
import * as store from '../store/index.js';
import { safeEqual } from '../utils/security.js';
import { sanitizeCode, sanitizeText } from '../utils/sanitize.js';
import * as participantService from '../services/participantService.js';
import * as classService from '../services/classService.js';

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
