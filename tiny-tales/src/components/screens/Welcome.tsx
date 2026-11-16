'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_HERO } from '@/lib/hero';
import { Art } from '../Art';
import { TopBar } from '../ui';

export type Path = 'moment' | 'theme';

interface Props {
  demo: boolean;
  paused: boolean;
  consented: boolean;
  storageOk: boolean;
  savedCount: number;
  onConsent: () => void;
  onStart: (path: Path) => void;
  onLibrary: () => void;
}

function useIosTip(): boolean {
  const [tip, setTip] = useState(false);
  useEffect(() => {
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const standalone = (navigator as unknown as { standalone?: boolean }).standalone === true || window.matchMedia('(display-mode: standalone)').matches;
    setTip(ios && !standalone);
  }, []);
  return tip;
}

export function Welcome({ demo, paused, consented, storageOk, savedCount, onConsent, onStart, onLibrary }: Props) {
  const iosTip = useIosTip();
  return (
    <section className="screen">
      <TopBar
        right={
          savedCount > 0 ? (
            <button className="link" onClick={onLibrary}>
              Saved stories ({savedCount})
            </button>
          ) : undefined
        }
      />

      <div className="welcome-art" style={{ ['--i' as string]: 1 }}>
        <Art seed="welcome" hero={DEFAULT_HERO} companion="dino" cover alt="A small child in yellow pyjamas and a friendly green dinosaur on a hill under a glowing moon" />
      </div>

      <div style={{ ['--i' as string]: 2, display: 'grid', gap: 10 }}>
        <h1 className="title-xl">A story that is about your child.</h1>
        <p className="lede">Tell us one real moment from their day. We write a calm bedtime story from it, and you read it together.</p>
      </div>

      {demo && (
        <div className="notice notice-demo" style={{ ['--i' as string]: 3 }} role="note">
          <span aria-hidden="true">✦</span>
          <span>Demo mode: this is a sample, so every story is a placeholder. Real AI stories come once the app is connected.</span>
        </div>
      )}

      {paused && (
        <div className="notice" role="alert">
          The beta is paused for now. Please check back soon.
        </div>
      )}

      {!consented ? (
        <div className="card" style={{ ['--i' as string]: 3, display: 'grid', gap: 12 }}>
          <h2 style={{ fontSize: 24 }}>Before you start</h2>
          <ul className="bullets">
            <li>Stories are written by AI from what you type. Please read every story before you share it with your child.</li>
            <li>We send your child’s first name, their age and the words you type to an AI service to write the story. Please leave out surnames, addresses and schools.</li>
            <li>Stories are saved only on this device. You can delete them at any time.</li>
          </ul>
          <button className="btn btn-primary btn-block" onClick={onConsent}>
            Got it, let’s begin
          </button>
        </div>
      ) : (
        <div style={{ ['--i' as string]: 3, display: 'grid', gap: 14 }}>
          <button className="path-btn primary" disabled={paused} onClick={() => onStart('moment')}>
            <svg className="glyph" viewBox="0 0 40 40" aria-hidden="true">
              <path d="M20 5l4.2 9.6 10.3 1-7.8 6.9 2.3 10.2L20 27.2 11 32.7l2.3-10.2-7.8-6.9 10.3-1z" fill="#241B3B" />
            </svg>
            <span>
              <strong>A moment from their life</strong>
              <span>Swimming lessons, a new sibling, a big feeling</span>
            </span>
          </button>
          <button className="path-btn" disabled={paused} onClick={() => onStart('theme')}>
            <svg className="glyph" viewBox="0 0 40 40" aria-hidden="true">
              <path d="M8 28c0-9 5-17 12-17s12 8 12 17z" fill="none" stroke="#241B3B" strokeWidth="3" strokeLinejoin="round" />
              <circle cx="20" cy="12" r="3" fill="#241B3B" />
            </svg>
            <span>
              <strong>Pick a theme</strong>
              <span>A gentle adventure to start from</span>
            </span>
          </button>
        </div>
      )}

      {iosTip && consented && (
        <p className="small muted" style={{ ['--i' as string]: 4 }}>
          Tip: tap Share, then Add to Home Screen, so your saved stories stay put on this phone.
        </p>
      )}
      {!storageOk && consented && (
        <div className="notice" role="note">
          This browser won’t let us save stories right now (private browsing?). You can still make and read them.
        </div>
      )}
    </section>
  );
}
