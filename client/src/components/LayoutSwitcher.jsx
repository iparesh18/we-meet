import { User, LayoutGrid, MonitorUp, PanelRight } from 'lucide-react';

const LAYOUTS = [
  { id: 'speaker', icon: User, label: 'Speaker' },
  { id: 'gallery', icon: LayoutGrid, label: 'Gallery' },
  { id: 'screen', icon: MonitorUp, label: 'Screen' },
  { id: 'sidebar', icon: PanelRight, label: 'Sidebar' },
];

export default function LayoutSwitcher({ value, onChange, className = '' }) {
  return (
    <div className={`flex items-center gap-1 rounded-2xl bg-slate-100 p-1 ${className}`}>
      {LAYOUTS.map((l) => {
        const active = value === l.id;
        return (
          <button
            key={l.id}
            type="button"
            onClick={() => onChange(l.id)}
            title={`${l.label} view`}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              active ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <l.icon size={15} />
            <span className="hidden md:inline">{l.label}</span>
          </button>
        );
      })}
    </div>
  );
}
