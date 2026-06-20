import { VideoTrack } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { MicOff, Mic, MonitorUp, Pin, PinOff, Crown } from 'lucide-react';

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || name[0].toUpperCase();
}

function roleOf(participant) {
  try {
    const meta = participant?.metadata ? JSON.parse(participant.metadata) : null;
    return meta?.role || null;
  } catch {
    return null;
  }
}

export default function VideoTile({
  trackRef,
  compact = false,
  className = '',
  onPin = null,
  isPinned = false,
}) {
  const participant = trackRef?.participant;
  const identity = participant?.identity;
  const isScreen = trackRef?.source === Track.Source.ScreenShare;
  const pub = trackRef?.publication;
  // Render the video element whenever the source is published & unmuted — this
  // lets LiveKit's adaptiveStream subscribe on demand. Show an avatar only when
  // the camera is genuinely off (no publication) or muted.
  const showVideo = Boolean(pub && !pub.isMuted);

  const name = participant?.name || participant?.identity || 'Guest';
  const isLocal = participant?.isLocal;
  const speaking = participant?.isSpeaking;
  const micOn = participant?.isMicrophoneEnabled;
  const role = roleOf(participant);
  const displayName = isLocal ? `${name} (You)` : name;

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl bg-slate-800 ring-2 transition-all duration-200 ${
        speaking && !isScreen ? 'ring-brand-400' : 'ring-transparent'
      } ${className}`}
    >
      {showVideo ? (
        <VideoTrack
          trackRef={trackRef}
          playsInline
          // Screen share must never crop (text/slides stay readable) → contain.
          // Camera tiles fill the frame → cover, and are mirrored for everyone
          // (self-view + remote). Screen share is never mirrored.
          className={`h-full w-full ${
            isScreen ? 'bg-slate-900 object-contain' : 'object-cover -scale-x-100'
          }`}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900">
          <div
            className={`grid place-items-center rounded-full bg-brand-gradient font-bold text-white shadow-soft ${
              compact ? 'h-12 w-12 text-base' : 'h-20 w-20 text-2xl'
            }`}
          >
            {initials(name)}
          </div>
        </div>
      )}

      {/* host-only pin / unpin control (top-right) */}
      {onPin && identity && !isScreen && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPin(identity);
          }}
          title={isPinned ? 'Unpin from main view' : 'Pin to main view'}
          aria-label={isPinned ? 'Unpin from main view' : 'Pin to main view'}
          className={`absolute right-2 top-2 z-10 grid place-items-center rounded-lg text-white transition ${
            compact ? 'h-7 w-7' : 'h-8 w-8'
          } ${isPinned ? 'bg-brand-500 hover:bg-brand-600' : 'bg-black/45 hover:bg-black/70'}`}
        >
          {isPinned ? <PinOff size={compact ? 13 : 15} /> : <Pin size={compact ? 13 : 15} />}
        </button>
      )}

      {/* top-left badges */}
      <div className="absolute left-2 top-2 flex items-center gap-1.5">
        {isScreen && (
          <span className="chip bg-brand-500/90 px-2 py-0.5 text-xs text-white">
            <MonitorUp size={12} /> Screen
          </span>
        )}
        {role === 'host' && !isScreen && (
          <span className="chip bg-brand-500/90 px-2 py-0.5 text-xs text-white">Host</span>
        )}
        {role === 'captain' && !isScreen && (
          <span className="chip bg-brand-500/90 px-2 py-0.5 text-xs text-white">
            <Crown size={11} /> Captain
          </span>
        )}
      </div>

      {/* bottom name bar */}
      {!isScreen && (
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-6">
          <span className={`truncate font-medium text-white ${compact ? 'text-xs' : 'text-sm'}`}>
            {displayName}
          </span>
          <span
            className={`grid place-items-center rounded-full p-1 ${
              micOn ? 'bg-white/15 text-white' : 'bg-red-500/90 text-white'
            }`}
          >
            {micOn ? <Mic size={compact ? 11 : 13} /> : <MicOff size={compact ? 11 : 13} />}
          </span>
        </div>
      )}
    </div>
  );
}
