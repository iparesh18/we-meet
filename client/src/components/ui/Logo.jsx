export default function Logo({ size = 36, withWordmark = true, light = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="grid place-items-center rounded-2xl bg-brand-gradient text-white shadow-soft"
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 32 32" fill="none">
          <path
            d="M11 21c1.6 1.4 3.4 2 5.2 2 2.8 0 4.8-1.5 4.8-3.9 0-2.2-1.5-3.3-4.3-4-2-.5-2.7-.9-2.7-1.8 0-.8.7-1.4 2-1.4 1.3 0 2.5.5 3.6 1.3l1.5-2.2C19.4 9.3 17.8 8.8 16 8.8c-2.7 0-4.7 1.6-4.7 3.9 0 2.5 1.6 3.3 4.4 4 1.9.5 2.6.9 2.6 1.8 0 .9-.8 1.4-2.1 1.4-1.6 0-2.9-.6-4.1-1.6L11 21z"
            fill="white"
          />
        </svg>
      </span>
      {withWordmark && (
        <span
          className={`text-xl font-extrabold tracking-tight ${light ? 'text-white' : 'text-slate-900'}`}
        >
          Swastik
        </span>
      )}
    </div>
  );
}
