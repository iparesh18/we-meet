import { useEffect } from 'react';
import { useConnectionState, useRoomContext } from '@livekit/components-react';
import { ConnectionState } from 'livekit-client';

/**
 * Enforces "students can only see the host (and captains)" at the LiveKit SFU.
 *
 * While connected, the student tells the server that ONLY the host and any
 * promoted captains (co-hosts) may subscribe to their published audio/video
 * (`allParticipantsAllowed = false`, with an explicit allow for each of those
 * identities). Because every student runs this, no student can ever receive
 * another (non-captain) student's media — the restriction is enforced
 * server-side, not merely hidden in the UI. The host never sets this, so the
 * host stays subscribable by everyone and students still see and hear the
 * teacher.
 *
 * Re-runs whenever the connection becomes `Connected` (initial join and after a
 * reconnect) or whenever the captain set changes, so the permission is always
 * re-applied — including when the host promotes/demotes a captain mid-class.
 * Must be rendered inside <LiveKitRoom>. Renders nothing.
 */
export default function StudentPrivacyGuard({ hostIdentity, captains = [] }) {
  const room = useRoomContext();
  const connectionState = useConnectionState();

  // Stable dependency for the captain list (array identity changes every render).
  const captainsKey = captains.join('|');

  useEffect(() => {
    if (!room || !hostIdentity) return;
    if (connectionState !== ConnectionState.Connected) return;
    try {
      const allowed = [
        { participantIdentity: hostIdentity, allowAll: true },
        ...captains
          .filter(Boolean)
          .map((identity) => ({ participantIdentity: identity, allowAll: true })),
      ];
      room.localParticipant.setTrackSubscriptionPermissions(false, allowed);
    } catch (e) {
      console.warn('[privacy] could not restrict subscriptions to host/captains:', e?.message || e);
    }
  }, [room, connectionState, hostIdentity, captainsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
