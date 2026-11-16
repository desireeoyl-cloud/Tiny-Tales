import { createMockLLM } from './mock';

export interface LLMRequest {
  system: string;
  user: string;
}

export interface LLMResponse {
  text: string;
  inputTokens?: number;
  outputTokens?: number;
}

export interface LLM {
  provider: string;
  model: string;
  complete(req: LLMRequest): Promise<LLMResponse>;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Retry rate limits and server errors a few times with a growing pause. */
async function postJson(url: string, headers: Record<string, string>, body: unknown): Promise<unknown> {
  let lastError = '';
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(90_000),
    });
    if (res.ok) return res.json();
    lastError = `${res.status}: ${(await res.text()).slice(0, 300)}`;
    if (res.status !== 429 && res.status < 500) break;
    await sleep(1500 * 2 ** attempt);
  }
  throw new Error(`Model request failed (${lastError})`);
}

function createAnthropic(model: string): LLM {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY is not set');
  return {
    provider: 'anthropic',
    model,
    async complete({ system, user }) {
      const data = (await postJson(
        'https://api.anthropic.com/v1/messages',
        { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
        { model, max_tokens: 2500, system, messages: [{ role: 'user', content: user }] },
      )) as { content: { type: string; text?: string }[]; usage?: { input_tokens: number; output_tokens: number } };
      return {
        text: data.content.filter((c) => c.type === 'text').map((c) => c.text ?? '').join(''),
        inputTokens: data.usage?.input_tokens,
        outputTokens: data.usage?.output_tokens,
      };
    },
  };
}

function createOpenAI(model: string): LLM {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY is not set');
  return {
    provider: 'openai',
    model,
    async complete({ system, user }) {
      const data = (await postJson(
        'https://api.openai.com/v1/chat/completions',
        { authorization: `Bearer ${key}` },
        {
          model,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        },
      )) as { choices: { message: { content: string | null } }[]; usage?: { prompt_tokens: number; completion_tokens: number } };
      return {
        text: data.choices[0]?.message.content ?? '',
        inputTokens: data.usage?.prompt_tokens,
        outputTokens: data.usage?.completion_tokens,
      };
    },
  };
}

export function createLLM(provider: string, model?: string): LLM {
  switch (provider) {
    case 'mock':
      return createMockLLM();
    case 'anthropic':
      return createAnthropic(model ?? process.env.TT_MODEL ?? 'claude-haiku-5-5');
    case 'openai': {
      const m = model ?? process.env.TT_MODEL;
      if (!m) throw new Error('Set TT_MODEL (or pass --model) for the openai provider');
      return createOpenAI(m);
    }
    default:
      throw new Error(`Unknown provider "${provider}". Use anthropic, openai or mock.`);
  }
}
