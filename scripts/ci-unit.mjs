#!/usr/bin/env node
// Consumer policy: package-level selection is an optimization, never permission
// to accept an empty test lane. The central workflow owns JUnit verification.
import { execFileSync, spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export function hasTestTasks(plan) {
  if (!plan || !Array.isArray(plan.tasks)) throw new Error('Invalid turbo dry-run task inventory');
  return plan.tasks.some(({ task, command }) => task === 'test' &&
    typeof command === 'string' && command.trim() && command !== '<NONEXISTENT>');
}

export function selectTestScope({ affected, readPlan, warn = console.warn }) {
  if (!affected) return [];
  try {
    if (hasTestTasks(readPlan())) return ['--affected'];
    warn('[ci-unit] No executable affected test tasks; running the full unit suite');
  } catch (error) {
    warn(`[ci-unit] Selection unavailable (${error.message}); running the full unit suite`);
  }
  return [];
}

export function main(args = process.argv.slice(2)) {
  if (args.some((arg) => arg !== '--affected')) throw new Error(`Unsupported argument: ${args.join(' ')}`);
  const scope = selectTestScope({
    affected: args.includes('--affected'),
    readPlan: () => JSON.parse(execFileSync('pnpm', ['turbo', 'run', 'test', '--affected', '--dry=json'], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], maxBuffer: 16 * 1024 * 1024,
    })),
  });
  // A broken/empty workspace graph is a failure, including on the push safety net.
  const plan = JSON.parse(execFileSync('pnpm', ['turbo', 'run', 'test', ...scope, '--dry=json'], {
    encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], maxBuffer: 16 * 1024 * 1024,
  }));
  if (!hasTestTasks(plan)) throw new Error('No executable unit test tasks; refusing a zero-task green');
  const flags = ['--reporter=default', '--reporter=junit', '--outputFile.junit=reports/junit.xml'];
  if (scope.length) flags.push('--bail=1');
  const result = spawnSync('pnpm', ['turbo', 'run', 'test', ...scope, '--', ...flags], { stdio: 'inherit' });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { process.exitCode = main(); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
