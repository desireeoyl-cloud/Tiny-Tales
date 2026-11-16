import { timingSafeEqual } from 'node:crypto';
import { readEvents } from '../../../../lib/server/events';
import { json } from '../../../../lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function authorised(req: Request): boolean {
  const expected = process.env.TT_ADMIN_KEY;
  if (!expected) return false;
  const given = new URL(req.url).searchParams.get('key') ?? req.headers.get('x-admin-key') ?? '';
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Lists recorded events and feedback for the test. Needs TT_ADMIN_KEY and a persistent event store. */
export async function GET(req: Request) {
  if (!authorised(req)) return json({ error: 'not found' }, 404);
  const events = await readEvents();
  if (!events) return json({ error: 'No event store configured. Set the Upstash variables.' }, 501);
  return json({ count: events.length, events });
}
