'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Animal, Hero } from '@/lib/hero';
import type { Brief, Story } from '@/lib/schema';
import { Art } from '../Art';
import { HoldButton } from '../ui';

interface Props {
  brief: Brief;
  hero: Hero;
  story: Story;
  companion: Animal | null;
  onFinish: () => void;
  onParent: () => void;
}

/**
 * What the child sees: one picture, one page of words, nothing to press except by the parent's hand.
 * The picture leads. Tap the right or left third, or swipe, to turn the page.
 */
export function Reader({ brief, hero, story, companion, onFinish, onParent }: Props) {
  const total = story.pages.length;
  const [i, setI] = useState(0);
  const [dir, setDir] = useState<'next' | 'prev' | ''>('');
  const down = useRef<{ x: number; y: number } | null>(null);

  const next = useCallback(() => {
    if (i >= total - 1) return onFinish();
    setDir('next');
    setI(i + 1);
  }, [i, total, onFinish]);
  const prev = useCallback(() => {
    if (i === 0) return;
    setDir('prev');
    setI(i - 1);
  }, [i]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev]);

  const page = story.pages[i];

  return (
    <div
      className={`reader ${dir}`}
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest('.hold, .sr-focus')) return;
        down.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerUp={(e) => {
        const d = down.current;
        down.current = null;
        if (!d) return;
        const dx = e.clientX - d.x;
        const dy = e.clientY - d.y;
        if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) return dx < 0 ? next() : prev();
        if (Math.abs(dx) < 12 && Math.abs(dy) < 12) {
          const w = window.innerWidth;
          if (e.clientX > (w * 2) / 3) next();
          else if (e.clientX < w / 3) prev();
        }
      }}
    >
      <div className="reader-col">
        <div className="reader-top">
          <HoldButton onComplete={onParent} />
        </div>
        <div className="reader-art" key={`a${i}`}>
          <Art seed={`page-${brief.name}-${page.n}`} scene={page.scene ?? story.cover_scene} hero={hero} companion={companion} progress={total > 1 ? i / (total - 1) : 0.5} alt={page.scene ?? 'A soft picture-book scene'} />
        </div>
        <p className="reader-text" key={`t${i}`} aria-live="polite">
          {page.text}
        </p>
        <div className="reader-dots" aria-hidden="true">
          {story.pages.map((_, idx) => (
            <i key={idx} className={idx === i ? 'on' : ''} />
          ))}
        </div>
        <span className="sr-only">
          Page {i + 1} of {total}
        </span>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button className="sr-focus btn btn-small" onClick={prev} disabled={i === 0}>
            Previous page
          </button>
          <button className="sr-focus btn btn-small" onClick={next}>
            {i === total - 1 ? 'Finish the story' : 'Next page'}
          </button>
        </div>
      </div>
    </div>
  );
}

/** The ending: no buttons for the child, a slow moon, and only the parent's hold gate. */
export function Goodnight({ brief, story, onParent }: { brief: Brief; story: Story; onParent: () => void }) {
  return (
    <div className="reader">
      <div className="reader-col">
        <div className="reader-top">
          <HoldButton onComplete={onParent} />
        </div>
        <div className="screen goodnight" style={{ flex: 1 }}>
          <div className="moon" aria-hidden="true" />
          <h1>Goodnight, {brief.name}</h1>
          {story.ending_line && <p className="fadeslow">{story.ending_line}</p>}
        </div>
      </div>
    </div>
  );
}
