import { useState } from 'react';
import { X } from 'lucide-react';
import WaitingRoomPanel from './WaitingRoomPanel.jsx';
import ParticipantsList from './ParticipantsList.jsx';
import AnnouncementPanel from './AnnouncementPanel.jsx';

const TABS = [
  { id: 'waiting', label: 'Waiting' },
  { id: 'people', label: 'In class' },
  { id: 'announce', label: 'Announce' },
];

export default function RightPanel({
  waiting,
  admitted,
  announcements,
  onAllow,
  onReject,
  onRemove,
  onMute,
  onSendAnnouncement,
  onClose,
  busyIds,
}) {
  const [tab, setTab] = useState('waiting');

  const counts = { waiting: waiting.length, people: admitted.length, announce: announcements.length };

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-3 py-3">
        <div className="flex flex-1 items-center gap-1 rounded-2xl bg-slate-100 p-1">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative flex-1 rounded-xl px-2 py-1.5 text-xs font-semibold transition ${
                  active ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t.label}
                {counts[t.id] > 0 && (
                  <span
                    className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] ${
                      t.id === 'waiting' ? 'bg-brand-500 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {counts[t.id]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-2 grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 lg:hidden"
            aria-label="Close panel"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar">
        {tab === 'waiting' && (
          <WaitingRoomPanel waiting={waiting} onAllow={onAllow} onReject={onReject} busyIds={busyIds} />
        )}
        {tab === 'people' && (
          <ParticipantsList admitted={admitted} onRemove={onRemove} onMute={onMute} busyIds={busyIds} />
        )}
        {tab === 'announce' && (
          <AnnouncementPanel announcements={announcements} onSend={onSendAnnouncement} />
        )}
      </div>
    </div>
  );
}
