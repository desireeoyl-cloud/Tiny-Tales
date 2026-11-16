import { LIMITS, StorySchema, type Brief, type Story } from './schema';

export const wordCount = (s: string): number => s.trim().split(/\s+/).filter(Boolean).length;

export const sentences = (s: string): string[] =>
  s
    .split(/(?<=[.!?])\s+/)
    .map((x) => x.trim())
    .filter(Boolean);

const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Pull the first JSON object out of a model reply, tolerating code fences and stray text. */
export function extractJson(text: string): unknown {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) throw new Error('no JSON object found in the reply');
  return JSON.parse(text.slice(start, end + 1));
}

export interface Validation {
  ok: boolean;
  story: Story | null;
  issues: string[];
}

/**
 * Checks a story against the PRD's story-format rules. The issues are written so they can be
 * fed straight back to the model for the one automatic repair attempt.
 */
export function validateStory(raw: unknown, brief?: Brief): Validation {
  const parsed = StorySchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      story: null,
      issues: parsed.error.issues.map((i) => `${i.path.join('.') || 'root'}: ${i.message}`),
    };
  }
  const story = parsed.data;
  const issues: string[] = [];

  if (story.safety.tier === 'red') {
    if (story.pages.length > 0) issues.push('for tier red, pages must be an empty array');
    if (story.cover_scene !== null) issues.push('for tier red, cover_scene must be null');
    if (story.ending_line !== null) issues.push('for tier red, ending_line must be null');
    return { ok: issues.length === 0, story, issues };
  }

  const titleWords = wordCount(story.title);
  if (titleWords === 0) issues.push('title is empty');
  if (titleWords > LIMITS.titleWordsMax) issues.push(`title has ${titleWords} words; the maximum is ${LIMITS.titleWordsMax}`);

  const pageCount = story.pages.length;
  if (pageCount < LIMITS.pagesMin || pageCount > LIMITS.pagesMax) {
    issues.push(`story has ${pageCount} pages; it must have ${LIMITS.pagesMin} to ${LIMITS.pagesMax}`);
  }

  story.pages.forEach((p, i) => {
    if (p.n !== i + 1) issues.push(`page numbers must run 1, 2, 3 in order; page ${i + 1} has n=${p.n}`);
    const words = wordCount(p.text);
    const count = sentences(p.text).length;
    if (words > LIMITS.pageWordsMax) issues.push(`page ${i + 1} has ${words} words; the maximum is ${LIMITS.pageWordsMax}`);
    if (count < LIMITS.pageSentencesMin || count > LIMITS.pageSentencesMax) {
      issues.push(`page ${i + 1} has ${count} sentences; each page needs ${LIMITS.pageSentencesMin} to ${LIMITS.pageSentencesMax}`);
    }
  });

  if (!story.ending_line || wordCount(story.ending_line) === 0) {
    issues.push('ending_line is required');
  } else if (wordCount(story.ending_line) > LIMITS.endingWordsMax) {
    issues.push(`ending_line has ${wordCount(story.ending_line)} words; the maximum is ${LIMITS.endingWordsMax}`);
  }

  if (story.talk_about.length !== LIMITS.talkAbout) {
    issues.push(`talk_about must have exactly ${LIMITS.talkAbout} questions`);
  }

  const scenes = story.pages.filter((p) => p.scene).length;
  if (scenes > LIMITS.imageScenesMax) {
    issues.push(`${scenes} pages have a scene; at most ${LIMITS.imageScenesMax} may (the cover is separate)`);
  }
  if (!story.cover_scene) issues.push('cover_scene is required');

  // The child's name must never reach an image prompt, so it must not appear in any scene.
  if (brief) {
    const nameRe = new RegExp(`\\b${escapeRegExp(brief.name)}\\b`, 'i');
    const sceneTexts = [story.cover_scene ?? '', ...story.pages.map((p) => p.scene ?? '')];
    if (sceneTexts.some((s) => nameRe.test(s))) {
      issues.push(`scene descriptions must not contain the hero's name ("${brief.name}"); say "the child" or "the hero"`);
    }
  }

  return { ok: issues.length === 0, story, issues };
}
