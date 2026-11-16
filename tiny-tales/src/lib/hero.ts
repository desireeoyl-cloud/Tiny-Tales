/**
 * The hero is never a photo or a likeness (PRD: hero decision). The parent picks a skin tone, hair and hair
 * style, or a small animal stand-in. The same choice drives the on-screen picture and, later, the character
 * card repeated word for word in every image prompt.
 */
export type HeroMode = 'child' | 'animal';
export type HairStyle = 'short' | 'curly' | 'long';
export type Animal = 'bear' | 'bunny' | 'fox' | 'dino';

export interface Hero {
  mode: HeroMode;
  skin: string;
  hairColor: string;
  hairStyle: HairStyle;
  animal: Animal;
}

export const SKIN_TONES = [
  { value: '#F7D9BF', label: 'Light' },
  { value: '#EBBE93', label: 'Light olive' },
  { value: '#CE9462', label: 'Tan' },
  { value: '#A66B3F', label: 'Brown' },
  { value: '#6E4529', label: 'Deep brown' },
];

export const HAIR_COLORS = [
  { value: '#231A14', label: 'Black' },
  { value: '#4A2F1E', label: 'Dark brown' },
  { value: '#8A5530', label: 'Chestnut' },
  { value: '#B9532B', label: 'Ginger' },
  { value: '#D9B26A', label: 'Blonde' },
];

export const HAIR_STYLES: { value: HairStyle; label: string }[] = [
  { value: 'short', label: 'Short' },
  { value: 'curly', label: 'Curly' },
  { value: 'long', label: 'Long' },
];

export const ANIMALS: { value: Animal; label: string }[] = [
  { value: 'bear', label: 'Bear' },
  { value: 'bunny', label: 'Bunny' },
  { value: 'fox', label: 'Fox' },
  { value: 'dino', label: 'Dino' },
];

export const DEFAULT_HERO: Hero = {
  mode: 'child',
  skin: SKIN_TONES[1].value,
  hairColor: HAIR_COLORS[1].value,
  hairStyle: 'short',
  animal: 'bear',
};

const labelOf = (list: { value: string; label: string }[], value: string): string =>
  (list.find((x) => x.value === value)?.label ?? '').toLowerCase();

/** The character card: plain words, no name, no likeness. Used for the image prompt later. */
export function heroCard(h: Hero): string {
  if (h.mode === 'animal') return `A small friendly ${h.animal} in yellow pyjamas`;
  return `A small child with ${labelOf(HAIR_COLORS, h.hairColor)} ${h.hairStyle} hair and ${labelOf(SKIN_TONES, h.skin)} skin in yellow pyjamas`;
}
