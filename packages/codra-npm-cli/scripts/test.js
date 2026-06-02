'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const packageRoot = path.resolve(__dirname, '..');
const wrapper = path.join(packageRoot, 'bin', 'codra.js');
const lib = require('../bin/codra-lib');

function run(args, { expectFail = false, env = process.env } = {}) {
  const label = ['node', 'bin/codra.js', ...args].join(' ');
  console.log(`[test] ${label}`);

  const result = spawnSync(process.execPath, [wrapper, ...args], {
    cwd: packageRoot,
    encoding: 'utf8',
    env,
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

function testPlatformHelpers() {
  const key = lib.platformArchKey();
  console.log(`[test] current platform key: ${key}`);

  if (!lib.isSupportedPlatformKey('linux-arm64')) {
    console.error('[test] linux-arm64 should be supported');
    process.exit(1);
  }

  if (lib.isSupportedPlatformKey('linux-ia32')) {
    console.error('[test] linux-ia32 should not be supported');
    process.exit(1);
  }

  const resolved = lib.resolveNativeBinary();
  if (!resolved.ok && resolved.reason === 'missing') {
    console.error('[test] expected current host binary to exist after npm run build');
    process.exit(1);
  }

  if (!resolved.ok) {
    console.error(`[test] unexpected resolve failure: ${resolved.reason}`);
    process.exit(1);
  }

  const unsupported = lib.formatUnsupportedPlatformMessage('linux-ia32');
  assertIncludes(unsupported, 'does not support platform linux-ia32', 'unsupported message');

  const missing = lib.formatMissingBinaryMessage(key);
  assertIncludes(missing, 'not available', 'missing message');
}

function testArtifactPackaging() {
  const tmpArtifacts = fs.mkdtempSync(path.join(os.tmpdir(), 'codra-artifacts-'));
  const hostBinary = lib.resolveNativeBinary();

  if (!hostBinary.ok) {
    console.error('[test] skip artifact packaging: host binary missing');
    return;
  }

  try {
    const targets = [
      'codra-linux-x64',
      'codra-linux-arm64',
      'codra-darwin-x64',
      'codra-darwin-arm64',
      'codra-win32-x64.exe',
    ];

    for (const name of targets) {
      fs.copyFileSync(hostBinary.path, path.join(tmpArtifacts, name));
    }

    const result = spawnSync(
      process.execPath,
      [path.join(__dirname, 'build-platform-binaries.js')],
      {
        cwd: packageRoot,
        encoding: 'utf8',
        env: {
          ...process.env,
          CODRA_ARTIFACTS_DIR: tmpArtifacts,
        },
      },
    );

    if (result.status !== 0) {
      console.error('[test] build-platform-binaries failed');
      if (result.stderr) console.error(result.stderr);
      process.exit(1);
    }

    for (const key of lib.SUPPORTED_PLATFORM_KEYS) {
      const dest = lib.nativeBinaryPath(key);
      if (!fs.existsSync(dest)) {
        console.error(`[test] missing packaged binary: ${dest}`);
        process.exit(1);
      }
    }

    console.log('[test] artifact packaging layout ok');
  } finally {
    fs.rmSync(tmpArtifacts, { recursive: true, force: true });
    const nativeRoot = path.join(packageRoot, 'bin', 'native');
    if (fs.existsSync(nativeRoot)) {
      fs.rmSync(nativeRoot, { recursive: true, force: true });
    }
    spawnSync(process.execPath, [path.join(__dirname, 'build.js')], {
      cwd: packageRoot,
      stdio: 'inherit',
    });
  }
}

function main() {
  testPlatformHelpers();

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

  testArtifactPackaging();

  console.log('[test] all checks passed');
}

main();