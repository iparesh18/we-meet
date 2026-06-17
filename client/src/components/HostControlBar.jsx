import { Lock, Unlock, Download, PhoneOff, PanelRight, Loader2 } from 'lucide-react';
import ControlButton from './ControlButton.jsx';
import LayoutSwitcher from './LayoutSwitcher.jsx';

/**
 * Bottom control bar for the host. `mediaSlot` carries the LiveKit-powered
 * mic/camera/share buttons (or disabled placeholders when video is off).
 */
export default function HostControlBar({
  mediaSlot,
  locked,
  onToggleLock,
  lockBusy,
  onAttendance,
  downloading,
  onEnd,
  onTogglePanel,
  waitingCount,
  layout,
  onLayout,
}) {
  return (
    <div className="shrink-0 bg-slate-900">
      {/* mobile-only layout switcher row */}
      <div className="flex justify-center border-b border-white/5 px-3 py-2 md:hidden">
        <LayoutSwitcher value={layout} onChange={onLayout} />
      </div>

      <div className="flex items-center justify-between gap-2 px-3 py-3 sm:px-4">
        <div className="hidden lg:block lg:w-72">
          <LayoutSwitcher value={layout} onChange={onLayout} />
        </div>

        <div className="flex flex-1 items-center justify-center gap-2 overflow-x-auto no-scrollbar sm:gap-3">
          {mediaSlot}
          <ControlButton
            icon={locked ? Lock : Unlock}
            label={locked ? 'Locked' : 'Lock'}
            tone={locked ? 'warn' : 'default'}
            onClick={onToggleLock}
            disabled={lockBusy}
            title={locked ? 'Unlock the room' : 'Lock the room — no new students can join'}
          />
          <ControlButton
            icon={downloading ? Loader2 : Download}
            label="Attendance"
            tone="default"
            onClick={onAttendance}
            disabled={downloading}
            title="Download attendance as Excel"
          />
          <ControlButton icon={PhoneOff} label="End" tone="danger" onClick={onEnd} title="End the class for everyone" />
        </div>

        <div className="flex items-center justify-end lg:w-72">
          <ControlButton
            icon={PanelRight}
            label="People"
            tone="default"
            onClick={onTogglePanel}
            badge={waitingCount}
            title="Toggle the people & waiting room panel"
          />
        </div>
      </div>
    </div>
  );
}
