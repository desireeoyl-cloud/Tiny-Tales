import { json } from '../../../lib/server/http';
import { isPaused } from '../../../lib/server/limits';
import { getProvider } from '../../../lib/server/provider';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET() {
  return json({ demo: getProvider().demo, paused: isPaused() });
}
