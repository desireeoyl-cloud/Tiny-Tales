import { useId } from 'react';
import type { Animal, Hero } from '@/lib/hero';
import type { Story } from '@/lib/schema';

/**
 * The picture-book art. Every scene is drawn here as layered, hand-painted-looking SVG (soft hills, a moon,
 * a hero built from the parent's choices, an optional animal friend), so the app has beautiful pictures with
 * no image service and no cost. Generated illustrations can replace the key pages later; these stay as the
 * fallback the PRD asks for. Scenes are chosen from words in the scene description and from where the page
 * sits in the story, so the light moves from morning toward night as the story winds down.
 */

const INK = '#241B3B';

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

interface Palette {
  sky: [string, string, string];
  far: string;
  mid: string;
  near: string;
  glow: string;
  stars: boolean;
  celestial: 'moon' | 'sun';
}

const DAWN: Palette = { sky: ['#9CC3DC', '#F3DDBA', '#F7C8A0'], far: '#B9C9B4', mid: '#8FB996', near: '#6FA27A', glow: '#FFF3D0', stars: false, celestial: 'sun' };
const TEAL: Palette = { sky: ['#4E86A6', '#8DBBC6', '#F2DDB0'], far: '#7FA3A0', mid: '#5F9A8A', near: '#47806F', glow: '#FFF0C8', stars: false, celestial: 'sun' };
const DUSK: Palette = { sky: ['#5B4B8A', '#C97B9B', '#F6C89F'], far: '#8E7FB0', mid: '#6B6AA0', near: '#4F5C8F', glow: '#FFE9B8', stars: true, celestial: 'moon' };
const NIGHT: Palette = { sky: ['#171336', '#2F2870', '#5C4FA0'], far: '#3D3A80', mid: '#2F3470', near: '#25295C', glow: '#F8E8B8', stars: true, celestial: 'moon' };

function pickPalette(progress: number, seed: number, cover: boolean): Palette {
  if (cover) return DUSK;
  if (progress < 0.3) return seed % 2 ? DAWN : TEAL;
  if (progress < 0.75) return seed % 3 === 0 ? TEAL : DUSK;
  return NIGHT;
}

interface AnimalLook {
  body: string;
  belly: string;
  spike: string;
}

const ANIMAL: Record<Animal, AnimalLook> = {
  bear: { body: '#A9714A', belly: '#DDB995', spike: '#A9714A' },
  bunny: { body: '#EFE5D8', belly: '#FFF8EF', spike: '#F2B8B5' },
  fox: { body: '#E2802E', belly: '#FBE8CF', spike: '#E2802E' },
  dino: { body: '#79B58C', belly: '#D9EDCB', spike: '#4F8F68' },
};

const PYJAMA = '#F6C945';

/** Looks through the story's scene lines for an animal friend, so the same companion appears on every page. */
export function companionFor(story: Story): Animal | null {
  const text = [story.cover_scene ?? '', ...story.pages.map((p) => p.scene ?? '')].join(' ').toLowerCase();
  if (/dino/.test(text)) return 'dino';
  if (/bunny|rabbit/.test(text)) return 'bunny';
  if (/\bfox\b/.test(text)) return 'fox';
  if (/\bbear\b|teddy/.test(text)) return 'bear';
  return null;
}

