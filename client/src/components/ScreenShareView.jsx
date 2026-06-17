import { useCallback, useEffect, useRef, useState } from 'react';
import { VideoTrack } from '@livekit/components-react';
import { ZoomIn, ZoomOut, Maximize2, MonitorUp, Smartphone, X } from 'lucide-react';

const MIN_SCALE = 1; // 1 = "fit screen" (object-contain), the default
const MAX_SCALE = 4; // up to 4x for reading fine text/slides

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/**
 * Readable, zoomable/pannable viewer for the host's screen share.
 *
 * - Screen content uses object-fit: contain (never crops) and fills the area.
 * - Pinch-to-zoom + drag-to-pan on touch devices; mouse wheel zoom on desktop.
 * - Double-tap toggles between fit and ~2.5x (zooming around the tap point).
 * - On-screen controls: zoom out / zoom in / fit. Panning is bounded so the
 *   shared content can never disappear off-screen.
 * - A dismissible "Rotate phone" hint shows on portrait touch devices.
 *
 * touch-action is disabled only on this element, so page scrolling elsewhere is
 * unaffected. No blur/opacity/scale-down filters — clarity is preserved.
 */
export default function ScreenShareView({ trackRef, className = '' }) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [hintDismissed, setHintDismissed] = useState(false);
  const [isPortraitTouch, setIsPortraitTouch] = useState(false);

  // Live transform mirrors (so native gesture handlers read current values
  // without re-binding on every render) + per-gesture start snapshots.
  const view = useRef({ scale: 1, tx: 0, ty: 0 });
  const gesture = useRef({
    mode: null, // 'pan' | 'pinch'
    startX: 0,
    startY: 0,
    startTx: 0,
    startTy: 0,
    startDist: 0,
    startScale: 1,
    focalX: 0,
    focalY: 0,
    lastTap: 0,
  });

  const boundsFor = useCallback((s) => {
    const el = containerRef.current;
    if (!el) return { maxX: 0, maxY: 0 };
    const r = el.getBoundingClientRect();
    return { maxX: ((s - 1) * r.width) / 2, maxY: ((s - 1) * r.height) / 2 };
  }, []);

  // Commit a new transform (clamped to scale + pan bounds).
  const apply = useCallback(
    (s, x, y) => {
      const ns = clamp(s, MIN_SCALE, MAX_SCALE);
      const { maxX, maxY } = boundsFor(ns);
      const nx = ns <= 1 ? 0 : clamp(x, -maxX, maxX);
      const ny = ns <= 1 ? 0 : clamp(y, -maxY, maxY);
      view.current = { scale: ns, tx: nx, ty: ny };
      setScale(ns);
      setTx(nx);
      setTy(ny);
    },
    [boundsFor]
  );

  const reset = useCallback(() => apply(1, 0, 0), [apply]);

  // Zoom to `nextScale` keeping the content point under (focalX, focalY) — both
  // measured in px relative to the container centre — visually stable.
  const zoomToFocal = useCallback(
    (nextScale, focalX = 0, focalY = 0) => {
      const { scale: s, tx: t, ty: u } = view.current;
      const ns = clamp(nextScale, MIN_SCALE, MAX_SCALE);
      const nx = focalX - (focalX - t) * (ns / s);
      const ny = focalY - (focalY - u) * (ns / s);
      apply(ns, nx, ny);
    },
    [apply]
  );

  // ---- native touch / wheel handlers (passive:false so we can preventDefault) ----
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const g = gesture.current;

    const centre = () => {
      const r = el.getBoundingClientRect();
      return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
    };
    const distance = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        const [a, b] = e.touches;
        const { cx, cy } = centre();
        g.mode = 'pinch';
        g.startDist = distance(a, b) || 1;
        g.startScale = view.current.scale;
        g.startTx = view.current.tx;
        g.startTy = view.current.ty;
        g.focalX = (a.clientX + b.clientX) / 2 - cx;
        g.focalY = (a.clientY + b.clientY) / 2 - cy;
        e.preventDefault();
        return;
      }
      if (e.touches.length === 1) {
        const now = Date.now();
        if (now - g.lastTap < 300) {
          // double tap: toggle fit <-> 2.5x around the tap point
          const { cx, cy } = centre();
          const fx = e.touches[0].clientX - cx;
          const fy = e.touches[0].clientY - cy;
          if (view.current.scale > 1) reset();
          else zoomToFocal(2.5, fx, fy);
          g.lastTap = 0;
          g.mode = null;
          e.preventDefault();
          return;
        }
        g.lastTap = now;
        if (view.current.scale > 1) {
          g.mode = 'pan';
          g.startX = e.touches[0].clientX;
          g.startY = e.touches[0].clientY;
          g.startTx = view.current.tx;
          g.startTy = view.current.ty;
          g.startScale = view.current.scale;
        } else {
          g.mode = null; // at fit scale a single-finger swipe is left alone
        }
      }
    };

    const onTouchMove = (e) => {
      if (g.mode === 'pinch' && e.touches.length === 2) {
        const [a, b] = e.touches;
        const ratio = distance(a, b) / g.startDist;
        const ns = clamp(g.startScale * ratio, MIN_SCALE, MAX_SCALE);
        const nx = g.focalX - (g.focalX - g.startTx) * (ns / g.startScale);
        const ny = g.focalY - (g.focalY - g.startTy) * (ns / g.startScale);
        apply(ns, nx, ny);
        e.preventDefault();
      } else if (g.mode === 'pan' && e.touches.length === 1) {
        const dx = e.touches[0].clientX - g.startX;
        const dy = e.touches[0].clientY - g.startY;
        apply(g.startScale, g.startTx + dx, g.startTy + dy);
        e.preventDefault();
      }
    };

    const onTouchEnd = (e) => {
      if (e.touches.length === 0) {
        g.mode = null;
      } else if (e.touches.length === 1 && g.mode === 'pinch') {
        // pinch released to one finger -> continue as a pan
        g.mode = view.current.scale > 1 ? 'pan' : null;
        g.startX = e.touches[0].clientX;
        g.startY = e.touches[0].clientY;
        g.startTx = view.current.tx;
        g.startTy = view.current.ty;
        g.startScale = view.current.scale;
      }
    };

    const onWheel = (e) => {
      e.preventDefault();
      const { cx, cy } = centre();
      const fx = e.clientX - cx;
      const fy = e.clientY - cy;
      const factor = 1 - e.deltaY * 0.0015;
      zoomToFocal(view.current.scale * factor, fx, fy);
    };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: false });
    el.addEventListener('touchcancel', onTouchEnd, { passive: false });
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
      el.removeEventListener('wheel', onWheel);
    };
  }, [apply, reset, zoomToFocal]);

  // ---- "Rotate phone" hint: portrait + coarse pointer (touch) ----
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const portrait = window.matchMedia('(orientation: portrait)');
    const coarse = window.matchMedia('(pointer: coarse)');
    const update = () => setIsPortraitTouch(coarse.matches && portrait.matches);
    update();
    portrait.addEventListener?.('change', update);
    coarse.addEventListener?.('change', update);
    return () => {
      portrait.removeEventListener?.('change', update);
      coarse.removeEventListener?.('change', update);
    };
  }, []);

  const stopTouch = (e) => e.stopPropagation();
  const showRotateHint = isPortraitTouch && !hintDismissed;

  return (
    <div
      ref={containerRef}
      className={`relative touch-none select-none overflow-hidden rounded-2xl bg-slate-900 ${className}`}
    >
      <div
        className="h-full w-full"
        style={{
          transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
          transformOrigin: 'center center',
          transition: gesture.current.mode ? 'none' : 'transform 0.12s ease-out',
          willChange: 'transform',
        }}
      >
        <VideoTrack trackRef={trackRef} playsInline className="h-full w-full object-contain" />
      </div>

      {/* Screen badge */}
      <span className="chip pointer-events-none absolute left-2 top-2 bg-brand-500/90 px-2 py-0.5 text-xs text-white">
        <MonitorUp size={12} /> Screen
      </span>

      {/* Rotate-phone hint (mobile portrait only) */}
      {showRotateHint && (
        <div className="absolute inset-x-0 top-2 z-10 flex justify-center px-10">
          <div
            className="flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white shadow-soft"
            onTouchStart={stopTouch}
          >
            <Smartphone size={14} className="shrink-0 rotate-90" />
            <span>Rotate phone & pinch to zoom for a better view</span>
            <button
              onClick={() => setHintDismissed(true)}
              className="shrink-0 opacity-80 hover:opacity-100"
              aria-label="Dismiss hint"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Zoom controls */}
      <div
        className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 rounded-2xl bg-black/60 p-1 backdrop-blur-sm"
        onTouchStart={stopTouch}
      >
        <button
          onClick={() => zoomToFocal(view.current.scale - 0.5)}
          disabled={scale <= MIN_SCALE}
          title="Zoom out"
          className="grid h-9 w-9 place-items-center rounded-xl text-white transition hover:bg-white/15 disabled:opacity-40"
        >
          <ZoomOut size={18} />
        </button>
        <span className="min-w-[3rem] text-center text-xs font-semibold text-white tabular-nums">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={() => zoomToFocal(view.current.scale + 0.5)}
          disabled={scale >= MAX_SCALE}
          title="Zoom in"
          className="grid h-9 w-9 place-items-center rounded-xl text-white transition hover:bg-white/15 disabled:opacity-40"
        >
          <ZoomIn size={18} />
        </button>
        <button
          onClick={reset}
          disabled={scale === MIN_SCALE && tx === 0 && ty === 0}
          title="Fit to screen"
          className="grid h-9 w-9 place-items-center rounded-xl text-white transition hover:bg-white/15 disabled:opacity-40"
        >
          <Maximize2 size={18} />
        </button>
      </div>
    </div>
  );
}
