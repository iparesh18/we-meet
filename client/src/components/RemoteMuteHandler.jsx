import { useEffect } from 'react';
import { useLocalParticipant } from '@livekit/components-react';
import { getSocket } from '../lib/socket.js';

/**
 * Listens for the host's `force-muted` command and mutes the student's local
 * microphone. Must be rendered *inside* <LiveKitRoom> because it uses the local
 * participant hook. Renders nothing.
 *
 * Note: this is a one-shot mute (matching the existing mic-control behaviour) —
 * the student can still manually unmute afterwards. The server also mutes the
 * track at the SFU as a best-effort enforcement layer (see livekitService).
 */
export default function RemoteMuteHandler({ onMuted }) {
  const { localParticipant } = useLocalParticipant();

  useEffect(() => {
    const socket = getSocket();
    const onForceMuted = async () => {
      try {
        if (localParticipant?.isMicrophoneEnabled) {
          await localParticipant.setMicrophoneEnabled(false);
        }
      } catch {
        /* track may already be off — ignore */
      }
      onMuted?.();
    };
    socket.on('force-muted', onForceMuted);
    return () => socket.off('force-muted', onForceMuted);
  }, [localParticipant, onMuted]);

  return null;
}
