import { NextResponse } from 'next/server';
import { generateStory, type GenerateResult } from '../generate';
import type { LLM } from '../llm';
import type { Brief, Story } from '../schema';
import { checkOutput, DECLINE_MESSAGE } from './safety';

export const json = (body: unknown, status = 200): NextResponse => NextResponse.json(body, { status });

export type ApiError = { status: 'error'; code: 'paused' | 'cap_reached' | 'generation_failed' | 'invalid_story' | 'draft_blocked' | 'bad_request' };

export const apiError = (code: ApiError['code'], status: number): NextResponse => json({ status: 'error', code } satisfies ApiError, status);

/**
 * Turns a model result into the API response. A red-tier moment is declined and nothing is returned or kept.
 * A draft that fails the output check is discarded and made once more before the parent sees an error
 * (PRD: system states, "draft blocked").
 */
export async function respond(run: () => Promise<GenerateResult>, retryAgain: () => Promise<GenerateResult>, demo: boolean): Promise<NextResponse> {
  let result = await run();
  if (result.error) return apiError('generation_failed', 502);
  if (!result.ok || !result.story) return apiError('invalid_story', 502);

  if (result.story.safety.tier === 'red') return json({ status: 'declined', message: DECLINE_MESSAGE });

  if (!checkOutput(result.story).ok) {
    result = await retryAgain();
    if (result.error) return apiError('generation_failed', 502);
    if (!result.ok || !result.story) return apiError('invalid_story', 502);
    if (result.story.safety.tier === 'red') return json({ status: 'declined', message: DECLINE_MESSAGE });
    if (!checkOutput(result.story).ok) return apiError('draft_blocked', 422);
  }

  return json({ status: 'ok', story: result.story as Story, demo, attempts: result.attempts, ms: result.ms });
}

export const createStory = (brief: Brief, llm: LLM) => generateStory(brief, llm);
