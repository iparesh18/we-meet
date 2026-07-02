import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Mic, MicOff, Video, VideoOff, ArrowRight, AlertCircle, CameraOff } from 'lucide-react';
import Logo from '../components/ui/Logo.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { useMediaPreview } from '../hooks/useMediaPreview.js';
import { api } from '../lib/api.js';
import { getDeviceId, saveParticipant, loadParticipant } from '../lib/storage.js';

export default function JoinPage() {
  const { classCode } = useParams();
  const code = (classCode || '').toUpperCase();
  const navigate = useNavigate();

  const saved = loadParticipant(code);
  const [name, setName] = useState(saved?.name || '');
  const [phase, setPhase] = useState('loading'); // loading | ready | error
  const [classError, setClassError] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);

  const preview = useMediaPreview({
    initialCam: saved?.prefs?.cam ?? true,
    initialMic: saved?.prefs?.mic ?? true,
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const cls = await api.getPublicClass(code);
        if (!active) return;
        if (!cls.isLive) return navigate('/ended', { replace: true });
        if (cls.isLocked) return navigate('/locked', { replace: true });
        setPhase('ready');
      } catch (e) {
        if (!active) return;
        setClassError(
          e.status === 404 ? "We couldn't find a class with this code." : e.message || 'Something went wrong.'
        );
        setPhase('error');
      }
    })();
    return () => {
      active = false;
    };
  }, [code, navigate]);

  const canJoin = useMemo(() => name.trim().length >= 2 && !joining, [name, joining]);

  const handleJoin = async () => {
    setJoinError('');
    if (name.trim().length < 2) {
      setJoinError('Please enter your name (at least 2 characters).');
      return;
    }
    setJoining(true);
    try {
      const res = await api.joinRequest({
        classCode: code,
        name: name.trim(),
        deviceId: getDeviceId(),
      });
      saveParticipant(code, {
        participantId: res.participantId,
        name: res.name,
        prefs: { cam: preview.camOn, mic: preview.micOn },
      });
      preview.stop();
      navigate(`/waiting/${code}`, { replace: true });
    } catch (e) {
      setJoining(false);
      const reason = e.details?.reason;
      if (e.status === 423 || reason === 'locked') return navigate('/locked', { replace: true });
      if (e.status === 410 || reason === 'ended') return navigate('/ended', { replace: true });
      if (reason === 'removed') return navigate('/removed', { replace: true });
      if (reason === 'rejected') return navigate('/rejected', { replace: true });
      setJoinError(e.message || 'Could not join the class. Please try again.');
    }
  };

  if (phase === 'loading') {
    return (
      <div className="grid min-h-dvh place-items-center bg-mesh text-slate-500">
        <div className="flex flex-col items-center gap-3">
          <Spinner size={28} className="text-brand-500" />
          <p className="text-sm">Loading class…</p>
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="grid min-h-dvh place-items-center bg-mesh px-5">
        <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white/80 p-8 text-center shadow-card backdrop-blur-xl">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-red-100 text-red-500">
            <AlertCircle size={32} />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">Class not found</h1>
          <p className="mt-2 text-slate-500">{classError}</p>
          <button onClick={() => navigate('/')} className="btn btn-primary mt-6 w-full">
            Back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-mesh">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <Logo />
        <span className="chip bg-white/70 text-slate-500 backdrop-blur">
          Class code <strong className="ml-1 tracking-widest text-brand-600">{code}</strong>
        </span>
      </header>

      <main className="mx-auto grid max-w-5xl items-center gap-8 px-5 py-6 lg:grid-cols-2 lg:py-12">
        {/* Camera preview */}
        <div className="animate-scale-in">
          <div className="relative aspect-video overflow-hidden rounded-3xl bg-slate-900 shadow-card ring-1 ring-slate-200">
            {preview.camOn ? (
              <video
                ref={preview.videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-slate-400">
                <CameraOff size={40} />
                <p className="text-sm">Your camera is off</p>
              </div>
            )}

            {/* preview controls */}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-3 bg-gradient-to-t from-black/60 to-transparent p-4">
              <button
                onClick={preview.toggleMic}
                className={`grid h-12 w-12 place-items-center rounded-2xl shadow-lg transition active:scale-95 ${
                  preview.micOn ? 'bg-white text-slate-800' : 'bg-red-500 text-white'
                }`}
                title={preview.micOn ? 'Mute microphone' : 'Unmute microphone'}
              >
                {preview.micOn ? <Mic size={20} /> : <MicOff size={20} />}
              </button>
              <button
                onClick={preview.toggleCam}
                className={`grid h-12 w-12 place-items-center rounded-2xl shadow-lg transition active:scale-95 ${
                  preview.camOn ? 'bg-white text-slate-800' : 'bg-red-500 text-white'
                }`}
                title={preview.camOn ? 'Turn camera off' : 'Turn camera on'}
              >
                {preview.camOn ? <Video size={20} /> : <VideoOff size={20} />}
              </button>
            </div>
          </div>
          {preview.error && (
            <p className="mt-3 flex items-center gap-2 text-sm text-amber-600">
              <AlertCircle size={15} /> {preview.error}
            </p>
          )}
        </div>

        {/* Join form */}
        <div className="animate-fade-up">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Ready to join?</h1>
          <p className="mt-2 text-slate-500">
            Check your camera and mic, enter your name, then request to join. The host will admit
            you in a moment.
          </p>

          <label className="mt-6 block text-sm font-semibold text-slate-700">Your name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && canJoin && handleJoin()}
            placeholder="e.g. Priya Sharma"
            maxLength={60}
            autoFocus
            className="input mt-2"
          />

          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <span className={`chip ${preview.micOn ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
              {preview.micOn ? <Mic size={14} /> : <MicOff size={14} />}
              {preview.micOn ? 'Mic on' : 'Mic off'}
            </span>
            <span className={`chip ${preview.camOn ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
              {preview.camOn ? <Video size={14} /> : <VideoOff size={14} />}
              {preview.camOn ? 'Camera on' : 'Camera off'}
            </span>
          </div>

          {joinError && <p className="mt-4 text-sm font-medium text-red-500">{joinError}</p>}

          <button onClick={handleJoin} disabled={!canJoin} className="btn btn-primary mt-6 w-full py-3.5 text-base">
            {joining ? <Spinner size={18} /> : <ArrowRight size={18} />}
            {joining ? 'Requesting to join…' : 'Join Class'}
          </button>
          <p className="mt-3 text-center text-xs text-slate-400">
            You can change your mic and camera anytime during class.
          </p>
        </div>
      </main>
    </div>
  );
}
