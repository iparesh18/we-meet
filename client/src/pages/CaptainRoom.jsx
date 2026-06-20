import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react';
import { Users, Clock, CheckCircle2, Crown, Mic, Video, MonitorUp } from 'lucide-react';
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
import { loadParticipant } from '../lib/storage.js';
import { roomOptions } from '../lib/livekitQuality.js';

/**
 * The co-host ("captain") control view. A student the host promoted lands here:
 * it mirrors the host room (roster, mute, lock, attendance, announcements,
 * screen share, end) but is authorized by the captain's own participant id
 * instead of a host key. Promoting/demoting other captains stays host-only, so
 * the crown control is deliberately not rendered here.
 *
 * If the captain is demoted (or never was one) they are sent back to the normal
 * student room.
 */
function byStatus(list, status) {
  return list.filter((p) => p.status === status);
}

export default function CaptainRoom() {
  const { classCode } = useParams();
  const code = (classCode || '').toUpperCase();
  const navigate = useNavigate();
  const participant = loadParticipant(code);
  const captainId = participant?.participantId;
  const prefs = participant?.prefs || { cam: true, mic: true };

  const [phase, setPhase] = useState('loading'); // loading | live | novideo | error
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
  const [pinnedIdentity, setPinnedIdentity] = useState(null);
  const [panelOpen, setPanelOpen] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  const [toast, setToast] = useState(null);

  const auth = { captainId };
  const inviteUrl = `${window.location.origin}/join/${code}`;
  const toastTimer = useRef(null);

  const showToast = useCallback((message, kind = 'info') => {
    setToast({ message, kind });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  const togglePin = useCallback((identity) => {
    setPinnedIdentity((cur) => (cur === identity ? null : identity));
  }, []);

  // ---- bootstrap ----
  useEffect(() => {
    if (!captainId) {
      navigate(`/join/${code}`, { replace: true });
      return;
    }
    let active = true;
    const socket = getSocket();

    (async () => {
      try {
        const tok = await api.captainToken(code, captainId, participant.name);
        if (!active) return;
        setConn({ token: tok.token, url: tok.url });
        setPhase('live');
        // Lock state for the control bar (best-effort; roster comes over sockets).
        try {
          const data = await api.getHostClass(code, auth);
          if (active) setClassInfo(data.class);
        } catch {
          /* non-fatal — keep going without lock state */
        }
      } catch (e) {
        if (!active) return;
        if (e.status === 503) {
          setPhase('novideo');
        } else if (e.details?.reason === 'not_captain' || e.status === 403) {
          navigate(`/student/${code}`, { replace: true });
        } else if (e.details?.reason === 'ended' || e.status === 410) {
          navigate('/ended', { replace: true });
        } else {
          setError(e.message || 'Could not open the captain controls.');
          setPhase('error');
        }
      }
    })();

    const joinRoom = () =>
      socket.emit('captain-join-room', { classCode: code, captainId }, (ack) => {
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
    // Host demoted us back to a regular student — return to the student room.
    const onDemoted = () => navigate(`/student/${code}`, { replace: true });
    // If we get removed entirely, leave for the removed page.
    const onRemoved = () => navigate('/removed', { replace: true });

    socket.on('new-waiting-student', onNewWaiting);
    socket.on('waiting-list-updated', onWaitingUpdated);
    socket.on('participants-updated', onParticipants);
    socket.on('room-ended', onEnded);
    socket.on('announcement', onAnnouncement);
    socket.on('connect', onConnect);
    socket.on('captain-demoted', onDemoted);
    socket.on('student-removed', onRemoved);

    return () => {
      active = false;
      socket.off('new-waiting-student', onNewWaiting);
      socket.off('waiting-list-updated', onWaitingUpdated);
      socket.off('participants-updated', onParticipants);
      socket.off('room-ended', onEnded);
      socket.off('announcement', onAnnouncement);
      socket.off('connect', onConnect);
      socket.off('captain-demoted', onDemoted);
      socket.off('student-removed', onRemoved);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  // ---- control actions (authorized by captainId) ----
  const setBusy = (id, value) =>
    setBusyIds((prev) => {
      const next = { ...prev };
      if (value) next[id] = value;
      else delete next[id];
      return next;
    });

  const allow = async (s) => {
    setBusy(s.id, 'allow');
    setWaiting((w) => w.filter((p) => p.id !== s.id));
    try {
      await api.admit(s.id, code, auth);
    } catch (e) {
      showToast(e.message || 'Could not admit student', 'error');
    } finally {
      setBusy(s.id, null);
    }
  };

  const reject = async (s) => {
    setBusy(s.id, 'reject');
    setWaiting((w) => w.filter((p) => p.id !== s.id));
    try {
      await api.reject(s.id, code, auth);
    } catch (e) {
      showToast(e.message || 'Could not reject student', 'error');
    } finally {
      setBusy(s.id, null);
    }
  };

  const remove = async (s) => {
    setBusy(s.id, 'remove');
    setAdmitted((a) => a.filter((p) => p.id !== s.id));
    try {
      await api.remove(s.id, code, auth);
    } catch (e) {
      showToast(e.message || 'Could not remove student', 'error');
    } finally {
      setBusy(s.id, null);
    }
  };

  const muteStudent = (s) => {
    setBusy(s.id, 'mute');
    getSocket().emit('host-mute-student', { classCode: code, captainId, participantId: s.id }, (ack) => {
      setBusy(s.id, null);
      if (ack?.ok) showToast(`Muted ${ack.name || s.name}`, 'success');
      else showToast(ack?.error || 'Could not mute student', 'error');
    });
  };

  const [muteAllBusy, setMuteAllBusy] = useState(false);
  const muteAll = () => {
    setMuteAllBusy(true);
    getSocket().emit('host-mute-all', { classCode: code, captainId }, (ack) => {
      setMuteAllBusy(false);
      if (ack?.ok) showToast(`Muted all students (${ack.count})`, 'success');
      else showToast(ack?.error || 'Could not mute students', 'error');
    });
  };

  const toggleLock = async () => {
    setLockBusy(true);
    const next = !classInfo?.isLocked;
    try {
      const updated = next ? await api.lock(code, auth) : await api.unlock(code, auth);
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
      const [xlsxMod, data] = await Promise.all([import('xlsx'), api.attendance(code, auth)]);
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
      await api.end(code, auth);
      navigate('/ended', { replace: true });
    } catch (e) {
      showToast(e.message || 'Could not end the class', 'error');
    }
  };

  const sendAnnouncement = (message) => {
    getSocket().emit('host-announcement', { classCode: code, captainId, message });
  };

  const onScreenShareChange = (activeShare) => {
    getSocket().emit('host-screen-share', { classCode: code, captainId, active: activeShare });
    if (activeShare) setLayout('screen');
  };

  // ---- render states ----
  if (phase === 'loading') {
    return (
      <div className="grid min-h-dvh place-items-center bg-slate-900 text-slate-300">
        <div className="flex flex-col items-center gap-3">
          <Spinner size={28} className="text-brand-400" />
          <p className="text-sm">Opening captain controls…</p>
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
          <button onClick={() => navigate(`/student/${code}`)} className="btn btn-primary mt-6">
            Back to class
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
        <span className="chip bg-brand-500 text-xs text-white">
          <Crown size={14} /> Captain
        </span>
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
      <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setPanelOpen(false)} />
      <aside className="fixed inset-y-0 right-0 z-40 w-full max-w-sm border-l border-slate-200 bg-white shadow-xl lg:static lg:z-auto lg:w-80 lg:shadow-none xl:w-96">
        <RightPanel
          waiting={waiting}
          admitted={admitted}
          announcements={announcements}
          onAllow={allow}
          onReject={reject}
          onRemove={remove}
          onMute={muteStudent}
          onMuteAll={muteAll}
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

  if (phase === 'live') {
    return (
      <LiveKitRoom
        serverUrl={conn.url}
        token={conn.token}
        connect
        video={prefs.cam}
        audio={prefs.mic}
        options={roomOptions}
        onMediaDeviceFailure={(failure) => console.warn('[livekit] media device unavailable:', failure)}
        onError={(e) => console.warn('[livekit] room error:', e?.message || e)}
        className="flex h-dvh flex-col bg-slate-950"
      >
        {TopBar}
        <div className="flex min-h-0 flex-1">
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1">
              <Stage layout={layout} pinnedIdentity={pinnedIdentity} onTogglePin={togglePin} />
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
