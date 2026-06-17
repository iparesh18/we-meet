import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Video,
  Users,
  ShieldCheck,
  MonitorUp,
  FileSpreadsheet,
  LayoutGrid,
  ArrowRight,
  Sparkles,
  Lock,
  Hand,
} from 'lucide-react';
import Logo from '../components/ui/Logo.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { api } from '../lib/api.js';
import { saveHostKey } from '../lib/storage.js';

const FEATURES = [
  { icon: Hand, title: 'One-tap waiting room', desc: 'See every join request in real time and admit students with a single click.' },
  { icon: MonitorUp, title: 'Crisp screen sharing', desc: 'Share your screen and it instantly becomes the main stage for everyone.' },
  { icon: LayoutGrid, title: 'Switchable layouts', desc: 'Flip between speaker, gallery, screen-share and sidebar views on the fly.' },
  { icon: FileSpreadsheet, title: 'Excel attendance', desc: 'Download a complete attendance sheet with join, allow, leave and remove times.' },
  { icon: ShieldCheck, title: 'Host-key security', desc: 'Only the private host link can admit, remove, lock or end the class.' },
  { icon: Lock, title: 'Lockable room', desc: 'Lock the class with one button so no new student can slip in.' },
];

const STEPS = [
  { n: '01', title: 'Start a class', desc: 'Click “Start New Class”. We create a code, a private host link and an invite link instantly.' },
  { n: '02', title: 'Invite students', desc: 'Copy the invite link and share it. Students set their name and preview their camera.' },
  { n: '03', title: 'Admit & teach', desc: 'Approve students from the waiting room, share your screen and switch layouts as you go.' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [joinCode, setJoinCode] = useState('');

  const startClass = async () => {
    setLoading(true);
    setError('');
    try {
      const cls = await api.createClass('Swastik Class');
      saveHostKey(cls.classCode, cls.hostKey);
      navigate(`/host/${cls.classCode}?hostKey=${encodeURIComponent(cls.hostKey)}`);
    } catch (e) {
      setError(e.message || 'Could not start the class. Please try again.');
      setLoading(false);
    }
  };

  const joinByCode = (e) => {
    e.preventDefault();
    const code = joinCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (code.length >= 4) navigate(`/join/${code}`);
  };

  return (
    <div className="min-h-dvh bg-mesh">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <form onSubmit={joinByCode} className="hidden items-center gap-2 sm:flex">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Enter class code"
            className="w-40 rounded-xl border border-slate-200 bg-white/80 px-3 py-2 text-sm uppercase tracking-wider outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            maxLength={12}
          />
          <button type="submit" className="btn btn-secondary">
            Join
          </button>
        </form>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-6xl px-5">
        <section className="grid items-center gap-10 py-10 lg:grid-cols-2 lg:py-20">
          <div className="animate-fade-up">
            <span className="chip bg-brand-100 text-brand-700">
              <Sparkles size={15} /> Teacher-hosted online classes
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Run online classes that feel <span className="gradient-text">effortless.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-500">
              Swastik gives teachers a clean, Zoom-style classroom — waiting room, screen sharing,
              gallery & speaker layouts and one-click Excel attendance. No sign-up, no logins. Just
              start and teach.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button onClick={startClass} disabled={loading} className="btn btn-primary px-6 py-3.5 text-base">
                {loading ? <Spinner size={18} /> : <Video size={20} />}
                {loading ? 'Creating your class…' : 'Start New Class'}
                {!loading && <ArrowRight size={18} />}
              </button>
              <a href="#how" className="btn btn-secondary px-6 py-3.5 text-base">
                See how it works
              </a>
            </div>

            {error && <p className="mt-4 text-sm font-medium text-red-500">{error}</p>}

            <form onSubmit={joinByCode} className="mt-6 flex items-center gap-2 sm:hidden">
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Enter class code"
                className="input uppercase tracking-wider"
                maxLength={12}
              />
              <button type="submit" className="btn btn-secondary whitespace-nowrap">
                Join
              </button>
            </form>

            <div className="mt-8 flex items-center gap-6 text-sm text-slate-400">
              <span className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-brand-500" /> Host-key protected
              </span>
              <span className="flex items-center gap-2">
                <Users size={16} className="text-brand-500" /> No login required
              </span>
            </div>
          </div>

          {/* Hero illustration / mock classroom */}
          <div className="relative animate-scale-in">
            <div className="absolute -top-6 -right-4 h-24 w-24 animate-float-slow rounded-3xl bg-brand-gradient opacity-20 blur-2xl" />
            <div className="relative rounded-3xl border border-white/60 bg-white/70 p-3 shadow-card backdrop-blur-xl">
              <div className="flex items-center justify-between rounded-2xl bg-slate-900 px-4 py-2.5 text-white">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  Swastik Classroom
                </div>
                <span className="chip bg-white/10 text-xs text-white">12 in class</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2.5">
                <div className="col-span-2 row-span-2 grid aspect-video place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-inner">
                  <MonitorUp size={40} className="opacity-90" />
                </div>
                {['A', 'R', 'M', 'S'].map((l, i) => (
                  <div
                    key={l}
                    className="grid aspect-video place-items-center rounded-xl bg-slate-100 text-lg font-bold text-slate-500"
                    style={{ animation: `fade-up .5s ease-out ${i * 0.08}s both` }}
                  >
                    {l}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-center gap-2 rounded-2xl bg-slate-50 p-2.5">
                {[Video, Users, MonitorUp, LayoutGrid].map((Icon, i) => (
                  <span
                    key={i}
                    className={`grid h-9 w-9 place-items-center rounded-xl ${
                      i === 2 ? 'bg-brand-gradient text-white' : 'bg-white text-slate-500 shadow-sm'
                    }`}
                  >
                    <Icon size={16} />
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-12">
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-slate-900">
            Everything you need to <span className="gradient-text">teach live</span>
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-slate-500">
            Purpose-built for teachers. Powerful where it matters, simple everywhere else.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-slate-100 bg-white/70 p-6 shadow-card backdrop-blur-sm transition hover:-translate-y-1 hover:shadow-soft"
              >
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-100 text-brand-600 transition group-hover:bg-brand-gradient group-hover:text-white">
                  <f.icon size={22} />
                </span>
                <h3 className="mt-4 text-lg font-bold text-slate-900">{f.title}</h3>
                <p className="mt-1.5 text-sm text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="py-12 scroll-mt-8">
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-slate-900">
            Up and running in <span className="gradient-text">3 steps</span>
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="relative rounded-2xl border border-slate-100 bg-white/70 p-7 shadow-card">
                <span className="text-5xl font-black text-brand-100">{s.n}</span>
                <h3 className="mt-2 text-xl font-bold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 flex flex-col items-center gap-4 rounded-3xl bg-brand-gradient p-10 text-center text-white shadow-soft">
            <h3 className="text-2xl font-extrabold sm:text-3xl">Ready to start your class?</h3>
            <p className="max-w-md text-white/90">No account needed. Click below and you'll be hosting in seconds.</p>
            <button
              onClick={startClass}
              disabled={loading}
              className="btn bg-white px-7 py-3.5 text-base text-brand-700 hover:bg-brand-50"
            >
              {loading ? <Spinner size={18} /> : <Video size={20} />}
              Start New Class
            </button>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-5 py-10 text-center text-sm text-slate-400">
        <div className="mb-3 flex justify-center">
          <Logo size={28} />
        </div>
        Swastik — teacher-hosted online classrooms. Built with React, LiveKit & Socket.IO.
      </footer>
    </div>
  );
}
