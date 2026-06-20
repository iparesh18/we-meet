import { useMemo } from 'react';
import { useTracks } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { MonitorUp, Video } from 'lucide-react';
import VideoTile from './VideoTile.jsx';
import ScreenShareView from './ScreenShareView.jsx';

function trackKey(t) {
  return `${t.participant?.identity || 'p'}-${t.source}-${t.publication?.trackSid || 'ph'}`;
}

function roleOf(participant) {
  try {
    const meta = participant?.metadata ? JSON.parse(participant.metadata) : null;
    return meta?.role || null;
  } catch {
    return null;
  }
}

function galleryCols(n) {
  if (n <= 1) return 'grid-cols-1';
  if (n === 2) return 'grid-cols-1 sm:grid-cols-2';
  if (n <= 4) return 'grid-cols-2';
  if (n <= 9) return 'grid-cols-2 sm:grid-cols-3';
  return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';
}

function EmptyStage({ label }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl bg-slate-800 text-slate-400">
      <Video size={40} className="mb-3 opacity-60" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

/**
 * Renders the classroom stage for the given `layout`.
 *
 * Main-view priority (does NOT follow the active speaker):
 *   1. Screen share, whenever the host is sharing.
 *   2. A student the host has explicitly pinned (`pinnedIdentity`, host view only).
 *   3. The host's own camera — the default for everyone.
 *
 * `onTogglePin` is passed only from the host room, so pin controls and pinning
 * are host-only; students always see the host (or the screen share) as main.
 *
 * When `studentView` is set, the stage only ever shows the host, any captains
 * (co-hosts), and the student's own self-view — other students are filtered out
 * (the SFU also blocks the underlying subscriptions; see StudentPrivacyGuard).
 * The host view leaves `studentView` off and therefore sees everyone.
 */
export default function Stage({
  layout = 'speaker',
  pinnedIdentity = null,
  onTogglePin = null,
  studentView = false,
}) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  // Students only ever see the host and captains (camera + screen share) plus
  // their own tile; other students are filtered out.
  const visibleTracks = useMemo(() => {
    if (!studentView) return tracks;
    return tracks.filter((t) => {
      if (t.participant?.isLocal) return true;
      const role = roleOf(t.participant);
      return role === 'host' || role === 'captain';
    });
  }, [tracks, studentView]);

  const cameraTracks = useMemo(
    () => visibleTracks.filter((t) => t.source === Track.Source.Camera),
    [visibleTracks]
  );
  const screenTrack = useMemo(
    () => visibleTracks.find((t) => t.source === Track.Source.ScreenShare) || null,
    [visibleTracks]
  );

  const mainCamera = useMemo(() => {
    if (!cameraTracks.length) return null;
    // 1) the host's explicit pin (host view only)
    if (pinnedIdentity) {
      const pinned = cameraTracks.find((t) => t.participant?.identity === pinnedIdentity);
      if (pinned) return pinned;
    }
    // 2) the host's camera is always the default main view
    const host = cameraTracks.find((t) => roleOf(t.participant) === 'host');
    if (host) return host;
    // 3) fallback: first available camera
    return cameraTracks[0];
  }, [cameraTracks, pinnedIdentity]);

  // Pin controls are rendered only when the host passes `onTogglePin`.
  const pinProps = (t) => ({
    onPin: onTogglePin,
    isPinned: !!pinnedIdentity && t?.participant?.identity === pinnedIdentity,
  });

  if (!cameraTracks.length && !screenTrack) {
    return (
      <div className="h-full p-3 sm:p-4">
        <EmptyStage label="Waiting for participants to turn on their cameras…" />
      </div>
    );
  }

  const effectiveLayout = screenTrack && layout === 'gallery' ? 'gallery-screen' : screenTrack ? 'screen' : layout;
  const stripTracks = cameraTracks; // for screen/speaker we show all cameras in the strip

  // ---- GALLERY (no screen) ----
  if (effectiveLayout === 'gallery') {
    return (
      <div className="h-full overflow-y-auto p-3 no-scrollbar sm:p-4">
        <div className={`grid gap-3 ${galleryCols(cameraTracks.length)}`}>
          {cameraTracks.map((t) => (
            <div key={trackKey(t)} className="aspect-video">
              <VideoTile trackRef={t} className="h-full w-full" {...pinProps(t)} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---- GALLERY + SCREEN ----
  if (effectiveLayout === 'gallery-screen') {
    return (
      <div className="flex h-full flex-col gap-3 p-3 sm:p-4">
        <div className="min-h-0 flex-[3]">
          <ScreenShareView trackRef={screenTrack} className="h-full w-full" />
        </div>
        <div className="min-h-0 flex-[2] overflow-y-auto no-scrollbar">
          <div className={`grid gap-3 ${galleryCols(cameraTracks.length)}`}>
            {cameraTracks.map((t) => (
              <div key={trackKey(t)} className="aspect-video">
                <VideoTile trackRef={t} compact className="h-full w-full" {...pinProps(t)} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ---- SIDEBAR ----
  if (effectiveLayout === 'sidebar') {
    const main = screenTrack || mainCamera;
    const others = screenTrack ? cameraTracks : cameraTracks.filter((t) => t !== main);
    return (
      <div className="flex h-full flex-col gap-3 p-3 sm:flex-row sm:p-4">
        <div className="min-h-0 min-w-0 flex-1">
          {main ? (
            screenTrack ? (
              <ScreenShareView trackRef={screenTrack} className="h-full w-full" />
            ) : (
              <VideoTile trackRef={main} className="h-full w-full" {...pinProps(main)} />
            )
          ) : (
            <EmptyStage label="No active video" />
          )}
        </div>
        <div className="flex max-h-32 gap-3 overflow-x-auto no-scrollbar sm:max-h-none sm:w-44 sm:flex-col sm:overflow-y-auto lg:w-52">
          {others.map((t) => (
            <div key={trackKey(t)} className="aspect-video w-44 shrink-0 sm:w-full">
              <VideoTile trackRef={t} compact className="h-full w-full" {...pinProps(t)} />
            </div>
          ))}
          {!others.length && (
            <div className="grid w-44 shrink-0 place-items-center rounded-2xl bg-slate-800 text-xs text-slate-400 sm:w-full sm:py-8">
              No other participants
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---- SPEAKER & SCREEN (main + bottom filmstrip) ----
  const main = screenTrack || mainCamera;
  const strip = screenTrack ? stripTracks : cameraTracks.filter((t) => t !== main);

  return (
    <div className="flex h-full flex-col gap-3 p-3 sm:p-4">
      <div className="relative min-h-0 flex-1">
        {main ? (
          screenTrack ? (
            <ScreenShareView trackRef={screenTrack} className="h-full w-full" />
          ) : (
            <VideoTile trackRef={main} className="h-full w-full" {...pinProps(main)} />
          )
        ) : (
          <EmptyStage label="No active video" />
        )}
        {screenTrack && (
          <span className="chip absolute right-3 top-3 bg-brand-500/90 text-xs text-white shadow-soft">
            <MonitorUp size={13} /> Screen sharing active
          </span>
        )}
      </div>
      {strip.length > 0 && (
        <div className="flex h-24 shrink-0 gap-3 overflow-x-auto no-scrollbar sm:h-28">
          {strip.map((t) => (
            <div key={trackKey(t)} className="aspect-video h-full shrink-0">
              <VideoTile trackRef={t} compact className="h-full w-full" {...pinProps(t)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
