/**
 * Round meeting-style control button with a label underneath.
 * `tone`: 'default' | 'active' | 'danger' | 'primary'
 */
const TONES = {
  default: 'bg-slate-700/80 text-white hover:bg-slate-600',
  active: 'bg-white text-slate-900 hover:bg-slate-100',
  danger: 'bg-red-500 text-white hover:bg-red-600',
  primary: 'bg-brand-gradient text-white hover:brightness-105',
  warn: 'bg-amber-500 text-white hover:bg-amber-600',
};

export default function ControlButton({
  icon: Icon,
  label,
  onClick,
  tone = 'default',
  disabled = false,
  title,
  badge,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title || label}
      className="group flex shrink-0 flex-col items-center gap-1 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span
        className={`relative grid h-11 w-11 place-items-center rounded-2xl shadow-sm transition active:scale-95 sm:h-12 sm:w-12 ${TONES[tone] || TONES.default}`}
      >
        {Icon && <Icon size={20} />}
        {badge != null && badge > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-brand-500 px-1 text-[11px] font-bold text-white ring-2 ring-slate-900">
            {badge}
          </span>
        )}
      </span>
      <span className="text-[11px] font-medium text-slate-300">{label}</span>
    </button>
  );
}
