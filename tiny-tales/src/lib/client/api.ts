import type { AdjustId } from '../adjust';
import type { Brief, Story } from '../schema';
import type { ApiResult } from './types';

async function post(url: string, body: unknown, signal?: AbortSignal): Promise<ApiResult> {
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal });
    const data = await res.json().catch(() => null);
    if (data?.status === 'ok') return { kind: 'ok', story: data.story, demo: !!data.demo, ms: data.ms ?? 0, attempts: data.attempts ?? 1 };
    if (data?.status === 'declined') return { kind: 'declined', message: String(data.message ?? '') };
    return { kind: 'error', code: data?.code ?? 'generation_failed' };
  } catch (e) {
    if ((e as Error).name === 'AbortError') return { kind: 'error', code: 'aborted' };
    return { kind: 'error', code: 'network' };
  }
}

export const createStory = (brief: Brief, signal?: AbortSignal) => post('/api/story', { brief }, signal);
export const adjustStory = (brief: Brief, story: Story, adjustment: AdjustId, signal?: AbortSignal) => post('/api/adjust', { brief, story, adjustment }, signal);

export async function fetchStatus(): Promise<{ demo: boolean; paused: boolean }> {
  try {
    const res = await fetch('/api/status', { cache: 'no-store' });
    return await res.json();
  } catch {
    return { demo: false, paused: false };
  }
}
