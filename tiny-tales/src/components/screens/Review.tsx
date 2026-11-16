'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ADJUSTMENTS, ADJUST_IDS, type AdjustId } from '@/lib/adjust';
import type { Animal, Hero } from '@/lib/hero';
import type { Brief, Story } from '@/lib/schema';
import { Art } from '../Art';
import { Toast, TopBar } from '../ui';

function AutoTextarea({ value, onChange, label, className = 'textarea' }: { value: string; onChange: (v: string) => void; label: string; className?: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [value]);
  return <textarea ref={ref} className={className} aria-label={label} value={value} rows={2} onChange={(e) => onChange(e.target.value)} />;
}

interface Props {
  brief: Brief;
  hero: Hero;
  story: Story;
  companion: Animal | null;
  demo: boolean;
  canUndo: boolean;
  busy: string | null;
  message: string | null;
  onEdit: (next: Story) => void;
  onAdjust: (id: AdjustId) => void;
  onRegenerate: () => void;
  onUndo: () => void;
  onApprove: () => void;
  onBack: () => void;
}

export function Review({ brief, hero, story, companion, demo, canUndo, busy, message, onEdit, onAdjust, onRegenerate, onUndo, onApprove, onBack }: Props) {
  const [i, setI] = useState(0);
  const total = story.pages.length;
  useEffect(() => {
    if (i > total - 1) setI(Math.max(0, total - 1));
  }, [i, total]);
  const page = story.pages[Math.min(i, total - 1)];
  const last = i >= total - 1;

  const setPageText = (text: string) => onEdit({ ...story, pages: story.pages.map((p, idx) => (idx === i ? { ...p, text } : p)) });

  return (
    <section className="screen" style={{ position: 'relative' }}>
      <TopBar
        left={
          <button className="link" onClick={onBack}>
            ← My answers
          </button>
        }
      />

      <div style={{ display: 'grid', gap: 6, ['--i' as string]: 1 }}>
        <div className="eyebrow">Review the draft</div>
        <textarea className="title-input" rows={2} aria-label="Story title" value={story.title} maxLength={80} onChange={(e) => onEdit({ ...story, title: e.target.value.replace(/\n/g, " ") })} />
        <p className="small muted">Written by AI from what you told us. Please read it before sharing. Tap any line to change it.</p>
      </div>

      {demo && (
        <div className="notice notice-demo" role="note" style={{ ['--i' as string]: 2 }}>
          <span aria-hidden="true">✦</span>
          <span>Demo mode: this is a placeholder story, not written by AI.</span>
        </div>
      )}
      {story.safety.tier === 'amber' && (
        <div className="notice" role="note" style={{ ['--i' as string]: 2 }}>
          <span aria-hidden="true">♡</span>
          <span>This is a tender moment. Please read the story closely, and change anything that doesn’t feel right for your child.</span>
        </div>
      )}
      {story.facts_added.length > 0 && (
        <div className="notice" role="alert" style={{ ['--i' as string]: 2 }}>
          <span aria-hidden="true">!</span>
          <span>
            This story added details you did not give us. Please check it.
            <span className="small muted" style={{ display: 'block', fontWeight: 600 }}>{story.facts_added.join('; ')}</span>
          </span>
        </div>
      )}

      <div className="chips-scroll" role="group" aria-label="Quick changes" style={{ ['--i' as string]: 3 }}>
        {ADJUST_IDS.map((id) => (
          <button key={id} className="chip" disabled={!!busy} onClick={() => onAdjust(id)}>
            {ADJUSTMENTS[id].label}
          </button>
        ))}
      </div>

      <div className="page-card" style={{ ['--i' as string]: 4, position: 'relative' }}>
        <div className="page-art">
          <Art seed={`page-${brief.name}-${page.n}`} scene={page.scene ?? story.cover_scene} hero={hero} companion={companion} progress={total > 1 ? i / (total - 1) : 0.5} alt={page.scene ?? 'A soft picture-book scene'} />
        </div>
        <div className="page-body" style={{ display: 'grid', gap: 10 }}>
          <AutoTextarea label={`Page ${page.n} text`} value={page.text} onChange={setPageText} />
          {last && (
            <div style={{ display: 'grid', gap: 4 }}>
              <span className="eyebrow">Goodnight line</span>
              <AutoTextarea label="Goodnight line" value={story.ending_line ?? ''} onChange={(v) => onEdit({ ...story, ending_line: v })} />
            </div>
          )}
        </div>
        {busy && (
          <div className="overlay-busy" role="status">
            <div style={{ display: 'grid', gap: 12, justifyItems: 'center' }}>
              <span className="dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              {busy}
            </div>
          </div>
        )}
      </div>

      <div className="pager" style={{ ['--i' as string]: 5 }}>
        <button className="btn btn-quiet round" aria-label="Previous page" disabled={i === 0 || !!busy} onClick={() => setI(i - 1)}>
          ‹
        </button>
        <span style={{ fontWeight: 800 }}>
          Page {Math.min(i + 1, total)} of {total}
        </span>
        <button className="btn btn-quiet round" aria-label="Next page" disabled={last || !!busy} onClick={() => setI(i + 1)}>
          ›
        </button>
      </div>

      {canUndo && (
        <button className="link" style={{ alignSelf: 'center', ['--i' as string]: 6 }} disabled={!!busy} onClick={onUndo}>
          Undo the last change
        </button>
      )}

      <div className="stickybar" style={{ ['--i' as string]: 7 }}>
        <button className="btn btn-quiet" disabled={!!busy} onClick={onRegenerate}>
          Try a new draft
        </button>
        <button className="btn btn-primary" disabled={!!busy} onClick={onApprove}>
          Approve this story
        </button>
      </div>

      {message && <Toast>{message}</Toast>}
    </section>
  );
}
