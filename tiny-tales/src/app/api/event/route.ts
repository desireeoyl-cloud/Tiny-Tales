import { z } from 'zod';
import { cleanProps, EVENT_NAMES, recordEvent } from '../../../lib/server/events';
import { json } from '../../../lib/server/http';

export const runtime = 'nodejs';

const Body = z.object({
  name: z.enum(EVENT_NAMES),
  session: z.string().regex(/^[a-z0-9-]{8,40}$/),
  props: z.unknown().optional(),
});

export async function POST(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json({ ok: false }, 400);
  }
  const parsed = Body.safeParse(raw);
  if (!parsed.success) return json({ ok: false }, 400);
  await recordEvent({ name: parsed.data.name, session: parsed.data.session, at: new Date().toISOString(), props: cleanProps(parsed.data.props) });
  return json({ ok: true });
}
