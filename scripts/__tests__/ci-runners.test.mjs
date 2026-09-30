import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';

const directory = new URL('../../.github/workflows/', import.meta.url);
const workflows = Object.fromEntries(readdirSync(directory)
  .filter((name) => /\.ya?ml$/.test(name))
  .map((name) => [name, readFileSync(new URL(name, directory), 'utf8')]));

// Dependency-free on purpose: these checks run even on documentation-only PRs.
// This consumer owns fixed runner choices; selection precedence is tested by CI.
function assertHostedOnly(files) {
  let checked = 0;
  for (const [file, contents] of Object.entries(files)) {
    const source = contents.split('\n').filter((line) => !line.trimStart().startsWith('#')).join('\n');
    assert.doesNotMatch(source, /aws-actions\/|\/aws-deploy@|amazonaws\.com|s3:\/\/|\baws\s+(?:sts|s3|s3api|ec2|ssm|ecr)\b|TURBO_(?:API|TOKEN|TEAM)|secrets:\s*inherit/i, file);
    const jobs = source.split(/^jobs:\s*$/m)[1];
    assert.ok(jobs, `${file}: no jobs found`);
    const blocks = [...jobs.matchAll(/^  ([\w-]+):\n([\s\S]*?)(?=^  [\w-]+:\n|$(?![\s\S]))/gm)];
    assert.ok(blocks.length, `${file}: no job blocks found`);
    for (const [, name, body] of blocks) {
      const label = `${file}: ${name}`;
      const reusable = body.match(/^    uses: (\S+)/m);
      if (reusable) {
        assert.match(reusable[1], /^12-apps\/ci\/\.github\/workflows\/(?:monorepo-static|monorepo-tests|commitlint)\.yml@[a-f0-9]{40}$/, label);
        assert.match(body, /^    with:\n(?:      .*\n)*?      runner: ubuntu-latest\s*$/m, label);
      } else {
        assert.match(body, /^    runs-on: ubuntu-latest\s*$/m, label);
      }
      checked += 1;
    }
  }
  return checked;
}

test('all consumer jobs explicitly select standard GitHub-hosted runners', () => {
  assert.equal(assertHostedOnly(workflows), 6);
});

test('removing any explicit runner selection fails closed', () => {
  let mutations = 0;
  for (const [file, source] of Object.entries(workflows)) {
    for (const match of source.matchAll(/^\s+(?:runner|runs-on): ubuntu-latest\n/gm)) {
      const changed = source.slice(0, match.index) + source.slice(match.index + match[0].length);
      assert.throws(() => assertHostedOnly({ ...workflows, [file]: changed }), `${file}: selector ${mutations}`);
      mutations += 1;
    }
  }
  assert.equal(mutations, 6);
});

test('self-hosted labels and inherited organization selectors are rejected', () => {
  for (const choice of ['self-hosted', 'aws-ci', "${{ vars.CI_RUNNER || 'ubuntu-latest' }}"] ) {
    for (const [file, source] of Object.entries(workflows)) {
      assert.throws(() => assertHostedOnly({ ...workflows, [file]: source.replace(/((?:runner|runs-on): )ubuntu-latest/, `$1${choice}`) }), `${file}: ${choice}`);
    }
  }
});

test('AWS deployment/storage and paid remote-cache wiring are rejected', () => {
  for (const addition of [
    '      - uses: aws-actions/configure-aws-credentials@v4',
    '      - uses: 12-apps/ci/.github/actions/aws-deploy@v2',
    '      - run: aws s3 sync . s3://ci-artifacts',
    '      TURBO_API: https://cache.example.invalid',
    '    secrets: inherit',
  ]) {
    const file = 'ci.yml';
    assert.throws(() => assertHostedOnly({ ...workflows, [file]: `${workflows[file]}\n${addition}\n` }), addition);
  }
});
