/**
 * Best-effort usage caps. State lives in this server instance's memory, so on serverless hosting it
 * resets when an instance restarts and is not shared between instances. That is acceptable for a small
 * invite-only beta, but the real protection against runaway cost is the hard monthly spending limit set at
 * the model provider. Clearing browser storage does not bypass these: they are keyed on the network address.
 */

type Scope = 'story' | 'adjust' | 'global';

const counts = new Map<string, number>();

const today = (): string => new Date().toISOString().slice(0, 10);

const envNumber = (name: string, fallback: number): number => {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export const caps = (): Record<Scope, number> => ({
  story: envNumber('TT_STORY_DAILY_CAP', 10),
  adjust: envNumber('TT_ADJUST_DAILY_CAP', 40),
  global: envNumber('TT_GLOBAL_DAILY_CAP', 300),
});

export const isPaused = (): boolean => process.env.TT_PAUSED === '1' || process.env.TT_PAUSED === 'true';

export function clientKey(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || headers.get('x-real-ip') || 'local';
}

function sweep(day: string): void {
  if (counts.size < 5000) return;
  for (const k of counts.keys()) if (!k.startsWith(day)) counts.delete(k);
}

/** Count one use. Returns which cap was hit, or null when the call is allowed. */
export function consume(scope: 'story' | 'adjust', client: string): Scope | null {
  const day = today();
  sweep(day);
  const limits = caps();
  const globalKey = `${day}:global`;
  const clientKeyFull = `${day}:${scope}:${client}`;
  if ((counts.get(globalKey) ?? 0) >= limits.global) return 'global';
  if ((counts.get(clientKeyFull) ?? 0) >= limits[scope]) return scope;
  counts.set(globalKey, (counts.get(globalKey) ?? 0) + 1);
  counts.set(clientKeyFull, (counts.get(clientKeyFull) ?? 0) + 1);
  return null;
}
