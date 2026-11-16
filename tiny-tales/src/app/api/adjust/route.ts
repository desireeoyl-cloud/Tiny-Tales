import { z } from 'zod';
import { adjustStory } from '../../../lib/generate';
import { ADJUSTMENTS, ADJUST_IDS } from '../../../lib/adjust';
import { BriefSchema, StorySchema } from '../../../lib/schema';
import { apiError, respond } from '../../../lib/server/http';
import { clientKey, consume, isPaused } from '../../../lib/server/limits';
import { getProvider } from '../../../lib/server/provider';

export const runtime = 'nodejs';
export const maxDuration = 60;

const Body = z.object({
  brief: BriefSchema,
  story: StorySchema,
  adjustment: z.enum(ADJUST_IDS as [string, ...string[]]),
});

export async function POST(req: Request) {
  if (isPaused()) return apiError('paused', 503);

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return apiError('bad_request', 400);
  }
  const parsed = Body.safeParse(raw);
  if (!parsed.success || parsed.data.story.pages.length > 8 || parsed.data.story.safety.tier === 'red') return apiError('bad_request', 400);
  const { brief, story, adjustment } = parsed.data;

  const hit = consume('adjust', clientKey(req.headers));
  if (hit) return apiError(hit === 'global' ? 'paused' : 'cap_reached', 429);

  const { llm, demo } = getProvider();
  const instruction = ADJUSTMENTS[adjustment as keyof typeof ADJUSTMENTS].instruction;
  const run = () => adjustStory(brief, story, instruction, llm);
  return respond(run, run, demo);
}