function Creature({ kind, x, y, s = 1, flip = false, pyjamas = false }: { kind: Animal; x: number; y: number; s?: number; flip?: boolean; pyjamas?: boolean }) {
  const c = ANIMAL[kind];
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <ellipse cx="0" cy="2" rx="36" ry="7" fill="#000" opacity=".14" />
      {kind === 'fox' && (
        <g>
          <path d="M20 -20 C58 -26 66 -62 46 -72 C42 -50 32 -40 18 -34 Z" fill={c.body} />
          <path d="M46 -72 C55 -68 60 -62 58 -55 C51 -57 47 -62 46 -72 Z" fill="#fff" />
        </g>
      )}
      {kind === 'dino' && <path d="M18 -26 C46 -22 60 -10 70 -2 C52 -1 34 -6 18 -14 Z" fill={c.body} />}
      {kind === 'bear' && <circle cx="25" cy="-18" r="7" fill={c.body} />}
      {kind === 'bunny' && <circle cx="26" cy="-18" r="8.5" fill="#fff" />}
      {kind === 'dino' && (
        <g fill={c.spike}>
          <path d="M22 -54 L36 -60 L27 -44 Z" />
          <path d="M26 -38 L41 -40 L28 -27 Z" />
        </g>
      )}
      <ellipse cx="0" cy="-30" rx="28" ry="30" fill={c.body} />
      <ellipse cx="0" cy="-26" rx="16" ry="20" fill={c.belly} />
      {pyjamas && (
        <g>
          <rect x="-24" y="-52" width="48" height="44" rx="18" fill={PYJAMA} />
          <circle cx="-9" cy="-36" r="2.4" fill="#FFF3C4" />
          <circle cx="8" cy="-26" r="2.4" fill="#FFF3C4" />
          <circle cx="10" cy="-44" r="2" fill="#FFF3C4" />
        </g>
      )}
      <ellipse cx="-12" cy="-3" rx="10" ry="6" fill={c.body} />
      <ellipse cx="12" cy="-3" rx="10" ry="6" fill={c.body} />
      {kind === 'bear' && (
        <g>
          <circle cx="-17" cy="-96" r="8.5" fill={c.body} />
          <circle cx="17" cy="-96" r="8.5" fill={c.body} />
          <circle cx="-17" cy="-96" r="4.2" fill={c.belly} />
          <circle cx="17" cy="-96" r="4.2" fill={c.belly} />
        </g>
      )}
      {kind === 'bunny' && (
        <g>
          <ellipse cx="-11" cy="-108" rx="8" ry="22" fill={c.body} transform="rotate(-8 -11 -108)" />
          <ellipse cx="11" cy="-108" rx="8" ry="22" fill={c.body} transform="rotate(8 11 -108)" />
          <ellipse cx="-11" cy="-108" rx="4" ry="15" fill={c.spike} transform="rotate(-8 -11 -108)" />
          <ellipse cx="11" cy="-108" rx="4" ry="15" fill={c.spike} transform="rotate(8 11 -108)" />
        </g>
      )}
      {kind === 'fox' && (
        <g>
          <path d="M-23 -88 L-19 -114 L-4 -97 Z" fill={c.body} />
          <path d="M23 -88 L19 -114 L4 -97 Z" fill={c.body} />
          <path d="M-18 -94 L-17 -107 L-9 -98 Z" fill={c.belly} />
          <path d="M18 -94 L17 -107 L9 -98 Z" fill={c.belly} />
        </g>
      )}
      {kind === 'dino' && (
        <g fill={c.spike}>
          <path d="M-10 -97 L-5 -111 L0 -97 Z" />
          <path d="M1 -99 L7 -113 L12 -98 Z" />
        </g>
      )}
      <circle cx="0" cy="-76" r="25" fill={c.body} />
      <ellipse cx="0" cy="-69" rx="12" ry="9" fill={c.belly} />
      <ellipse cx="0" cy="-73" rx="4" ry="3" fill={INK} />
      <circle cx="-9.5" cy="-81" r="2.9" fill={INK} />
      <circle cx="9.5" cy="-81" r="2.9" fill={INK} />
      <ellipse cx="-16" cy="-72" rx="4.5" ry="3" fill="#E98F8A" opacity=".5" />
      <ellipse cx="16" cy="-72" rx="4.5" ry="3" fill="#E98F8A" opacity=".5" />
      <path d="M-5 -66 Q0 -61 5 -66" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  );
}

