import { appendFile } from 'node:fs/promises';

/** Event names the app may record. Anything else is rejected. No brief or story text is ever recorded. */
export const EVENT_NAMES = [
  'app_opened',
  'brief_started',
  'brief_submitted',
  'story_generated',
  'generation_failed',
  'edit_used',
  'adjustment_used',
  'regenerate_used',
  'undo_used',
  'story_approved',
  'reader_opened',
  'story_completed',
  'parent_gate_used',
  'talk_prompts_viewed',
  'feedback_submitted',
  'moderation_blocked',
  'tier_declined',
  'cap_reached',
  'added_details_shown',
  'image_failed',
  'story_saved',
] as const;

export type EventName = (typeof EVENT_NAMES)[number];

export interface AppEvent {
  name: EventName;
  /** Anonymous id, generated in the browser. Not linked to any person. */
  session: string;
  at: string;
  props: Record<string, string | number | boolean>;
}

const KEY = 'tt:events';

/** Keep only small primitive values so an event can never carry a story or a brief by accident. */
export function cleanProps(input: unknown): AppEvent['props'] {
  const out: AppEvent['props'] = {};
  if (!input || typeof input !== 'object') return out;
  let n = 0;
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (n >= 12 || !/^[a-z_]{1,32}$/.test(k)) continue;
    if (typeof v === 'number' && Number.isFinite(v)) out[k] = v;
    else if (typeof v === 'boolean') out[k] = v;
    else if (typeof v === 'string') out[k] = v.slice(0, k === 'answer' ? 300 : 60);
    else continue;
    n++;
  }
  return out;
}

async function upstash(command: (string | number)[]): Promise<unknown> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const res = await fetch(url, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(command),
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`event store ${res.status}`);
  return ((await res.json()) as { result: unknown }).result;
}

/**
 * Every event goes to the server log. When a persistent store is configured it is also saved there:
 * Upstash Redis (UPSTASH_REDIS_REST_URL and _TOKEN) or a local file (TT_EVENTS_FILE).
 * Vercel's free plan keeps server logs for only about an hour, so use the store for the real test.
 */
export async function recordEvent(event: AppEvent): Promise<void> {
  const line = JSON.stringify(event);
  console.log(`[tt-event] ${line}`);
  const jobs: Promise<unknown>[] = [];
  if (process.env.TT_EVENTS_FILE) jobs.push(appendFile(process.env.TT_EVENTS_FILE, line + '\n'));
  if (process.env.UPSTASH_REDIS_REST_URL) jobs.push(upstash(['LPUSH', KEY, line]));
  await Promise.allSettled(jobs);
}

export async function readEvents(limit = 1000): Promise<AppEvent[] | null> {
  if (!process.env.UPSTASH_REDIS_REST_URL) return null;
  const rows = (await upstash(['LRANGE', KEY, 0, limit - 1])) as string[] | null;
  return (rows ?? []).map((r) => JSON.parse(r) as AppEvent);
}
