import { pathToFileURL } from 'node:url';

export function assertCiSuccess(needs) {
  for (const name of ['static', 'contracts']) {
    if (needs[name]?.result !== 'success') throw new Error(`${name} must succeed, got ${needs[name]?.result}`);
  }
  const code = needs.static.outputs?.code;
  if (code !== 'true' && code !== 'false') throw new Error('Static code selection is missing or invalid');
  const expected = code === 'true' ? 'success' : 'skipped';
  if (needs.tests?.result !== expected) throw new Error(`Tests must be ${expected}, got ${needs.tests?.result}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    assertCiSuccess(JSON.parse(process.env.CI_NEEDS ?? 'null'));
    console.log('CI Success: every required lane supplied positive evidence');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
