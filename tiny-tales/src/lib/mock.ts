import type { LLM } from './llm';
import type { Story } from './schema';

/**
 * An offline stand-in for a real model. It exists ONLY to test the harness (validation, repair,
 * checks, report). It says nothing about story quality: real runs need a real provider.
 * Set TT_MOCK_FLAKY=1 to make the first reply for every brief malformed, which exercises the repair path.
 */
export function createMockLLM(): LLM {
  return {
    provider: 'mock',
    model: 'mock-1',
    async complete({ user }) {
      const isRepair = user.includes('Your previous reply had these problems');
      if (process.env.TT_MOCK_FLAKY === '1' && !isRepair) return { text: '{"title": "Oops', inputTokens: 0, outputTokens: 0 };

      const name = /Hero name: (.+)/.exec(user)?.[1]?.trim() ?? 'Sam';
      const moment = /What is happening: (.+)/.exec(user)?.[1] ?? '';

      const red = /(died|death|passed away|ignore your rules|violent)/i.test(moment);
      const amber = /(afraid|dark|moving|vaccin|separat|cries|leaves)/i.test(moment);

      const story: Story = red
        ? {
            title: '',
            safety: { tier: 'red', notes: 'This moment deserves more care than a generated story.' },
            cover_scene: null,
            pages: [],
            ending_line: null,
            talk_about: [],
            facts_used: [],
            facts_added: [],
          }
        : {
            title: `${name} and the Little Lantern`,
            safety: { tier: amber ? 'amber' : 'green', notes: 'mock classification' },
            cover_scene: 'A small child holding a glowing lantern beside a friendly green dinosaur.',
            pages: Array.from({ length: 6 }, (_, i) => ({
              n: i + 1,
              text: `${name} took a small step. A kind friend walked close by. Everything felt a little easier.`,
              scene: i === 1 || i === 3 ? 'The child and the dinosaur walk through soft evening light.' : null,
            })),
            ending_line: `Goodnight, ${name}. The stars are watching.`,
            talk_about: [`What made ${name} brave?`, 'What felt tricky?'],
            facts_used: [moment.slice(0, 80)],
            facts_added: [],
          };

      const text = JSON.stringify(story);
      return { text, inputTokens: 0, outputTokens: 0 };
    },
  };
}
