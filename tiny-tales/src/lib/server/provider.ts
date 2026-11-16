import { createLLM, type LLM } from '../llm';

export interface ProviderChoice {
  llm: LLM;
  /** True when no real model is configured: the app serves sample stories and says so. */
  demo: boolean;
}

/**
 * Chooses the model for the app. TT_PROVIDER wins; otherwise a key in the environment picks the
 * provider; otherwise the app runs in demo mode with the mock model so it can be tried before a key exists.
 */
export function getProvider(): ProviderChoice {
  const explicit = process.env.TT_PROVIDER;
  const provider = explicit || (process.env.ANTHROPIC_API_KEY ? 'anthropic' : process.env.OPENAI_API_KEY && process.env.TT_MODEL ? 'openai' : 'mock');
  return { llm: createLLM(provider), demo: provider === 'mock' };
}
