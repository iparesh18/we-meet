import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react';
import { Users, Clock, ShieldAlert, CheckCircle2, Mic, Video, MonitorUp } from 'lucide-react';
import Logo from '../components/ui/Logo.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import CopyButton from '../components/ui/CopyButton.jsx';
import Stage from '../components/Stage.jsx';
import MediaControls from '../components/MediaControls.jsx';
import ControlButton from '../components/ControlButton.jsx';
import ConnectionStatus from '../components/ConnectionStatus.jsx';
import VideoDisabledStage from '../components/VideoDisabledStage.jsx';
import HostControlBar from '../components/HostControlBar.jsx';
import RightPanel from '../components/RightPanel.jsx';
import { api } from '../lib/api.js';
import { getSocket } from '../lib/socket.js';
import { saveHostKey, loadHostKey } from '../lib/storage.js';

function byStatus(list, status) {
  return list.filter((p) => p.status === status);
}

export default function HostRoom() {
  const { classCode } = useParams();
  const code = (classCode || '').toUpperCase();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const hostKey = searchParams.get('hostKey') || loadHostKey(code) || '';

  const [phase, setPhase] = useState('loading'); // loading | live | novideo | denied | error
  const [error, setError] = useState('');
  const [conn, setConn] = useState(null);
  const [classInfo, setClassInfo] = useState(null);
  const [waiting, setWaiting] = useState([]);
  const [admitted, setAdmitted] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [busyIds, setBusyIds] = useState({});
  const [lockBusy, setLockBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [layout, setLayout] = useState('speaker');
  const [panelOpen, setPanelOpen] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  const [toast, setToast] = useState(null);

  const inviteUrl = `${window.location.origin}/join/${code}`;
  const toastTimer = useRef(null);

  const showToast = useCallback((message, kind = 'info') => {
    setToast({ message, kind });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  // ---- bootstrap ----
  useEffect(() => {
    if (!hostKey) {
      setPhase('denied');
      return;
    }
    let active = true;
    const socket = getSocket();

    (async () => {
      try {
        const data = await api.getHostClass(code, hostKey);
        if (!active) return;
        saveHostKey(code, hostKey);
        setClassInfo(data.class);
        setWaiting(byStatus(data.participants, 'waiting'));
        setAdmitted(byStatus(data.participants, 'admitted'));

        // Host LiveKit token
        try {
          const tok = await api.hostToken(code, hostKey, 'Host (Teacher)');
          if (!active) return;
          setConn({ token: tok.token, url: tok.url });
          setPhase('live');
        } catch (tokErr) {
          if (!active) return;
          if (tokErr.status === 503) setPhase('novideo');
          else {
            setError(tokErr.message);
            setPhase('error');
          }
        }
      } catch (e) {
        if (!active) return;
        if (e.status === 403) setPhase('denied');
        else {
          setError(e.message || 'Could not open the host room.');
          setPhase('error');
        }
      }
    })();

    const joinRoom = () =>
      socket.emit('host-join-room', { classCode: code, hostKey }, (ack) => {
        if (ack?.ok) {
          setWaiting(ack.waiting || []);
          setAdmitted(ack.admitted || []);
        }
      });
    joinRoom();

    const onNewWaiting = ({ student }) => {
      if (student) showToast(`${student.name} wants to join`, 'info');
    };
    const onWaitingUpdated = ({ waiting: w }) => setWaiting(w || []);
    const onParticipants = ({ admitted: a }) => setAdmitted(a || []);
    const onEnded = () => navigate('/ended', { replace: true });
    const onAnnouncement = (a) => setAnnouncements((prev) => [...prev, a]);
    const onConnect = () => joinRoom();

    socket.on('new-waiting-student', onNewWaiting);
    socket.on('waiting-list-updated', onWaitingUpdated);
    socket.on('participants-updated', onParticipants);
    socket.on('room-ended', onEnded);
    socket.on('announcement', onAnnouncement);
    socket.on('connect', onConnect);

    return () => {
      active = false;
      socket.off('new-waiting-student', onNewWaiting);
      socket.off('waiting-list-updated', onWaitingUpdated);
      socket.off('participants-updated', onParticipants);
      socket.off('room-ended', onEnded);
      socket.off('announcement', onAnnouncement);
      socket.off('connect', onConnect);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  // ---- host actions ----
  const setBusy = (id, value) =>
    setBusyIds((prev) => {
      const next = { ...prev };
      if (value) next[id] = value;
      else delete next[id];
      return next;
    });

  const allow = async (s) => {
    setBusy(s.id, 'allow');
    setWaiting((w) => w.filter((p) => p.id !== s.id)); // optimistic
    try {
      await api.admit(s.id, code, hostKey);
    } catch (e) {
      showToast(e.message || 'Could not admit student', 'error');
    } finally {
      setBusy(s.id, null);
    }
  };

  const reject = async (s) => {
    setBusy(s.id, 'reject');
    setWaiting((w) => w.filter((p) => p.id !== s.id)); // optimistic
    try {
      await api.reject(s.id, code, hostKey);
    } catch (e) {
      showToast(e.message || 'Could not reject student', 'error');
    } finally {
      setBusy(s.id, null);
    }
  };

  const remove = async (s) => {
    setBusy(s.id, 'remove');
    setAdmitted((a) => a.filter((p) => p.id !== s.id)); // optimistic
    try {
      await api.remove(s.id, code, hostKey);
    } catch (e) {
      showToast(e.message || 'Could not remove student', 'error');
    } finally {
      setBusy(s.id, null);
    }
  };

  const toggleLock = async () => {
    setLockBusy(true);
    const next = !classInfo?.isLocked;
    try {
      const updated = next ? await api.lock(code, hostKey) : await api.unlock(code, hostKey);
      setClassInfo((c) => ({ ...c, isLocked: updated.isLocked }));
      showToast(updated.isLocked ? 'Room locked — no new students can join' : 'Room unlocked', 'info');
    } catch (e) {
      showToast(e.message || 'Could not change lock state', 'error');
    } finally {
      setLockBusy(false);
    }
  };

  const downloadAttendance = async () => {
    setDownloading(true);
    try {
      const [xlsxMod, data] = await Promise.all([
        import('xlsx'),
        api.attendance(code, hostKey),
      ]);
      const XLSX = xlsxMod.default || xlsxMod;
      const ws = XLSX.utils.json_to_sheet(data.rows, { header: data.columns });
      ws['!cols'] = data.columns.map((c) => ({ wch: Math.max(c.length + 2, 16) }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
      XLSX.writeFile(wb, data.filename);
      showToast(`Attendance downloaded (${data.summary.total} students)`, 'success');
    } catch (e) {
      showToast(e.message || 'Could not download attendance', 'error');
    } finally {
      setDownloading(false);
    }
  };

  const endClass = async () => {
    if (!window.confirm('End the class for everyone? This cannot be undone.')) return;
    try {
      await api.end(code, hostKey);
      navigate('/ended', { replace: true });
    } catch (e) {
      showToast(e.message || 'Could not end the class', 'error');
    }
  };

  const sendAnnouncement = (message) => {
    getSocket().emit('host-announcement', { classCode: code, hostKey, message });
  };

  const onScreenShareChange = (activeShare) => {
    getSocket().emit('host-screen-share', { classCode: code, hostKey, active: activeShare });
    if (activeShare) setLayout('screen');
  };

  // ---- render states ----
  if (phase === 'loading') {
    return (
      <div className="grid min-h-dvh place-items-center bg-slate-900 text-slate-300">
        <div className="flex flex-col items-center gap-3">
          <Spinner size={28} className="text-brand-400" />
          <p className="text-sm">Opening your classroom…</p>
        </div>
      </div>
    );
  }

  if (phase === 'denied') {
    return (
      <div className="grid min-h-dvh place-items-center bg-mesh px-5">
        <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white/80 p-8 text-center shadow-card backdrop-blur-xl">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-red-100 text-red-500">
            <ShieldAlert size={32} />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">Host access required</h1>
          <p className="mt-2 text-slate-500">
            This page needs a valid private host link. Only the teacher who started the class can
            control it. Please open the private host link you received when creating the class.
          </p>
          <button onClick={() => navigate('/')} className="btn btn-primary mt-6 w-full">
            Start a new class
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="grid min-h-dvh place-items-center bg-slate-900 px-5 text-center text-slate-300">
        <div>
          <p className="text-lg font-semibold text-white">Something went wrong</p>
          <p className="mt-2 text-sm text-slate-400">{error}</p>
          <button onClick={() => navigate('/')} className="btn btn-primary mt-6">
            Back to home
          </button>
        </div>
      </div>
    );
  }

  const locked = Boolean(classInfo?.isLocked);
  const inClassCount = admitted.length + 1; // + host

  const TopBar = (
    <header className="flex shrink-0 items-center gap-3 bg-slate-900 px-3 py-3 text-white sm:px-4">
      <div className="shrink-0">
        <Logo light />
      </div>
      <div className="flex flex-1 items-center justify-end gap-2 overflow-x-auto no-scrollbar">
        {phase === 'live' && <ConnectionStatus />}
        {locked && <span className="chip bg-amber-500/90 text-xs text-white">Locked</span>}
        <span className="chip hidden bg-white/10 text-xs text-white sm:inline-flex">
          Code <strong className="ml-1 tracking-widest">{code}</strong>
        </span>
        <span className="chip bg-white/10 text-xs text-white">
          <Users size={14} /> {inClassCount}
        </span>
        {waiting.length > 0 && (
          <span className="chip bg-brand-500 text-xs text-white">
            <Clock size={14} /> {waiting.length} waiting
          </span>
        )}
        <CopyButton
          value={inviteUrl}
          label="Invite link"
          copiedLabel="Copied!"
          className="!px-3 !py-1.5 text-xs"
        />
      </div>
    </header>
  );

  const Toast = toast && (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4">
      <div
        className={`pointer-events-auto flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium text-white shadow-soft ${
          toast.kind === 'error' ? 'bg-red-500' : toast.kind === 'success' ? 'bg-green-600' : 'bg-slate-800'
        }`}
      >
        {toast.kind === 'success' && <CheckCircle2 size={16} />}
        {toast.message}
      </div>
    </div>
  );

  const Panel = panelOpen && (
    <>
      {/* mobile slide-over backdrop */}
      <div
        className="fixed inset-0 z-30 bg-black/40 lg:hidden"
        onClick={() => setPanelOpen(false)}
      />
      <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-sm border-l border-slate-200 bg-white shadow-xl lg:static lg:z-auto lg:w-80 lg:shadow-none xl:w-96">
        <RightPanel
          waiting={waiting}
          admitted={admitted}
          announcements={announcements}
          onAllow={allow}
          onReject={reject}
          onRemove={remove}
          onSendAnnouncement={sendAnnouncement}
          onClose={() => setPanelOpen(false)}
          busyIds={busyIds}
        />
      </aside>
    </>
  );

  const DisabledMedia = (
    <>
      <ControlButton icon={Mic} label="Mute" tone="default" disabled title="Video service unavailable" />
      <ControlButton icon={Video} label="Camera" tone="default" disabled title="Video service unavailable" />
      <ControlButton icon={MonitorUp} label="Share" tone="default" disabled title="Video service unavailable" />
    </>
  );

  const controlBar = (
    <HostControlBar
      mediaSlot={phase === 'live' ? <MediaControls withScreenShare onScreenShareChange={onScreenShareChange} /> : DisabledMedia}
      locked={locked}
      onToggleLock={toggleLock}
      lockBusy={lockBusy}
      onAttendance={downloadAttendance}
      downloading={downloading}
      onEnd={endClass}
      onTogglePanel={() => setPanelOpen((v) => !v)}
      waitingCount={waiting.length}
      layout={layout}
      onLayout={setLayout}
    />
  );

  // Live: LiveKitRoom is the outer container so the top bar (ConnectionStatus)
  // and everything else sit inside the Room context.
  if (phase === 'live') {
    return (
      <LiveKitRoom
        serverUrl={conn.url}
        token={conn.token}
        connect
        video
        audio
        options={{ adaptiveStream: true, dynacast: true }}
        onError={(e) => console.warn('[livekit] room error:', e?.message || e)}
        className="flex h-dvh flex-col bg-slate-950"
      >
        {TopBar}
        <div className="flex min-h-0 flex-1">
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1">
              <Stage layout={layout} />
            </div>
            {controlBar}
          </div>
          {Panel}
        </div>
        {Toast}
        <RoomAudioRenderer />
      </LiveKitRoom>
    );
  }

  // No video (LiveKit unavailable): no Room context, no LiveKit hooks.
  return (
    <div className="flex h-dvh flex-col bg-slate-950">
      {TopBar}
      <div className="flex min-h-0 flex-1">
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1">
            <VideoDisabledStage />
          </div>
          {controlBar}
        </div>
        {Panel}
      </div>
      {Toast}
    </div>
  );
}
