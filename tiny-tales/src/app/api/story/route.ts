import { z } from 'zod';
import { BriefSchema } from '../../../lib/schema';
import { apiError, createStory, json, respond } from '../../../lib/server/http';
import { clientKey, consume, isPaused } from '../../../lib/server/limits';
import { getProvider } from '../../../lib/server/provider';
import { DECLINE_MESSAGE, preCheckBrief } from '../../../lib/server/safety';

export const runtime = 'nodejs';
export const maxDuration = 60;

const Body = z.object({ brief: BriefSchema });

export async function POST(req: Request) {
  if (isPaused()) return apiError('paused', 503);

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return apiError('bad_request', 400);
  }
  const parsed = Body.safeParse(raw);
  if (!parsed.success) return apiError('bad_request', 400);
  const { brief } = parsed.data;

  // Obvious red-tier subjects never reach the model and do not count toward the cap.
  if (preCheckBrief(brief) === 'red') return json({ status: 'declined', message: DECLINE_MESSAGE });

  const hit = consume('story', clientKey(req.headers));
  if (hit) return apiError(hit === 'global' ? 'paused' : 'cap_reached', 429);

  const { llm, demo } = getProvider();
  const run = () => createStory(brief, llm);
  return respond(run, run, demo);
}