function Child({ hero, x, y, s = 1 }: { hero: Hero; x: number; y: number; s?: number }) {
  const { skin, hairColor: hair, hairStyle } = hero;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="2" rx="32" ry="7" fill="#000" opacity=".14" />
      {hairStyle === 'long' && <rect x="-27" y="-104" width="54" height="64" rx="24" fill={hair} />}
      <ellipse cx="-11" cy="-3" rx="9" ry="5.5" fill={skin} />
      <ellipse cx="11" cy="-3" rx="9" ry="5.5" fill={skin} />
      <rect x="-23" y="-64" width="46" height="58" rx="20" fill={PYJAMA} />
      <circle cx="-9" cy="-40" r="2.4" fill="#FFF3C4" />
      <circle cx="9" cy="-28" r="2.4" fill="#FFF3C4" />
      <circle cx="10" cy="-50" r="2" fill="#FFF3C4" />
      <ellipse cx="-27" cy="-38" rx="7" ry="17" fill={PYJAMA} transform="rotate(14 -27 -38)" />
      <ellipse cx="27" cy="-38" rx="7" ry="17" fill={PYJAMA} transform="rotate(-14 27 -38)" />
      <circle cx="-31" cy="-22" r="6" fill={skin} />
      <circle cx="31" cy="-22" r="6" fill={skin} />
      <circle cx="-24" cy="-82" r="5.5" fill={skin} />
      <circle cx="24" cy="-82" r="5.5" fill={skin} />
      <circle cx="0" cy="-82" r="25" fill={skin} />
      {hairStyle === 'short' && <path d="M-26 -84 C-27 -112 27 -112 26 -84 C16 -97 -16 -97 -26 -84 Z" fill={hair} />}
      {hairStyle === 'long' && (
        <g>
          <path d="M-26 -84 C-27 -112 27 -112 26 -84 C16 -98 -16 -98 -26 -84 Z" fill={hair} />
          <rect x="-27" y="-90" width="9" height="46" rx="4.5" fill={hair} />
          <rect x="18" y="-90" width="9" height="46" rx="4.5" fill={hair} />
        </g>
      )}
      {hairStyle === 'curly' && (
        <g fill={hair}>
          {[-24, -15, -5, 5, 15, 24].map((cx, i) => (
            <circle key={cx} cx={cx} cy={-98 + (i === 0 || i === 5 ? 14 : i === 1 || i === 4 ? 4 : 0)} r="11" />
          ))}
          <circle cx="-26" cy="-84" r="7" />
          <circle cx="26" cy="-84" r="7" />
        </g>
      )}
      <circle cx="-9" cy="-80" r="2.8" fill={INK} />
      <circle cx="9" cy="-80" r="2.8" fill={INK} />
      <ellipse cx="-14" cy="-72" rx="4.5" ry="3" fill="#E98F8A" opacity=".55" />
      <ellipse cx="14" cy="-72" rx="4.5" ry="3" fill="#E98F8A" opacity=".55" />
      <path d="M-6 -71 Q0 -65 6 -71" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  );
}

function hill(r: () => number, base: number, amp: number): string {
  const n = 5;
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) pts.push([-10 + i * (420 / n), base + (r() - 0.5) * 2 * amp]);
  let d = `M${pts[0][0]} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const mx = (x0 + x1) / 2;
    d += ` C${mx.toFixed(1)} ${y0.toFixed(1)} ${mx.toFixed(1)} ${y1.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }
  return `${d} L410 310 L-10 310 Z`;
}

function Tree({ x, y, s, leaf, trunk }: { x: number; y: number; s: number; leaf: string; trunk: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-4" y="-30" width="8" height="32" rx="3" fill={trunk} />
      <circle cx="0" cy="-48" r="22" fill={leaf} />
      <circle cx="-14" cy="-38" r="15" fill={leaf} />
      <circle cx="14" cy="-38" r="15" fill={leaf} />
      <circle cx="-6" cy="-54" r="9" fill="#fff" opacity=".1" />
    </g>
  );
}

