import { useLocalParticipant, useConnectionState } from '@livekit/components-react';
import { ConnectionState } from 'livekit-client';
import { Mic, MicOff, Video, VideoOff, MonitorUp, MonitorX } from 'lucide-react';
import ControlButton from './ControlButton.jsx';

/**
 * Mic / camera (and optional screen-share) buttons wired to the LiveKit local
 * participant. Must be rendered inside a <LiveKitRoom>.
 */
export default function MediaControls({ withScreenShare = false, onScreenShareChange }) {
  const { localParticipant, isCameraEnabled, isMicrophoneEnabled, isScreenShareEnabled } =
    useLocalParticipant();
  const state = useConnectionState();
  const connected = state === ConnectionState.Connected;

  const toggleMic = async () => {
    if (!localParticipant) return;
    await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
  };

  const toggleCam = async () => {
    if (!localParticipant) return;
    await localParticipant.setCameraEnabled(!isCameraEnabled);
  };

  const toggleScreen = async () => {
    if (!localParticipant) return;
    const next = !isScreenShareEnabled;
    try {
      await localParticipant.setScreenShareEnabled(next);
      onScreenShareChange?.(next);
    } catch {
      /* user dismissed the screen picker — no-op */
    }
  };

  return (
    <>
      <ControlButton
        icon={isMicrophoneEnabled ? Mic : MicOff}
        label={isMicrophoneEnabled ? 'Mute' : 'Unmute'}
        tone={isMicrophoneEnabled ? 'active' : 'danger'}
        onClick={toggleMic}
        disabled={!connected}
      />
      <ControlButton
        icon={isCameraEnabled ? Video : VideoOff}
        label={isCameraEnabled ? 'Camera' : 'Camera'}
        tone={isCameraEnabled ? 'active' : 'danger'}
        onClick={toggleCam}
        disabled={!connected}
      />
      {withScreenShare && (
        <ControlButton
          icon={isScreenShareEnabled ? MonitorX : MonitorUp}
          label={isScreenShareEnabled ? 'Stop Share' : 'Share'}
          tone={isScreenShareEnabled ? 'primary' : 'default'}
          onClick={toggleScreen}
          disabled={!connected}
        />
      )}
    </>
  );
}
