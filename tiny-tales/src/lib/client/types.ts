import type { Hero } from '../hero';
import type { Brief, Story } from '../schema';

export interface SavedStory {
  id: string;
  createdAt: string;
  brief: Brief;
  hero: Hero;
  story: Story;
  rating?: number;
}

export type ApiResult =
  | { kind: 'ok'; story: Story; demo: boolean; ms: number; attempts: number }
  | { kind: 'declined'; message: string }
  | { kind: 'error'; code: 'paused' | 'cap_reached' | 'generation_failed' | 'invalid_story' | 'draft_blocked' | 'bad_request' | 'network' | 'aborted' };
