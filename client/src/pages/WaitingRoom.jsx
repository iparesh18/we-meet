import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LogOut, Hand } from 'lucide-react';
import Logo from '../components/ui/Logo.jsx';
import { api } from '../lib/api.js';
import { getSocket } from '../lib/socket.js';
import { loadParticipant, clearParticipant } from '../lib/storage.js';

export default function WaitingRoom() {
  const { classCode } = useParams();
  const code = (classCode || '').toUpperCase();
  const navigate = useNavigate();
  const participant = loadParticipant(code);
  const [locked, setLocked] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => {
    if (!participant?.participantId) {
      navigate(`/join/${code}`, { replace: true });
      return;
    }
    const pid = participant.participantId;
    const socket = getSocket();

    const routeForStatus = (status) => {
      if (status === 'admitted') navigate(`/student/${code}`, { replace: true });
      else if (status === 'rejected') navigate('/rejected', { replace: true });
      else if (status === 'removed') navigate('/removed', { replace: true });
      else if (status === 'left') navigate(`/join/${code}`, { replace: true });
    };

    const syncStatus = async () => {
      try {
        const res = await api.participantStatus(pid);
        routeForStatus(res.status);
      } catch (e) {
        if (e.status === 404) navigate(`/join/${code}`, { replace: true });
      }
    };

    const joinWaiting = () => socket.emit('student-join-waiting', { classCode: code, participantId: pid });

    // initial sync (handles refresh) + join the waiting channel
    syncStatus();
    joinWaiting();

    const onAdmitted = () => navigate(`/student/${code}`, { replace: true });
    const onRejected = () => navigate('/rejected', { replace: true });
    const onRemoved = () => navigate('/removed', { replace: true });
    const onEnded = () => navigate('/ended', { replace: true });
    const onLocked = () => setLocked(true);
    const onUnlocked = () => setLocked(false);
    const onConnect = () => {
      joinWaiting();
      syncStatus();
    };

    socket.on('student-admitted', onAdmitted);
    socket.on('student-rejected', onRejected);
    socket.on('student-removed', onRemoved);
    socket.on('room-ended', onEnded);
    socket.on('room-locked', onLocked);
    socket.on('room-unlocked', onUnlocked);
    socket.on('connect', onConnect);

    // Safety-net poll in case a socket event is missed.
    pollRef.current = setInterval(syncStatus, 6000);

    return () => {
      socket.off('student-admitted', onAdmitted);
      socket.off('student-rejected', onRejected);
      socket.off('student-removed', onRemoved);
      socket.off('room-ended', onEnded);
      socket.off('room-locked', onLocked);
      socket.off('room-unlocked', onUnlocked);
      socket.off('connect', onConnect);
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const leave = () => {
    const pid = participant?.participantId;
    if (pid) getSocket().emit('participant-left', { classCode: code, participantId: pid });
    clearParticipant(code);
    navigate('/', { replace: true });
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-mesh px-5">
      <div className="absolute top-6 left-1/2 -translate-x-1/2">
        <Logo />
      </div>

      <div className="w-full max-w-md animate-scale-in rounded-3xl border border-slate-100 bg-white/80 p-8 text-center shadow-card backdrop-blur-xl sm:p-10">
        {/* pulsing avatar */}
        <div className="relative mx-auto mb-7 grid h-24 w-24 place-items-center">
          <span className="absolute inset-0 animate-pulse-ring rounded-full bg-brand-400/40" />
          <span className="absolute inset-0 animate-pulse-ring rounded-full bg-brand-400/30" style={{ animationDelay: '0.6s' }} />
          <span className="relative grid h-24 w-24 place-items-center rounded-full bg-brand-gradient text-white shadow-soft">
            <Hand size={38} />
          </span>
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Waiting for host to allow you…
        </h1>
        <p className="mt-3 text-slate-500">
          Hi <strong className="text-slate-700">{participant?.name || 'there'}</strong>, you're in
          the waiting room for class <strong className="tracking-widest text-brand-600">{code}</strong>.
          The host will admit you shortly.
        </p>

        {/* animated dots */}
        <div className="mt-6 flex items-center justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2.5 w-2.5 animate-bounce rounded-full bg-brand-400"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>

        {locked && (
          <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
            The class is currently locked, but you're still in line. The host can still admit you.
          </p>
        )}

        <button onClick={leave} className="btn btn-ghost mt-8">
          <LogOut size={16} /> Cancel & leave
        </button>
      </div>
    </div>
  );
}