function House({ x, y, s, night }: { x: number; y: number; s: number; night: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-26" y="-34" width="52" height="34" rx="3" fill="#F2DFC0" />
      <path d="M-32 -32 L0 -60 L32 -32 Z" fill="#C2587A" />
      <rect x="-6" y="-20" width="12" height="20" rx="6" fill="#8A5530" />
      <rect x="10" y="-28" width="11" height="11" rx="2" fill={night ? '#FFE9A8' : '#BFE0F0'} />
      <rect x="-21" y="-28" width="11" height="11" rx="2" fill={night ? '#FFE9A8' : '#BFE0F0'} />
      <rect x="14" y="-58" width="7" height="14" fill="#A8433F" />
    </g>
  );
}

export interface ArtProps {
  /** Any string or number; the same seed always draws the same picture. */
  seed: string | number;
  scene?: string | null;
  hero: Hero;
  companion?: Animal | null;
  /** 0 at the start of the story, 1 at the end. Sets the light. */
  progress?: number;
  cover?: boolean;
  alt?: string;
  className?: string;
}

export function Art({ seed, scene, hero, companion = null, progress = 0.5, cover = false, alt, className }: ArtProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const s = typeof seed === 'number' ? seed : hashString(seed);
  const r = rng(s);
  const text = (scene ?? '').toLowerCase();
  const water = /pool|swim|splash|water|lake|sea|river|boat|wave|puddle|paddl/.test(text);
  const trees = /tree|forest|wood|garden|park|leaf|leaves|picnic/.test(text);
  const house = /house|home|door|window|room|kitchen|school|class|playground|concert|stage/.test(text);
  const lantern = /lantern|glow|firefl|candle|lamp/.test(text);
  const pal = pickPalette(progress, s, cover);
  const night = pal === NIGHT || pal === DUSK;

  const farPath = hill(r, 172, 20);
  const midPath = hill(r, 204, 16);
  const nearPath = hill(r, 242, 9);
  const moonX = s % 2 ? 308 : 92;
  const moonY = 54 + (s % 4) * 6;
  const heroX = cover ? 176 : 118 + Math.round(r() * 34);
  const heroS = cover ? 1.38 : 1.02;
  const ground = cover ? 262 : 250;
  const friendX = cover ? 286 : heroX + 96;

  const stars = Array.from({ length: pal.stars ? 22 : 0 }, () => ({ x: r() * 400, y: r() * 120, r: 0.8 + r() * 1.6, o: 0.5 + r() * 0.5 }));
  const flowers = Array.from({ length: 10 }, () => ({ x: 10 + r() * 380, y: 262 + r() * 34, r: 2 + r() * 2.4, c: ['#F4A261', '#F8E8B8', '#E58AA8', '#FFFFFF'][Math.floor(r() * 4)] }));
  const clouds = Array.from({ length: 3 }, () => ({ x: 30 + r() * 340, y: 40 + r() * 60, w: 30 + r() * 26 }));
  const treeSpots = [
    { x: 36 + r() * 18, y: 214, s: 0.8 + r() * 0.3 },
    { x: 340 + r() * 30, y: 218, s: 0.75 + r() * 0.3 },
  ];
  const leaf = pal === NIGHT ? '#2C4E6B' : pal === DUSK ? '#4C7A8A' : '#5E9A6C';

  return (
    <svg className={className} viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" role="img" aria-label={alt ?? scene ?? 'A soft picture-book scene'}>
      <defs>
        <linearGradient id={`sky${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={pal.sky[0]} />
          <stop offset=".55" stopColor={pal.sky[1]} />
          <stop offset="1" stopColor={pal.sky[2]} />
        </linearGradient>
        <radialGradient id={`glow${uid}`}>
          <stop offset="0" stopColor={pal.glow} stopOpacity=".95" />
          <stop offset="1" stopColor={pal.glow} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`lamp${uid}`}>
          <stop offset="0" stopColor="#FFE9A8" stopOpacity=".95" />
          <stop offset="1" stopColor="#FFE9A8" stopOpacity="0" />
        </radialGradient>
        <filter id={`paint${uid}`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency=".02" numOctaves="2" seed={(s % 50) + 1} result="t" />
          <feDisplacementMap in="SourceGraphic" in2="t" scale="3.5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id={`grain${uid}`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="4" />
          <feColorMatrix type="matrix" values="0 0 0 0 .14  0 0 0 0 .1  0 0 0 0 .22  1.1 0 0 0 -.42" />
        </filter>
      </defs>

      <g filter={`url(#paint${uid})`}>
        <rect x="-10" y="-10" width="420" height="320" fill={`url(#sky${uid})`} />
        <circle cx={moonX} cy={moonY} r={cover ? 74 : 58} fill={`url(#glow${uid})`} />
        {pal.celestial === 'moon' ? (
          <g>
            <circle cx={moonX} cy={moonY} r={cover ? 26 : 21} fill="#F8E8B8" />
            <circle cx={moonX - 7} cy={moonY - 4} r="4" fill="#E6D39A" opacity=".7" />
            <circle cx={moonX + 8} cy={moonY + 7} r="3" fill="#E6D39A" opacity=".7" />
          </g>
        ) : (
          <circle cx={moonX} cy={moonY} r={cover ? 26 : 21} fill="#FFF1C2" />
        )}
        {stars.map((st, i) => (
          <circle key={i} cx={st.x} cy={st.y} r={st.r} fill="#FFF6DA" opacity={st.o} />
        ))}
        {clouds.map((c, i) => (
          <g key={i} opacity={pal === NIGHT ? 0.18 : 0.5} fill="#FFF8EA">
            <ellipse cx={c.x} cy={c.y} rx={c.w} ry={c.w * 0.3} />
            <ellipse cx={c.x + c.w * 0.4} cy={c.y - c.w * 0.14} rx={c.w * 0.5} ry={c.w * 0.26} />
          </g>
        ))}
        <path d={farPath} fill={pal.far} />
        {house && <House x={300 + r() * 40} y={188} s={0.9} night={night} />}
        <path d={midPath} fill={pal.mid} />
        {(trees || !house) && treeSpots.map((t, i) => <Tree key={i} x={t.x} y={t.y} s={t.s} leaf={leaf} trunk={pal === NIGHT ? '#3A2F55' : '#7A5538'} />)}
        <path d={nearPath} fill={pal.near} />
        {water && (
          <g>
            <ellipse cx="312" cy="268" rx="92" ry="24" fill="#6FB0D3" />
            <ellipse cx="312" cy="268" rx="92" ry="24" fill="none" stroke="#fff" strokeWidth="2" opacity=".35" />
            <path d="M262 266 q8 -6 16 0 t16 0 M312 276 q8 -6 16 0 t16 0 M286 258 q6 -4 12 0 t12 0" stroke="#EAF6FB" strokeWidth="2.4" fill="none" strokeLinecap="round" opacity=".85" />
          </g>
        )}
        {flowers.map((f, i) => (
          <circle key={i} cx={f.x} cy={f.y} r={f.r} fill={f.c} opacity=".9" />
        ))}
        {companion && <Creature kind={companion} x={friendX} y={ground + 4} s={cover ? 1.0 : 0.78} flip />}
        {hero.mode === 'animal' ? <Creature kind={hero.animal} x={heroX} y={ground} s={heroS} pyjamas /> : <Child hero={hero} x={heroX} y={ground} s={heroS} />}
        {lantern && (
          <g>
            <circle cx={heroX + 36 * heroS} cy={ground - 46 * heroS} r="30" fill={`url(#lamp${uid})`} />
            <rect x={heroX + 31 * heroS} y={ground - 54 * heroS} width="10" height="13" rx="3" fill="#FFD76A" stroke={INK} strokeWidth="1.5" />
          </g>
        )}
      </g>
      <rect width="400" height="300" filter={`url(#grain${uid})`} opacity=".5" style={{ mixBlendMode: 'multiply' }} />
    </svg>
  );
}
