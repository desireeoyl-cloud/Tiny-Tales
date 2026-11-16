'use client';

import { useState } from 'react';
import { ANIMALS, DEFAULT_HERO, HAIR_COLORS, HAIR_STYLES, SKIN_TONES, heroCard, type Hero } from '@/lib/hero';
import type { Brief as BriefData } from '@/lib/schema';
import { Art } from '../Art';
import { TopBar } from '../ui';
import type { Path } from './Welcome';

export interface BriefInput {
  name: string;
  age: number | null;
  hero: Hero;
  moment: string;
  feeling: string;
}

export const EMPTY_BRIEF: BriefInput = { name: '', age: null, hero: DEFAULT_HERO, moment: '', feeling: '' };

const MOMENTS = [
  { label: 'Swimming lessons', text: (n: string) => `${n} is nervous about starting swimming lessons.` },
  { label: 'A new sibling', text: (n: string) => `${n} is getting a new baby brother or sister.` },
  { label: 'A friendship', text: (n: string) => `${n} had a little fall-out with a good friend.` },
  { label: 'A fear', text: (n: string) => `${n} is a little afraid of the dark at bedtime.` },
  { label: 'First day at school', text: (n: string) => `${n} is starting at a new school tomorrow.` },
];

const THEMES = [
  { label: 'Dinosaur picnic', text: (n: string) => `${n} has a picnic with a friendly dinosaur.` },
  { label: 'A trip to the moon', text: (n: string) => `${n} takes a gentle trip to the moon in a little boat.` },
  { label: 'Lantern garden', text: (n: string) => `${n} walks through a garden of glowing lanterns with a small bunny.` },
  { label: 'The sleepy bear', text: (n: string) => `${n} helps a sleepy bear find a cosy place to rest.` },
  { label: 'Boat on the lake', text: (n: string) => `${n} sails a little boat across a calm lake at sunset.` },
  { label: 'Animals say goodnight', text: (n: string) => `${n} says goodnight to all the animals on the farm.` },
];

const FEELINGS = ['brave', 'calm', 'proud', 'loved', 'curious'];

interface Props {
  path: Path;
  initial: BriefInput;
  onBack: () => void;
  onInfo: () => void;
  onSubmit: (brief: BriefData, input: BriefInput) => void;
}

export function toBrief(i: BriefInput): BriefData {
  return {
    name: i.name.trim(),
    age: i.age ?? 5,
    look: heroCard(i.hero),
    moment: i.moment.trim(),
    ...(i.feeling.trim() ? { feeling: i.feeling.trim() } : {}),
  };
}

