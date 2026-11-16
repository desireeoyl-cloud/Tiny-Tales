/**
 * The quick changes a parent can ask for. The server maps each id to its instruction, so the parent's
 * button choice can never smuggle free text into the model's instructions.
 */
export const ADJUSTMENTS = {
  shorter: { label: 'Shorter', instruction: 'Make the story shorter, with fewer pages but never fewer than 5, keeping the same moment and ending feeling' },
  simpler: { label: 'Simpler', instruction: 'Use simpler words and shorter sentences throughout' },
  funnier: { label: 'Funnier', instruction: 'Make the story a little funnier with gentle, silly humour, while keeping the calm ending' },
  gentler: { label: 'Gentler', instruction: 'Make the tone gentler and calmer, with softer feelings and more reassurance' },
  ending: { label: 'New ending', instruction: 'Change only the final page and the ending line to a different calm, sleepy ending' },
} as const;

export type AdjustId = keyof typeof ADJUSTMENTS;
export const ADJUST_IDS = Object.keys(ADJUSTMENTS) as AdjustId[];
