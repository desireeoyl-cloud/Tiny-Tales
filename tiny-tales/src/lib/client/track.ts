import type { EventName } from '../server/events';
import { sessionId } from './storage';

/** Fire and forget. Never throws, never blocks the interface, never sends story or brief text. */
export function track(name: EventName, props: Record<string, string | number | boolean> = {}): void {
  try {
    const body = JSON.stringify({ name, session: sessionId(), props });
    if (navigator.sendBeacon && navigator.sendBeacon('/api/event', new Blob([body], { type: 'application/json' }))) return;
    void fetch('/api/event', { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true }).catch(() => {});
  } catch {
    /* analytics must never break the app */
  }
}
