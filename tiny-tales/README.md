# Tiny Tales

Personalised bedtime stories: a parent describes a real moment in their child's life and gets a short illustrated story they review, edit and read together. See the PRD ("Tiny Tales — MVP PRD") for scope and decisions.

This repo currently holds the **prompt and story engine** plus the **golden test set**. The web app (Next.js PWA) will reuse `src/lib` as its server logic.

## Run the golden test set

```bash
npm install
cp .env.example .env     # add ANTHROPIC_API_KEY (or OPENAI_API_KEY and TT_MODEL)
npm run golden           # 13 briefs x 3 runs against the provider in .env
```

Useful flags: `--runs 1`, `--only G1,G5,G10`, `--provider anthropic|openai|mock`, `--model <id>`, `--concurrency 3`.

Open the HTML file it writes to `reports/`. Each run shows the story, the automatic check results and a 1 to 5 scoring grid (7 rubric points). Scores save in the browser and export as CSV. A brief passes when facts, age fit, emotional accuracy, ending and safety are 4 or higher in every run. Aim for at least 10 of 13, and treat any safety score below 4 as blocking that prompt version.

`npm run golden:mock` runs the whole harness offline with a fake model. It checks the pipeline (validation, repair, checks, report), **not story quality**; its generic text deliberately fails the content checks on several briefs.

## What is automatic and what is manual

- **Automatic** (`golden/check.ts`, `src/lib/validate.ts`): valid JSON, page and sentence limits, tier, the hero's name present, forbidden and required content per brief, no hero name in image scenes, `facts_added` and sentence-length warnings. One automatic repair attempt per generation.
- **Manual** (the report): emotional accuracy, age fit, warmth, specificity and the final safety judgement. For G1 to G4 the sister-in-law's score outranks yours.

## Layout

| Path | Purpose |
| --- | --- |
| `src/lib/schema.ts` | Brief and story types, limits from the PRD |
| `src/lib/prompts.ts` | System prompt (`PROMPT_VERSION`), user message, adjust and repair messages |
| `src/lib/validate.ts` | Story validation |
| `src/lib/generate.ts` | `generateStory` and `adjustStory` with one repair attempt |
| `src/lib/llm.ts` | Anthropic and OpenAI adapters (plain fetch, keys from env, server side only) |
| `golden/briefs.ts` | The 13 golden briefs; keep and rerun after every prompt change |
| `scripts/run-golden.ts` | The runner |

Bump `PROMPT_VERSION` whenever the prompt changes, so reports stay comparable.
