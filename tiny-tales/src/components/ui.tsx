'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

export function Moon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="15" fill="#241B3B" />
      <path d="M20.5 6.5a10.5 10.5 0 1 0 0 19a8.5 8.5 0 1 1 0-19z" fill="#F8E8B8" />
      <circle cx="24" cy="9" r="1.4" fill="#F8E8B8" />
    </svg>
  );
}

export function TopBar({ left, right }: { left?: ReactNode; right?: ReactNode }) {
  return (
    <div className="topbar" style={{ ['--i' as string]: 0 }}>
      {left ?? (
        <span className="brand">
          <Moon /> Tiny Tales
        </span>
      )}
      {right}
    </div>
  );
}

/** A native dialog: focus is trapped, Escape closes it, and it works with a screen reader. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className="sheet" aria-labelledby="sheet-title" onClose={onClose}>
      <h2 id="sheet-title">{title}</h2>
      {children}
    </dialog>
  );
}

export function Toast({ children }: { children: ReactNode }) {
  return (
    <div className="toast" role="status">
      {children}
    </div>
  );
}

/**
 * Leaving the reader needs a deliberate two-second press and hold, so a child cannot exit by accident.
 * Keyboard and screen-reader users reach the same place with a normal activation (their click has no
 * pointer, so `detail` is 0). That is the accessible alternative the PRD asks for.
 */
export function HoldButton({ onComplete, label = 'Hold for parent' }: { onComplete: () => void; label?: string }) {
  const [holding, setHolding] = useState(false);
  const timer = useRef<number | null>(null);

  const cancel = () => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
  };
  const start = () => {
    setHolding(true);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setHolding(false);
      onComplete();
    }, 2000);
  };
  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  return (
    <button
      type="button"
      className={`hold${holding ? ' holding' : ''}`}
      aria-label="Parent area. Press and hold for two seconds, or press Enter."
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onClick={(e) => {
        if (e.detail === 0) onComplete();
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <svg viewBox="0 0 38 38" aria-hidden="true">
        <circle cx="19" cy="19" r="16" fill="none" stroke="rgba(248,232,184,.25)" strokeWidth="4" />
        <circle className="ring" cx="19" cy="19" r="16" pathLength="100" />
        <rect x="13" y="18" width="12" height="9" rx="2.5" fill="#F8E8B8" />
        <path d="M15.5 18v-3a3.5 3.5 0 0 1 7 0v3" fill="none" stroke="#F8E8B8" strokeWidth="2.2" />
      </svg>
      {label}
    </button>
  );
}
