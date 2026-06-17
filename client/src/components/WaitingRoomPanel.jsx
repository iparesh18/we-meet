import { Check, X, Hand, Loader2 } from 'lucide-react';
import { timeAgo, initials } from '../lib/format.js';

export default function WaitingRoomPanel({ waiting, onAllow, onReject, busyIds = {} }) {
  if (!waiting.length) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-12 text-center text-slate-400">
        <span className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400">
          <Hand size={26} />
        </span>
        <p className="text-sm font-medium text-slate-500">No one is waiting</p>
        <p className="mt-1 text-xs text-slate-400">New join requests will appear here in real time.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 p-3">
      {waiting.map((s) => {
        const busy = busyIds[s.id];
        return (
          <div
            key={s.id}
            className="animate-fade-up rounded-2xl border border-slate-100 bg-white p-3 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-gradient text-sm font-bold text-white">
                {initials(s.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-800">{s.name}</p>
                <p className="text-xs text-slate-400">Requested {timeAgo(s.requestedAt)}</p>
              </div>
            </div>
            <div className="mt-2.5 flex gap-2">
              <button
                onClick={() => onAllow(s)}
                disabled={busy}
                className="btn btn-primary flex-1 py-2"
              >
                {busy === 'allow' ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                Allow
              </button>
              <button
                onClick={() => onReject(s)}
                disabled={busy}
                className="btn btn-secondary flex-1 py-2 hover:border-red-300 hover:text-red-600"
              >
                {busy === 'reject' ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                Reject
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
