import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import { config, isLivekitConfigured } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

let roomService = null;

function httpUrl() {
  // RoomServiceClient needs an http(s) URL; tokens use the ws(s) URL.
  return config.livekit.url.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:');
}

function getRoomService() {
  if (!isLivekitConfigured()) return null;
  if (!roomService) {
    roomService = new RoomServiceClient(httpUrl(), config.livekit.apiKey, config.livekit.apiSecret);
  }
  return roomService;
}

export function configured() {
  return isLivekitConfigured();
}

export async function createToken({ room, identity, name, role }) {
  if (!isLivekitConfigured()) {
    throw new ApiError(503, 'LiveKit is not configured on the server', {
      reason: 'livekit_unconfigured',
    });
  }
  const at = new AccessToken(config.livekit.apiKey, config.livekit.apiSecret, {
    identity,
    name,
    ttl: '6h',
    metadata: JSON.stringify({ role: role || 'student' }),
  });
  at.addGrant({
    roomJoin: true,
    room,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    roomAdmin: role === 'host',
  });
  const token = await at.toJwt();
  return { token, url: config.livekit.url, identity };
}

export async function removeParticipantFromRoom(room, identity) {
  const svc = getRoomService();
  if (!svc || !identity) return false;
  try {
    await svc.removeParticipant(room, identity);
    return true;
  } catch (err) {
    // Participant may simply not be connected to the LiveKit room — not fatal.
    logger.warn('[livekit] removeParticipant failed:', err.message);
    return false;
  }
}
