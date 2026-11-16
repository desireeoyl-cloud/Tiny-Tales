import type { LLM } from './llm';
import { buildAdjustMessage, buildRepairMessage, buildSystemPrompt, buildUserMessage } from './prompts';
import type { Brief, Story } from './schema';
import { extractJson, validateStory } from './validate';

export interface GenerateResult {
  ok: boolean;
  story: Story | null;
  /** Problems left after the last attempt (empty when ok). */
  issues: string[];
  /** 1 normally; 2 when the repair attempt was needed. */
  attempts: number;
  ms: number;
  inputTokens: number;
  outputTokens: number;
  /** The first raw reply, kept so prompt problems can be debugged. */
  firstReply: string;
  error?: string;
}

/** Call the model, validate, and make one automatic repair attempt (PRD: story format). */
async function runWithRepair(llm: LLM, system: string, user: string, brief: Brief): Promise<GenerateResult> {
  const started = Date.now();
  let inputTokens = 0;
  let outputTokens = 0;
  let firstReply = '';
  let issues: string[] = [];
  let story: Story | null = null;
  let lastReply = '';

  for (let attempt = 1; attempt <= 2; attempt++) {
    const message = attempt === 1 ? user : buildRepairMessage(user, lastReply, issues);
    let text: string;
    try {
      const res = await llm.complete({ system, user: message });
      text = res.text;
      inputTokens += res.inputTokens ?? 0;
      outputTokens += res.outputTokens ?? 0;
    } catch (e) {
      return { ok: false, story: null, issues: [], attempts: attempt, ms: Date.now() - started, inputTokens, outputTokens, firstReply, error: (e as Error).message };
    }
    if (attempt === 1) firstReply = text;
    lastReply = text;

    try {
      const v = validateStory(extractJson(text), brief);
      issues = v.issues;
      story = v.story;
      if (v.ok) return { ok: true, story, issues: [], attempts: attempt, ms: Date.now() - started, inputTokens, outputTokens, firstReply };
    } catch (e) {
      issues = [`reply was not valid JSON: ${(e as Error).message}`];
      story = null;
    }
  }
  return { ok: false, story, issues, attempts: 2, ms: Date.now() - started, inputTokens, outputTokens, firstReply };
}

export function generateStory(brief: Brief, llm: LLM): Promise<GenerateResult> {
  return runWithRepair(llm, buildSystemPrompt(brief), buildUserMessage(brief), brief);
}

export function adjustStory(brief: Brief, current: Story, instruction: string, llm: LLM): Promise<GenerateResult> {
  return runWithRepair(llm, buildSystemPrompt(brief), buildAdjustMessage(brief, current, instruction), brief);
}
