import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LiveKitRoom, RoomAudioRenderer, useParticipants } from '@livekit/components-react';
import { LogOut, Users, User, LayoutGrid, Megaphone, X, MicOff } from 'lucide-react';
import Logo from '../components/ui/Logo.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import Stage from '../components/Stage.jsx';
import MediaControls from '../components/MediaControls.jsx';
import ControlButton from '../components/ControlButton.jsx';
import ConnectionStatus from '../components/ConnectionStatus.jsx';
import VideoDisabledStage from '../components/VideoDisabledStage.jsx';
import RemoteMuteHandler from '../components/RemoteMuteHandler.jsx';
import { api } from '../lib/api.js';
import { getSocket } from '../lib/socket.js';
import { loadParticipant, clearParticipant } from '../lib/storage.js';
import { roomOptions } from '../lib/livekitQuality.js';

function ParticipantCount() {
  const participants = useParticipants();
  return (
    <span className="chip bg-white/10 text-xs text-white">
      <Users size={14} /> {participants.length}
    </span>
  );
}

export default function StudentRoom() {
  const { classCode } = useParams();
  const code = (classCode || '').toUpperCase();
  const navigate = useNavigate();
  const participant = loadParticipant(code);

  const [phase, setPhase] = useState('loading'); // loading | live | novideo | error
  const [conn, setConn] = useState(null); // { token, url }
  const [error, setError] = useState('');
  const [layout, setLayout] = useState('speaker');
  const [announcement, setAnnouncement] = useState(null);
  const [mutedByHost, setMutedByHost] = useState(false);
  const prefs = participant?.prefs || { cam: true, mic: true };
  const leftRef = useRef(false);

  const handleMutedByHost = useCallback(() => setMutedByHost(true), []);

  useEffect(() => {
    if (!participant?.participantId) {
      navigate(`/join/${code}`, { replace: true });
      return;
    }
    const pid = participant.participantId;
    const socket = getSocket();
    let active = true;

    (async () => {
      try {
        const status = await api.participantStatus(pid);
        if (!active) return;
        if (status.status === 'waiting') return navigate(`/waiting/${code}`, { replace: true });
        if (status.status === 'rejected') return navigate('/rejected', { replace: true });
        if (status.status === 'removed') return navigate('/removed', { replace: true });
        if (status.status === 'left') return navigate(`/join/${code}`, { replace: true });

        // admitted — get a LiveKit token
        try {
          const data = await api.studentToken(pid, participant.name);
          if (!active) return;
          setConn({ token: data.token, url: data.url });
          setPhase('live');
        } catch (tokenErr) {
          if (!active) return;
          if (tokenErr.status === 503) {
            setPhase('novideo');
          } else if (tokenErr.details?.reason === 'removed') {
            navigate('/removed', { replace: true });
          } else if (tokenErr.details?.reason === 'ended' || tokenErr.status === 410) {
            navigate('/ended', { replace: true });
          } else {
            setError(tokenErr.message || 'Could not connect to the class.');
            setPhase('error');
          }
        }
      } catch (e) {
        if (!active) return;
        if (e.status === 404) navigate(`/join/${code}`, { replace: true });
        else {
          setError(e.message || 'Something went wrong.');
          setPhase('error');
        }
      }
    })();

    socket.emit('student-join-live', { classCode: code, participantId: pid });

    const onRemoved = () => navigate('/removed', { replace: true });
    const onEnded = () => navigate('/ended', { replace: true });
    const onAnnouncement = (a) => setAnnouncement(a);
    const onConnect = () => socket.emit('student-join-live', { classCode: code, participantId: pid });

    socket.on('student-removed', onRemoved);
    socket.on('room-ended', onEnded);
    socket.on('announcement', onAnnouncement);
    socket.on('connect', onConnect);

    return () => {
      active = false;
      socket.off('student-removed', onRemoved);
      socket.off('room-ended', onEnded);
      socket.off('announcement', onAnnouncement);
      socket.off('connect', onConnect);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const leave = () => {
    if (leftRef.current) return;
    leftRef.current = true;
    const pid = participant?.participantId;
    if (pid) getSocket().emit('participant-left', { classCode: code, participantId: pid });
    clearParticipant(code);
    navigate('/', { replace: true });
  };

  if (phase === 'loading') {
    return (
      <div className="grid min-h-dvh place-items-center bg-slate-900 text-slate-300">
        <div className="flex flex-col items-center gap-3">
          <Spinner size={28} className="text-brand-400" />
          <p className="text-sm">Joining the classroom…</p>
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="grid min-h-dvh place-items-center bg-slate-900 px-5 text-center text-slate-300">
        <div>
          <p className="text-lg font-semibold text-white">Couldn't join the class</p>
          <p className="mt-2 text-sm text-slate-400">{error}</p>
          <button onClick={() => navigate('/')} className="btn btn-primary mt-6">
            Back to home
          </button>
        </div>
      </div>
    );
  }

  const TopBar = (
    <header className="flex shrink-0 items-center justify-between gap-3 bg-slate-900 px-4 py-3 text-white">
      <Logo light />
      <div className="flex items-center gap-2">
        {phase === 'live' && <ConnectionStatus />}
        <span className="chip hidden bg-white/10 text-xs text-white sm:inline-flex">
          Code <strong className="ml-1 tracking-widest">{code}</strong>
        </span>
        {phase === 'live' && <ParticipantCount />}
      </div>
    </header>
  );

  const Banner = announcement && (
    <div className="flex items-start gap-2 bg-brand-gradient px-4 py-2.5 text-sm text-white">
      <Megaphone size={16} className="mt-0.5 shrink-0" />
      <p className="flex-1">{announcement.message}</p>
      <button onClick={() => setAnnouncement(null)} className="shrink-0 opacity-80 hover:opacity-100">
        <X size={16} />
      </button>
    </div>
  );

  const MutedBanner = mutedByHost && (
    <div className="flex items-center gap-2 bg-amber-500 px-4 py-2.5 text-sm font-medium text-white">
      <MicOff size={16} className="shrink-0" />
      <p className="flex-1">You were muted by the host.</p>
      <button onClick={() => setMutedByHost(false)} className="shrink-0 opacity-80 hover:opacity-100">
        <X size={16} />
      </button>
    </div>
  );

  if (phase === 'novideo') {
    return (
      <div className="flex h-dvh flex-col bg-slate-950">
        {TopBar}
        {Banner}
        <div className="min-h-0 flex-1">
          <VideoDisabledStage />
        </div>
        <div className="flex items-center justify-center gap-4 bg-slate-900 px-4 py-3">
          <ControlButton icon={LogOut} label="Leave" tone="danger" onClick={leave} />
        </div>
      </div>
    );
  }

  return (
    <LiveKitRoom
      serverUrl={conn.url}
      token={conn.token}
      connect
      video={prefs.cam}
      audio={prefs.mic}
      options={roomOptions}
      onMediaDeviceFailure={(failure) =>
        console.warn('[livekit] media device unavailable:', failure)
      }
      onError={(e) => console.warn('[livekit] room error:', e?.message || e)}
      className="flex h-dvh flex-col bg-slate-950"
    >
      <RemoteMuteHandler onMuted={handleMutedByHost} />
      {TopBar}
      {Banner}
      {MutedBanner}
      <div className="min-h-0 flex-1">
        <Stage layout={layout} />
      </div>

      <div className="flex items-center justify-between gap-3 bg-slate-900 px-4 py-3">
          <div className="hidden w-28 sm:block" />
          <div className="flex flex-1 items-center justify-center gap-3 sm:gap-4">
            <MediaControls withScreenShare={false} />
            <ControlButton icon={LogOut} label="Leave" tone="danger" onClick={leave} />
          </div>
          <div className="flex w-28 items-center justify-end gap-1 rounded-2xl bg-slate-800 p-1">
            <button
              onClick={() => setLayout('speaker')}
              title="Speaker view"
              className={`grid h-9 w-9 place-items-center rounded-xl transition ${
                layout === 'speaker' ? 'bg-white text-slate-900' : 'text-slate-300 hover:text-white'
              }`}
            >
              <User size={16} />
            </button>
            <button
              onClick={() => setLayout('gallery')}
              title="Gallery view"
              className={`grid h-9 w-9 place-items-center rounded-xl transition ${
                layout === 'gallery' ? 'bg-white text-slate-900' : 'text-slate-300 hover:text-white'
              }`}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
        <RoomAudioRenderer />
      </LiveKitRoom>
  );
}
