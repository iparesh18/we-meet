import { useEffect, useState } from 'react';
import { useMaybeRoomContext } from '@livekit/components-react';
import { ConnectionState } from 'livekit-client';
import { Loader2, WifiOff } from 'lucide-react';

/**
 * Small pill that surfaces the LiveKit connection state (connecting/reconnecting).
 * Uses the optional room context so it safely renders nothing if it ever ends up
 * outside a <LiveKitRoom>.
 */
export default function ConnectionStatus() {
  const room = useMaybeRoomContext();
  const [state, setState] = useState(room?.state ?? ConnectionState.Disconnected);

  useEffect(() => {
    if (!room) return undefined;
    setState(room.state);
    const onChange = (s) => setState(s);
    room.on('connectionStateChanged', onChange);
    return () => {
      room.off('connectionStateChanged', onChange);
    };
  }, [room]);

  if (!room || state === ConnectionState.Connected) return null;

  const map = {
    [ConnectionState.Connecting]: { text: 'Connecting…', spin: true, tone: 'bg-amber-500' },
    [ConnectionState.Reconnecting]: { text: 'Reconnecting…', spin: true, tone: 'bg-amber-500' },
    [ConnectionState.SignalReconnecting]: { text: 'Reconnecting…', spin: true, tone: 'bg-amber-500' },
    [ConnectionState.Disconnected]: { text: 'Disconnected', spin: false, tone: 'bg-slate-600' },
  };
  const cfg = map[state] || { text: 'Connecting…', spin: true, tone: 'bg-slate-600' };
  const Icon = cfg.spin ? Loader2 : WifiOff;

  return (
    <span className={`chip ${cfg.tone} text-xs text-white shadow-soft`}>
      <Icon size={13} className={cfg.spin ? 'animate-spin' : ''} />
      {cfg.text}
    </span>
  );
}
