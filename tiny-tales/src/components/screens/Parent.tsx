'use client';

import { useEffect, useState } from 'react';
import type { Animal, Hero } from '@/lib/hero';
import type { Brief, Story } from '@/lib/schema';
import type { SavedStory } from '@/lib/client/types';
import { Art, companionFor } from '../Art';
import { TopBar } from '../ui';

interface ParentProps {
  brief: Brief;
  story: Story;
  saved: boolean;
  storageOk: boolean;
  onTalkViewed: () => void;
  onSave: (rating: number | null, answer: string) => void;
  onReadAgain: (rating: number | null, answer: string) => void;
  onEdit: (rating: number | null, answer: string) => void;
  onNew: (rating: number | null, answer: string) => void;
}

const RATING_LABELS = ['Not really', 'A little', 'Somewhat', 'Quite a lot', 'Very much'];

export function ParentArea({ brief, story, saved, storageOk, onTalkViewed, onSave, onReadAgain, onEdit, onNew }: ParentProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    if (story.talk_about.length) onTalkViewed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="screen">
      <TopBar />
      <div style={{ ['--i' as string]: 1 }}>
        <h1 style={{ fontSize: 34 }}>How did it go?</h1>
        <p className="muted">That was “{story.title}”. A few things to try, and two quick questions for you.</p>
      </div>

      {story.talk_about.length > 0 && (
        <div className="card talk" style={{ ['--i' as string]: 2 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            Things to talk about
          </div>
          <ul className="bullets">
            {story.talk_about.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="field" style={{ ['--i' as string]: 3 }} role="group" aria-labelledby="rate-label">
        <span className="label" id="rate-label">
          Did this feel like {brief.name}?
        </span>
        <div className="rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" aria-pressed={rating === n} aria-label={`${n} of 5, ${RATING_LABELS[n - 1]}`} onClick={() => setRating(rating === n ? null : n)} disabled={saved}>
              {n}
            </button>
          ))}
        </div>
        <div className="rating-ends" aria-hidden="true">
          <span>Not really</span>
          <span>Very much</span>
        </div>
      </div>

      <div className="field" style={{ ['--i' as string]: 4 }}>
        <label htmlFor="answer">What will you talk about?</label>
        <textarea id="answer" className="textarea" rows={2} maxLength={300} value={answer} disabled={saved} placeholder="Optional. Please leave out names." onChange={(e) => setAnswer(e.target.value)} />
      </div>

      {!storageOk && (
        <div className="notice" role="note">
          This browser can’t keep stories on this device right now, so saving may not last. You can still read it again now.
        </div>
      )}

      <div style={{ display: 'grid', gap: 12, ['--i' as string]: 5 }}>
        <button className="btn btn-primary btn-block" disabled={saved} onClick={() => onSave(rating, answer.trim())}>
          {saved ? 'Saved ✓' : 'Save story'}
        </button>
        <button className="btn btn-block" onClick={() => onReadAgain(rating, answer.trim())}>
          Read it again
        </button>
        <button className="btn btn-quiet btn-block" onClick={() => onNew(rating, answer.trim())}>
          Make another story
        </button>
        <button className="link" style={{ justifySelf: 'center' }} onClick={() => onEdit(rating, answer.trim())}>
          Change this story
        </button>
      </div>
    </section>
  );
}

export function Library({ stories, onBack, onOpen, onDelete }: { stories: SavedStory[]; onBack: () => void; onOpen: (s: SavedStory) => void; onDelete: (id: string) => void }) {
  const [confirm, setConfirm] = useState<string | null>(null);
  return (
    <section className="screen">
      <TopBar
        left={
          <button className="link" onClick={onBack}>
            ← Back
          </button>
        }
      />
      <h1 style={{ fontSize: 34, ['--i' as string]: 1 }}>Saved stories</h1>
      {stories.length === 0 ? (
        <div className="card card-flat" style={{ display: 'grid', gap: 12, ['--i' as string]: 2 }}>
          <p>No stories saved yet. Make one and it will wait for you here.</p>
          <button className="btn btn-primary" onClick={onBack}>
            Make a story
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {stories.map((s, idx) => {
            const companion: Animal | null = companionFor(s.story);
            const hero: Hero = s.hero;
            return (
              <div key={s.id} className="card lib-item" style={{ ['--i' as string]: idx + 2 }}>
                <div className="lib-thumb">
                  <Art seed={`page-${s.brief.name}-1`} scene={s.story.cover_scene} hero={hero} companion={companion} cover alt="" />
                </div>
                <button className="lib-main" onClick={() => onOpen(s)} aria-label={`Read ${s.story.title}`}>
                  <strong>{s.story.title}</strong>
                  <span className="small muted">
                    {s.brief.name} · {new Date(s.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                </button>
                {confirm === s.id ? (
                  <button className="btn btn-small" style={{ background: '#fbd9d2' }} onClick={() => onDelete(s.id)}>
                    Delete?
                  </button>
                ) : (
                  <button className="link" aria-label={`Delete ${s.story.title}`} onClick={() => setConfirm(s.id)}>
                    Delete
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export interface NoticeAction {
  label: string;
  onClick: () => void;
  primary?: boolean;
}

export function NoticeScreen({ title, message, actions }: { title: string; message: string; actions: NoticeAction[] }) {
  return (
    <section className="screen">
      <TopBar />
      <div className="card" style={{ display: 'grid', gap: 14, ['--i' as string]: 1, marginTop: 10 }} role="alert">
        <h1 style={{ fontSize: 30 }}>{title}</h1>
        <p>{message}</p>
        <div style={{ display: 'grid', gap: 10 }}>
          {actions.map((a) => (
            <button key={a.label} className={`btn btn-block ${a.primary ? 'btn-primary' : 'btn-quiet'}`} onClick={a.onClick}>
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
