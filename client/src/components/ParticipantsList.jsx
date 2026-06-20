import { UserMinus, Users, Loader2, Circle, MicOff, Crown } from 'lucide-react';
import { initials, clock } from '../lib/format.js';

export default function ParticipantsList({
  admitted,
  onRemove,
  onMute,
  onMuteAll,
  onMakeCaptain,
  onRemoveCaptain,
  muteAllBusy = false,
  busyIds = {},
}) {
  if (!admitted.length) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-12 text-center text-slate-400">
        <span className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400">
          <Users size={26} />
        </span>
        <p className="text-sm font-medium text-slate-500">No students in class yet</p>
        <p className="mt-1 text-xs text-slate-400">Admit students from the waiting room to get started.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 p-3">
      {onMuteAll && (
        <button
          onClick={onMuteAll}
          disabled={muteAllBusy}
          title="Mute every student's microphone"
          className="mb-1 flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
        >
          {muteAllBusy ? <Loader2 size={16} className="animate-spin" /> : <MicOff size={16} />}
          Mute all students
        </button>
      )}
      {admitted.map((s) => {
        const busy = busyIds[s.id];
        const present = !s.leftAt;
        const isCaptain = s.role === 'captain';
        return (
          <div
            key={s.id}
            className={`flex items-center gap-3 rounded-2xl border bg-white p-2.5 shadow-sm ${
              isCaptain ? 'border-brand-200 ring-1 ring-brand-100' : 'border-slate-100'
            }`}
          >
            <span
              className={`relative grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold text-white ${
                isCaptain ? 'bg-brand-600' : 'bg-slate-700'
              }`}
            >
              {initials(s.name)}
              <Circle
                size={10}
                className={`absolute -bottom-0.5 -right-0.5 rounded-full ${
                  present ? 'fill-green-500 text-green-500' : 'fill-slate-300 text-slate-300'
                }`}
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-slate-800">
                <span className="truncate">{s.name}</span>
                {isCaptain && (
                  <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-600">
                    <Crown size={10} /> Captain
                  </span>
                )}
              </p>
              <p className="text-xs text-slate-400">
                {present ? `Joined ${clock(s.admittedAt)}` : 'Away'}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              {onMakeCaptain && (
                <button
                  onClick={() => (isCaptain ? onRemoveCaptain?.(s) : onMakeCaptain(s))}
                  disabled={busy}
                  title={isCaptain ? 'Remove co-host (demote to student)' : 'Make co-host (captain)'}
                  className={`grid h-9 w-9 place-items-center rounded-xl transition disabled:opacity-50 ${
                    isCaptain
                      ? 'text-brand-600 hover:bg-brand-50'
                      : 'text-slate-400 hover:bg-brand-50 hover:text-brand-600'
                  }`}
                >
                  {busy === 'captain' ? <Loader2 size={16} className="animate-spin" /> : <Crown size={16} />}
                </button>
              )}
              {onMute && (
                <button
                  onClick={() => onMute(s)}
                  disabled={busy}
                  title="Mute this student's microphone"
                  className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition hover:bg-amber-50 hover:text-amber-600 disabled:opacity-50"
                >
                  {busy === 'mute' ? <Loader2 size={16} className="animate-spin" /> : <MicOff size={16} />}
                </button>
              )}
              <button
                onClick={() => onRemove(s)}
                disabled={busy}
                title="Remove from class"
                className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
              >
                {busy === 'remove' ? <Loader2 size={16} className="animate-spin" /> : <UserMinus size={16} />}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
