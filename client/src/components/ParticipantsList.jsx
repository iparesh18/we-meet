import { UserMinus, Users, Loader2, Circle } from 'lucide-react';
import { initials, clock } from '../lib/format.js';

export default function ParticipantsList({ admitted, onRemove, busyIds = {} }) {
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
      {admitted.map((s) => {
        const busy = busyIds[s.id];
        const present = !s.leftAt;
        return (
          <div
            key={s.id}
            className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-2.5 shadow-sm"
          >
            <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-700 text-xs font-bold text-white">
              {initials(s.name)}
              <Circle
                size={10}
                className={`absolute -bottom-0.5 -right-0.5 rounded-full ${
                  present ? 'fill-green-500 text-green-500' : 'fill-slate-300 text-slate-300'
                }`}
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">{s.name}</p>
              <p className="text-xs text-slate-400">
                {present ? `Joined ${clock(s.admittedAt)}` : 'Away'}
              </p>
            </div>
            <button
              onClick={() => onRemove(s)}
              disabled={busy}
              title="Remove from class"
              className="grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
            >
              {busy === 'remove' ? <Loader2 size={16} className="animate-spin" /> : <UserMinus size={16} />}
            </button>
          </div>
        );
      })}
    </div>
  );
}
