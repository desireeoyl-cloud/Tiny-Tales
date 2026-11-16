'use client';

import { useEffect, useState } from 'react';
import type { Hero } from '@/lib/hero';
import type { Brief } from '@/lib/schema';
import { Art } from '../Art';
import { TopBar } from '../ui';

const LINES = ['Finding the right words', 'Setting the scene', 'Choosing a calm ending', 'Slowing down for bedtime'];
const SLOW_AFTER_MS = 20_000;

interface Props {
  brief: Brief;
  hero: Hero;
  onCancel: () => void;
  onRetry: () => void;
}

/** The wait is part of the experience: the brief is echoed back so the parent knows they were heard. */
export function Making({ brief, hero, onCancel, onRetry }: Props) {
  const [line, setLine] = useState(0);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const a = window.setInterval(() => setLine((l) => (l + 1) % LINES.length), 3600);
    const b = window.setTimeout(() => setSlow(true), SLOW_AFTER_MS);
    return () => {
      window.clearInterval(a);
      window.clearTimeout(b);
    };
  }, []);

  const echo = brief.moment.length > 90 ? `${brief.moment.slice(0, 88).trimEnd()}…` : brief.moment;

  return (
    <section className="screen making" aria-live="polite">
      <TopBar left={<span />} />
      <div className="making-art" style={{ ['--i' as string]: 1 }}>
        <Art seed="making" hero={hero} cover progress={0.9} alt="" />
      </div>
      <div style={{ display: 'grid', gap: 10, ['--i' as string]: 2 }}>
        <h1 style={{ fontSize: 32 }}>Writing {brief.name}’s story</h1>
        <p className="lede" style={{ fontSize: 17 }}>
          “{echo}”
        </p>
      </div>
      <div style={{ display: 'grid', gap: 10, justifyItems: 'center', ['--i' as string]: 3 }}>
        <span className="dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <p className="fade-swap muted" key={line} style={{ fontWeight: 700 }}>
          {LINES[line]}…
        </p>
      </div>
      {slow ? (
        <div className="card card-flat" style={{ display: 'grid', gap: 12, textAlign: 'left', width: '100%' }} role="status">
          <p style={{ fontWeight: 800 }}>This is taking longer than usual.</p>
          <p className="muted small">Your answers are saved. You can keep waiting, or try again.</p>
          <div className="stickybar" style={{ position: 'static', margin: 0, padding: 0, background: 'none' }}>
            <button type="button" className="btn btn-quiet btn-small" onClick={onCancel}>
              Back to my answers
            </button>
            <button type="button" className="btn btn-primary btn-small" onClick={onRetry}>
              Try again
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="link" onClick={onCancel} style={{ ['--i' as string]: 4 }}>
          Cancel
        </button>
      )}
    </section>
  );
}
