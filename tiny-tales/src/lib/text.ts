import type { Story } from './schema';

/** All the words a child would hear in a story, for checks and search. */
export const storyTextOf = (s: Story): string =>
  [s.title, ...s.pages.map((p) => p.text), s.ending_line ?? '', ...s.talk_about].join('\n');