export function BriefScreen({ path, initial, onBack, onInfo, onSubmit }: Props) {
  const [step, setStep] = useState(1);
  const [input, setInput] = useState<BriefInput>(initial);
  const [chipFilled, setChipFilled] = useState(false);
  const set = (patch: Partial<BriefInput>) => setInput((p) => ({ ...p, ...patch }));
  const setHero = (patch: Partial<Hero>) => setInput((p) => ({ ...p, hero: { ...p.hero, ...patch } }));

  const name = input.name.trim();
  const ok1 = name.length > 0 && input.age !== null;
  const ok2 = input.moment.trim().length >= 3;
  const options = path === 'theme' ? THEMES : MOMENTS;
  const showChips = input.moment === '' || chipFilled;

  const back = () => (step === 1 ? onBack() : setStep(step - 1));
  const next = () => {
    if (step === 1 && ok1) setStep(2);
    else if (step === 2 && ok2) setStep(3);
    else if (step === 3) onSubmit(toBrief(input), input);
  };

  return (
    <form
      className="screen"
      onSubmit={(e) => {
        e.preventDefault();
        next();
      }}
      noValidate
    >
      <TopBar
        left={
          <button type="button" className="link" onClick={back} aria-label={step === 1 ? 'Back to start' : 'Back to the previous question'}>
            ← Back
          </button>
        }
        right={
          <button type="button" className="link" onClick={onInfo}>
            How this works
          </button>
        }
      />

      <div style={{ ['--i' as string]: 1, display: 'grid', gap: 8 }}>
        <div className="eyebrow">Question {step} of 3</div>
        <div className="progress" role="progressbar" aria-valuemin={1} aria-valuemax={3} aria-valuenow={step} aria-label="Progress">
          <i style={{ width: `${(step / 3) * 100}%` }} />
        </div>
      </div>

      {step === 1 && (
        <>
          <h1 style={{ fontSize: 32, ['--i' as string]: 2 }}>Who is the story for?</h1>
          <div className="field" style={{ ['--i' as string]: 3 }}>
            <label htmlFor="name">First name or nickname</label>
            <input
              id="name"
              className="input"
              value={input.name}
              maxLength={30}
              autoComplete="off"
              autoCapitalize="words"
              placeholder="For example, Emma"
              onChange={(e) => set({ name: e.target.value })}
              autoFocus
            />
            <span className="hint">First name only, please. No surnames.</span>
          </div>

          <div className="field" style={{ ['--i' as string]: 4 }} role="group" aria-labelledby="age-label">
            <span className="label" id="age-label">
              How old are they?
            </span>
            <div className="chips">
              {[4, 5, 6, 7].map((a) => (
                <button key={a} type="button" className="chip" aria-pressed={input.age === a} onClick={() => set({ age: a })}>
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div className="field" style={{ ['--i' as string]: 5 }}>
            <span className="label">Who is the hero?</span>
            <span className="hint">A picture to match your child. No photos, ever.</span>
            <div className="hero-row">
              <div className="preview-art" aria-hidden="false">
                <Art seed={`preview-${input.hero.mode}`} hero={input.hero} cover progress={0.5} alt="Preview of the hero" />
              </div>
              <div style={{ display: 'grid', gap: 12, flex: 1, minWidth: 0 }}>
                <div className="seg" role="group" aria-label="Hero type">
                  <button type="button" aria-pressed={input.hero.mode === 'child'} onClick={() => setHero({ mode: 'child' })}>
                    A child
                  </button>
                  <button type="button" aria-pressed={input.hero.mode === 'animal'} onClick={() => setHero({ mode: 'animal' })}>
                    An animal
                  </button>
                </div>
                {input.hero.mode === 'animal' && (
                  <div className="chips" role="group" aria-label="Choose an animal">
                    {ANIMALS.map((a) => (
                      <button key={a.value} type="button" className="chip" aria-pressed={input.hero.animal === a.value} onClick={() => setHero({ animal: a.value })}>
                        {a.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {input.hero.mode === 'child' && (
              <div style={{ display: 'grid', gap: 14, marginTop: 4 }}>
                <div role="group" aria-label="Skin tone" className="swatches">
                  {SKIN_TONES.map((s) => (
                    <button key={s.value} type="button" className="swatch" style={{ background: s.value }} aria-label={`Skin tone: ${s.label}`} aria-pressed={input.hero.skin === s.value} onClick={() => setHero({ skin: s.value })} />
                  ))}
                </div>
                <div role="group" aria-label="Hair colour" className="swatches">
                  {HAIR_COLORS.map((s) => (
                    <button key={s.value} type="button" className="swatch" style={{ background: s.value }} aria-label={`Hair colour: ${s.label}`} aria-pressed={input.hero.hairColor === s.value} onClick={() => setHero({ hairColor: s.value })} />
                  ))}
                </div>
                <div className="chips" role="group" aria-label="Hair style">
                  {HAIR_STYLES.map((s) => (
                    <button key={s.value} type="button" className="chip" aria-pressed={input.hero.hairStyle === s.value} onClick={() => setHero({ hairStyle: s.value })}>
                      {s.label} hair
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h1 style={{ fontSize: 32, ['--i' as string]: 2 }}>{path === 'theme' ? 'Pick a story to begin with.' : `What is happening for ${name}?`}</h1>
          <div className="field" style={{ ['--i' as string]: 3 }}>
            <label htmlFor="moment">{path === 'theme' ? 'Choose one, then change the words if you like' : 'Tell it in your own words'}</label>
            <textarea
              id="moment"
              className="textarea"
              rows={4}
              maxLength={600}
              value={input.moment}
              placeholder={`For example, ${name} is nervous about starting swimming lessons.`}
              onChange={(e) => {
                setChipFilled(false);
                set({ moment: e.target.value });
              }}
              autoFocus={path === 'moment'}
            />
            <span className="count" aria-hidden="true">
              {input.moment.length} / 600
            </span>
            <span className="hint">Please leave out surnames, addresses and schools.</span>
          </div>
          {showChips && (
            <div className="field" style={{ ['--i' as string]: 4 }}>
              <span className="label" style={{ fontSize: 16 }}>
                {path === 'theme' ? 'Themes' : 'Or start from a moment'}
              </span>
              <div className="chips">
                {options.map((o) => (
                  <button
                    key={o.label}
                    type="button"
                    className="chip"
                    onClick={() => {
                      setChipFilled(true);
                      set({ moment: o.text(name) });
                    }}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {step === 3 && (
        <>
          <h1 style={{ fontSize: 32, ['--i' as string]: 2 }}>How should it leave {name} feeling?</h1>
          <div className="field" style={{ ['--i' as string]: 3 }}>
            <span className="hint">Optional. Pick one, or skip it.</span>
            <div className="chips" role="group" aria-label="Feeling">
              {FEELINGS.map((f) => (
                <button key={f} type="button" className="chip" aria-pressed={input.feeling === f} onClick={() => set({ feeling: input.feeling === f ? '' : f })}>
                  {f[0].toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="card card-flat" style={{ ['--i' as string]: 4, display: 'grid', gap: 6 }}>
            <div className="eyebrow">What we will send to the AI</div>
            <p>
              {name}, age {input.age}. “{input.moment.trim()}”{input.feeling ? ` Feeling ${input.feeling}.` : ''}
            </p>
            <p className="small muted">You will read the story before anyone else sees it.</p>
          </div>
        </>
      )}

      <div className="stickybar" style={{ ['--i' as string]: 6 }}>
        <button type="submit" className="btn btn-primary" disabled={(step === 1 && !ok1) || (step === 2 && !ok2)}>
          {step === 3 ? 'Write the story' : 'Next'}
        </button>
      </div>
    </form>
  );
}
