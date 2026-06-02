'use strict';

const { spawnSync } = require('child_process');
const path = require('path');

const packageRoot = path.resolve(__dirname, '..');
const wrapper = path.join(packageRoot, 'bin', 'codra.js');

function run(args, { expectFail = false } = {}) {
  const label = ['node', 'bin/codra.js', ...args].join(' ');
  console.log(`[test] ${label}`);

  const result = spawnSync(process.execPath, [wrapper, ...args], {
    cwd: packageRoot,
    encoding: 'utf8',
    env: process.env,
  });

  const stdout = result.stdout || '';
  const stderr = result.stderr || '';
  const exitCode = result.status ?? 1;

  if (result.error) {
    console.error(`[test] spawn error: ${result.error.message}`);
    process.exit(1);
  }

  if (expectFail) {
    if (exitCode === 0) {
      console.error('[test] expected non-zero exit');
      process.exit(1);
    }
  } else if (exitCode !== 0) {
    console.error(`[test] unexpected exit ${exitCode}`);
    if (stderr) console.error(stderr);
    process.exit(1);
  }

  return { stdout, stderr, exitCode };
}

function assertIncludes(haystack, needle, label) {
  if (!haystack.includes(needle)) {
    console.error(`[test] missing ${label}: ${needle}`);
    process.exit(1);
  }
}

function main() {
  const help = run(['--help']);
  assertIncludes(help.stdout + help.stderr, 'codra', 'help output');

  const valid = run(['run', '--task', 'summarize-context', '--jsonl']);
  assertIncludes(valid.stdout, 'codra.run.started', 'run started event');
  assertIncludes(valid.stdout, 'codra.run.completed', 'run completed event');

  const invalid = run(['run', '--task', 'not-a-real-task', '--jsonl'], {
    expectFail: true,
  });
  assertIncludes(invalid.stdout, 'codra.run.failed', 'run failed event');

  const combined = invalid.stdout + invalid.stderr;
  if (/ghp_[A-Za-z0-9]+/i.test(combined) || /github_pat_/i.test(combined)) {
    console.error('[test] output appears to contain a token pattern');
    process.exit(1);
  }

  console.log('[test] all checks passed');
}

main();