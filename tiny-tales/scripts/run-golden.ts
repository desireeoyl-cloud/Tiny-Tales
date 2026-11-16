import { mkdir, writeFile } from 'node:fs/promises';
import { GOLDEN } from '../golden/briefs';
import { autoCheck } from '../golden/check';
import { renderReport, type RunRow } from '../golden/report';
import { generateStory } from '../src/lib/generate';
import { createLLM } from '../src/lib/llm';

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) out[a.slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const provider = args.provider ?? process.env.TT_PROVIDER ?? 'mock';
  const runs = Number(args.runs ?? 3);
  const concurrency = Number(args.concurrency ?? 3);
  const only = args.only ? args.only.split(',').map((s) => s.trim().toUpperCase()) : null;
  const entries = GOLDEN.filter((e) => !only || only.includes(e.id));
  if (entries.length === 0) throw new Error(`No briefs match --only ${args.only}`);

  const llm = createLLM(provider, args.model);
  console.log(`Provider ${llm.provider} / ${llm.model}: ${entries.length} briefs x ${runs} runs`);
  if (llm.provider === 'mock') console.log('Mock mode tests the harness only; it says nothing about story quality.');

  const jobs = entries.flatMap((entry) => Array.from({ length: runs }, (_, i) => ({ entry, run: i + 1 })));
  const rows: RunRow[] = [];
  let next = 0;
  let done = 0;

  async function worker() {
    while (next < jobs.length) {
      const { entry, run } = jobs[next++];
      const result = await generateStory(entry.brief, llm);
      const check = autoCheck(entry, result);
      rows.push({ entry, run, result, check });
      done++;
      console.log(`[${done}/${jobs.length}] ${entry.id} run ${run}: ${check.pass ? 'pass' : 'FAIL'}${check.failures.length ? ' - ' + check.failures[0] : ''}`);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, worker));

  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const meta = { stamp, provider: llm.provider, model: llm.model, runs };
  await mkdir('reports', { recursive: true });
  const base = `reports/golden-${llm.provider}-${stamp}`;
  await writeFile(`${base}.html`, renderReport(meta, rows, entries));
  await writeFile(
    `${base}.json`,
    JSON.stringify(rows.map((r) => ({ id: r.entry.id, run: r.run, pass: r.check.pass, failures: r.check.failures, warnings: r.check.warnings, attempts: r.result.attempts, ms: r.result.ms, story: r.result.story, firstReply: r.result.firstReply })), null, 2),
  );

  const failed = rows.filter((r) => !r.check.pass).length;
  console.log(`\nAutomatic checks: ${rows.length - failed}/${rows.length} runs pass.`);
  console.log(`Report: ${base}.html (open it to score each run)`);
  console.log(`Data:   ${base}.json`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
