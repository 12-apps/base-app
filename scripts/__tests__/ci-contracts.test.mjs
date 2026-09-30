import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { assertCiSuccess } from '../ci-success.mjs';
import { hasTestTasks, selectTestScope } from '../ci-unit.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const read = (path) => readFileSync(join(root, path), 'utf8');
const json = (path) => JSON.parse(read(path));
const pin = 'be3300542208ebab5b30a75f58d018518f9d3459';
const valid = (code = 'true') => ({
  static: { result: 'success', outputs: { code } },
  contracts: { result: 'success' },
  tests: { result: code === 'true' ? 'success' : 'skipped' },
});

test('aggregate accepts complete code proof and deliberate docs-only skip', () => {
  assert.doesNotThrow(() => assertCiSuccess(valid()));
  assert.doesNotThrow(() => assertCiSuccess(valid('false')));
});
for (const lane of ['static', 'contracts', 'tests']) {
  for (const state of ['failure', 'cancelled', 'skipped', undefined]) {
    test(`aggregate rejects ${lane} ${state}`, () => {
      const needs = valid();
      needs[lane].result = state;
      assert.throws(() => assertCiSuccess(needs));
    });
  }
}
test('aggregate fails on missing selection and missing dependency', () => {
  for (const code of ['', undefined, 'unknown']) {
    const needs = valid(); needs.static.outputs.code = code;
    assert.throws(() => assertCiSuccess(needs));
  }
  for (const lane of ['static', 'contracts', 'tests']) {
    const needs = valid(); delete needs[lane];
    assert.throws(() => assertCiSuccess(needs));
  }
});
test('empty and nonexistent turbo tasks cannot count as tests', () => {
  assert.equal(hasTestTasks({ tasks: [] }), false);
  assert.equal(hasTestTasks({ tasks: [{ task: 'test', command: '<NONEXISTENT>' }] }), false);
  assert.equal(hasTestTasks({ tasks: [{ task: 'build', command: 'vite build' }] }), false);
  assert.throws(() => hasTestTasks({}));
  assert.equal(hasTestTasks({ tasks: [{ task: 'test', command: 'vitest run' }] }), true);
});
test('selector widens empty, malformed and failed plans, but preserves real work', () => {
  const warn = () => {};
  for (const readPlan of [() => ({ tasks: [] }), () => ({}), () => { throw new Error('missing base'); }]) {
    assert.deepEqual(selectTestScope({ affected: true, readPlan, warn }), []);
  }
  assert.deepEqual(selectTestScope({ affected: false, readPlan: () => { throw new Error('must not select on push'); }, warn }), []);
  assert.deepEqual(selectTestScope({ affected: true, readPlan: () => ({ tasks: [{ task: 'test', command: 'vitest run' }] }), warn }), ['--affected']);
});
test('all real suites are strict; untested shared packages do not pretend to test', () => {
  for (const app of ['api', 'events', 'client', 'admin', 'super-admin']) {
    assert.equal(json(`apps/${app}/package.json`).scripts.test, 'vitest run');
  }
  for (const pkg of ['features', 'spa-shell']) assert.equal(json(`packages/${pkg}/package.json`).scripts.test, undefined);
});
test('JUnit survives Turbo cache hits and global configuration invalidates tasks', () => {
  const turbo = json('turbo.json');
  assert.ok(turbo.tasks.test.outputs.includes('reports/junit.xml'));
  for (const path of ['tsconfig.base.json', 'scripts/**', '.github/workflows/**', '.node-version', '.npmrc', 'patches/**']) {
    assert.ok(turbo.globalDependencies.includes(path), path);
  }
  for (const app of ['client', 'admin', 'super-admin']) {
    const config = read(`apps/${app}/turbo.json`);
    assert.match(config, /"VITE_FEATURE_\*"/);
    assert.match(config, /"dist\/\*\*"/);
  }
});
test('workflow calls the validated engine, strict commands and executed-test guard', () => {
  const ci = read('.github/workflows/ci.yml');
  const calls = [...ci.matchAll(/uses: (12-apps\/ci\/[^\s]+)@([^\s]+)/g)];
  assert.equal(calls.length, 3);
  for (const [, , ref] of calls) assert.equal(ref, pin);
  assert.match(read('.github/workflows/commitlint.yml'), new RegExp(`@${pin}`));
  assert.match(ci, /unit-test-command: node scripts\/ci-unit\.mjs --affected/);
  assert.match(ci, /unit-full-command: node scripts\/ci-unit\.mjs\n/);
  assert.match(ci, /unit-junit-reports: apps\/api\/reports/);
  assert.match(ci, /needs: \[static, contracts, tests\]/);
  assert.match(ci, /if: always\(\)/);
  assert.match(ci, /run: node scripts\/ci-success\.mjs/);
  assert.match(ci, /scripts\/__tests__\/\*\.test\.mjs/);
  assert.match(ci, /reports: reports\/root.xml/);
  assert.match(ci, /push:\n    branches: \[main\]/);
  assert.equal((ci.match(/stack-aware: true/g) ?? []).length, 2);
  assert.equal((ci.match(/fingerprint-command: git rev-parse 'HEAD\^\{tree\}'/g) ?? []).length, 4);
  assert.match(ci, /apps\/\*\*/);
  assert.match(ci, /packages\/\*\*/);
});
test('complete-tree fingerprint invalidates every tracked input, rename and mode', () => {
  const dir = mkdtempSync(join(tmpdir(), 'baseapp-fingerprint-'));
  const git = (...args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const commit = () => { git('add', '-A'); git('-c', 'user.name=CI Test', '-c', 'user.email=ci@example.invalid', 'commit', '-qm', 'test'); return git('rev-parse', 'HEAD^{tree}'); };
  try {
    git('init', '-q'); writeFileSync(join(dir, 'base.txt'), 'base'); let old = commit();
    for (const path of ['README.md', 'tsconfig.base.json', 'pnpm-lock.yaml', 'apps/client/public/logo.svg', '.github/workflows/ci.yml', 'scripts/run.mjs', 'fixture with space\nand newline.txt']) {
      const target = join(dir, path); mkdirSync(join(target, '..'), { recursive: true }); writeFileSync(target, 'input');
      const next = commit(); assert.notEqual(next, old, path); old = next;
    }
    git('update-index', '--chmod=+x', 'scripts/run.mjs'); git('-c', 'user.name=CI Test', '-c', 'user.email=ci@example.invalid', 'commit', '-qm', 'mode');
    const mode = git('rev-parse', 'HEAD^{tree}'); assert.notEqual(mode, old); old = mode;
    git('mv', 'base.txt', 'renamed.txt'); const renamed = commit(); assert.notEqual(renamed, old);
    git('-c', 'user.name=CI Test', '-c', 'user.email=ci@example.invalid', 'commit', '--allow-empty', '-qm', 'same tree');
    assert.equal(git('rev-parse', 'HEAD^{tree}'), renamed);
    assert.throws(() => git('rev-parse', 'missing-ref^{tree}'));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
