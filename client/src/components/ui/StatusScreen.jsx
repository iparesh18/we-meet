import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';

/**
 * Full-screen centered status card used by the locked / removed / rejected /
 * ended pages. `tone` controls the accent color of the icon badge.
 */
const TONES = {
  brand: 'from-brand-400 to-brand-600 text-white',
  red: 'from-red-400 to-red-600 text-white',
  slate: 'from-slate-400 to-slate-600 text-white',
  amber: 'from-amber-400 to-amber-600 text-white',
};

export default function StatusScreen({ icon: Icon, title, message, tone = 'brand', children, actions }) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center bg-mesh px-5 py-10">
      <div className="absolute top-6 left-1/2 -translate-x-1/2">
        <Logo />
      </div>

      <div className="w-full max-w-md animate-scale-in rounded-3xl border border-slate-100 bg-white/80 p-8 text-center shadow-card backdrop-blur-xl sm:p-10">
        <div
          className={`mx-auto mb-6 grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br shadow-soft ${TONES[tone] || TONES.brand}`}
        >
          {Icon && <Icon size={38} strokeWidth={2.2} />}
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{title}</h1>
        {message && <p className="mt-3 text-slate-500">{message}</p>}
        {children && <div className="mt-5">{children}</div>}

        <div className="mt-8 flex flex-col gap-3">
          {actions}
          <Link to="/" className="btn btn-ghost">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
