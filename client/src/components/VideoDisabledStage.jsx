import { VideoOff } from 'lucide-react';

export default function VideoDisabledStage({ message }) {
  return (
    <div className="flex h-full items-center justify-center p-4">
      <div className="max-w-md rounded-3xl border border-white/10 bg-slate-800/60 p-8 text-center text-slate-300">
        <span className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-slate-700 text-slate-300">
          <VideoOff size={30} />
        </span>
        <h3 className="text-lg font-bold text-white">Live video is unavailable</h3>
        <p className="mt-2 text-sm text-slate-400">
          {message ||
            'The video service (LiveKit) is not reachable right now. Everything else — the waiting room, admitting students, locking and attendance — still works.'}
        </p>
        <p className="mt-4 rounded-xl bg-slate-900/60 px-3 py-2 text-xs text-slate-400">
          Tip: set <code className="text-brand-300">LIVEKIT_URL / API_KEY / API_SECRET</code> in{' '}
          <code className="text-brand-300">server/.env</code> and start a LiveKit server to enable
          audio &amp; video.
        </p>
      </div>
    </div>
  );
}
