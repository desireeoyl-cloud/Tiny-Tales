import type { Brief, Story } from '../schema';
import { storyTextOf } from '../text';

/**
 * Cheap checks that run before and after the model. They exist to save cost on obvious cases and to catch
 * what a model might let through. The model still classifies every moment into green, amber or red (PRD:
 * sensitive moments); these checks only add to that, never replace it.
 */

/** Red-tier subjects and attempts to override the rules. A match skips the model entirely. */
const RED_INPUT: RegExp[] = [
  /\b(died|dies|dying|death|dead|passed away|funeral|cancer|terminal(ly)? ill|hospice)\b/i,
  /\b(abuse[ds]?|abusing|molest\w*|rape[ds]?|assault\w*|beat(s|ing)? (me|him|her|them)|hits? (me|him|her|them))\b/i,
  /\b(suicid\w*|kill(ing)? (myself|himself|herself|themselves)|self[- ]?harm|cutting (myself|herself|himself))\b/i,
  /\b(sex|sexual|naked|porn\w*)\b/i,
  /ignore (all |your |the |previous |any )*(rules|instructions)/i,
  /(reveal|show|print|repeat) (me )?(your|the) (system )?(prompt|instructions)/i,
  /\b(gore|murder\w*|massacre|torture)\b/i,
];

export function preCheckBrief(brief: Brief): 'ok' | 'red' {
  const text = [brief.moment, brief.feeling ?? '', brief.name].join(' ');
  return RED_INPUT.some((re) => re.test(text)) ? 'red' : 'ok';
}

/** Words that should never appear in a story for a young child. A match discards the draft. */
const BAD_OUTPUT: RegExp[] = [
  /\b(kill\w*|murder\w*|blood\w*|bleed\w*|gun|guns|knife|knives|stab\w*|corpse|dead|died|dies|death|suicid\w*)\b/i,
  /\b(hate|stupid|idiot|shut up)\b/i,
  /\b(sex\w*|naked|porn\w*)\b/i,
  /\b(monsters?|ghosts?|demons?|zombies?)\b/i,
];

export function checkOutput(story: Story): { ok: boolean; reason?: string } {
  const text = storyTextOf(story) + '\n' + [story.cover_scene ?? '', ...story.pages.map((p) => p.scene ?? '')].join('\n');
  const hit = BAD_OUTPUT.find((re) => re.test(text));
  return hit ? { ok: false, reason: `matched ${hit}` } : { ok: true };
}

/** The kind message shown when a moment deserves more care than a generated story (PRD: red tier). */
export const DECLINE_MESSAGE =
  'This moment deserves more care than a story we can write for you. Please talk it through with your child, or with their doctor, teacher or another trusted person who knows them.';
