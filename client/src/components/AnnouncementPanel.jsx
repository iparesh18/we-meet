import { useState } from 'react';
import { Send, Megaphone } from 'lucide-react';
import { clock } from '../lib/format.js';

export default function AnnouncementPanel({ announcements, onSend }) {
  const [text, setText] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const msg = text.trim();
    if (!msg) return;
    onSend(msg);
    setText('');
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-2 overflow-y-auto p-3 no-scrollbar">
        {!announcements.length && (
          <div className="flex flex-col items-center justify-center px-6 py-10 text-center text-slate-400">
            <span className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400">
              <Megaphone size={24} />
            </span>
            <p className="text-sm font-medium text-slate-500">No announcements yet</p>
            <p className="mt-1 text-xs text-slate-400">
              Send a note that every student in the class can read.
            </p>
          </div>
        )}
        {announcements.map((a, i) => (
          <div key={i} className="animate-fade-up rounded-2xl bg-brand-50 p-3">
            <p className="text-sm text-slate-700">{a.message}</p>
            <p className="mt-1 text-[11px] text-brand-500">{clock(a.at)}</p>
          </div>
        ))}
      </div>
      <form onSubmit={submit} className="flex items-end gap-2 border-t border-slate-100 p-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) submit(e);
          }}
          rows={1}
          placeholder="Message the whole class…"
          className="max-h-24 flex-1 resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        />
        <button type="submit" disabled={!text.trim()} className="btn btn-primary px-3 py-2">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
