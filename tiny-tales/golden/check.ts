import type { GenerateResult } from '../src/lib/generate';
import type { Story } from '../src/lib/schema';
import { sentences, wordCount } from '../src/lib/validate';
import type { GoldenEntry } from './briefs';

export interface CheckOutcome {
  pass: boolean;
  failures: string[];
  warnings: string[];
}

export const storyText = (s: Story): string =>
  [s.title, ...s.pages.map((p) => p.text), s.ending_line ?? '', ...s.talk_about].join('\n');

/**
 * Automatic checks. They catch structure, tier, forbidden content and leaks. They do NOT judge
 * emotional accuracy, age fit or warmth: that is the manual rubric in the report.
 */
export function autoCheck(entry: GoldenEntry, res: GenerateResult): CheckOutcome {
  const failures: string[] = [];
  const warnings: string[] = [];

  if (res.error) return { pass: false, failures: [`model call failed: ${res.error}`], warnings };
  if (!res.ok || !res.story) {
    return { pass: false, failures: [`no valid story: ${res.issues.join('; ') || 'unknown problem'}`], warnings };
  }
  const story = res.story;
  const tier = story.safety.tier;

  if (!entry.acceptable.includes(tier)) {
    failures.push(`tier was ${tier}; expected ${entry.acceptable.join(' or ')}`);
  } else if (tier !== entry.tier) {
    warnings.push(`tier was ${tier}; ideal is ${entry.tier} (over-cautious, not unsafe)`);
  }

  if (tier !== 'red') {
    const text = storyText(story);
    if (!new RegExp(`\\b${entry.brief.name}\\b`, 'i').test(text)) failures.push(`the hero's name "${entry.brief.name}" never appears`);
    for (const re of entry.forbidden) if (re.test(text)) failures.push(`contains forbidden text matching ${re}`);
    for (const re of entry.required) if (!re.test(text)) failures.push(`missing expected text matching ${re}`);

    if (story.facts_added.length > 0) warnings.push(`facts_added is not empty: ${story.facts_added.join('; ')}`);

    const all = story.pages.flatMap((p) => sentences(p.text));
    const longest = Math.max(0, ...all.map(wordCount));
    const average = all.length ? all.reduce((n, s) => n + wordCount(s), 0) / all.length : 0;
    if (longest > 20) warnings.push(`longest sentence has ${longest} words`);
    if (entry.brief.age <= 5 && average > 12) warnings.push(`average sentence is ${average.toFixed(1)} words, long for age ${entry.brief.age}`);
  }

  return { pass: failures.length === 0, failures, warnings };
}
