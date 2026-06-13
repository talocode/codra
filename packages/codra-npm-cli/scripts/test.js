'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const packageRoot = path.resolve(__dirname, '..');
const wrapper = path.join(packageRoot, 'bin', 'codra.js');
const lib = require('../bin/codra-lib');
const packageVersion = require('../package.json').version;

function run(args, { expectFail = false, env = process.env, cwd = packageRoot } = {}) {
  const label = ['node', 'bin/codra.js', ...args].join(' ');
  console.log(`[test] ${label}`);

  const result = spawnSync(process.execPath, [wrapper, ...args], {
    cwd,
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

function assertVersionOutput(output, expectedVersion, label) {
  assertIncludes(output, `codra ${expectedVersion}`, label);
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
  if (process.env.CODRA_USE_ARTIFACTS === '1') {
    console.log('[test] skip artifact packaging layout test (release artifact mode)');
    return;
  }

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

function testUnderstand() {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'codra-understand-smoke-'));
  try {
    fs.writeFileSync(
      path.join(repo, 'package.json'),
      JSON.stringify(
        {
          name: 'smoke-app',
          scripts: {
            build: 'vite build',
          },
          dependencies: {
            next: '^15.0.0',
            react: '^19.0.0',
          },
        },
        null,
        2,
      ),
    );
    fs.writeFileSync(path.join(repo, 'pnpm-lock.yaml'), 'lockfileVersion: 9\n');
    fs.mkdirSync(path.join(repo, 'src'), { recursive: true });
    fs.mkdirSync(path.join(repo, 'app'), { recursive: true });
    fs.writeFileSync(path.join(repo, 'README.md'), '# Smoke\n');
    fs.writeFileSync(path.join(repo, 'src', 'index.ts'), 'export const value = 1;\n');
    fs.writeFileSync(path.join(repo, 'src', 'index.test.ts'), 'it("ok", () => {});\n');
    fs.writeFileSync(path.join(repo, 'app', 'page.tsx'), 'export default function Page() { return <div />; }\n');

    const result = run(['understand'], { cwd: repo });
    assertIncludes(result.stdout, 'Codra Understand', 'understand output');
    assertIncludes(result.stdout, 'Files scanned:', 'understand output');
    if (result.stdout.includes('NPM_TOKEN') || result.stdout.includes('SECRET=')) {
      console.error('[test] understand output leaked secret-looking text');
      process.exit(1);
    }
  } finally {
    fs.rmSync(repo, { recursive: true, force: true });
  }
}

function testPackagedVersionMatchesPackageVersion() {
  if (process.env.CODRA_SKIP_PACKAGED_VERSION_TEST === '1') {
    console.log('[test] skip packaged version test (explicit env)');
    return;
  }

  const dryRun = spawnSync('npm', ['pack', '--dry-run'], {
    cwd: packageRoot,
    encoding: 'utf8',
    env: process.env,
  });

  if (dryRun.status !== 0) {
    console.error('[test] npm pack --dry-run failed');
    if (dryRun.stdout) console.error(dryRun.stdout);
    if (dryRun.stderr) console.error(dryRun.stderr);
    process.exit(1);
  }

  const pack = spawnSync('npm', ['pack'], {
    cwd: packageRoot,
    encoding: 'utf8',
    env: process.env,
  });

  if (pack.status !== 0) {
    console.error('[test] npm pack failed');
    if (pack.stdout) console.error(pack.stdout);
    if (pack.stderr) console.error(pack.stderr);
    process.exit(1);
  }

  const match = (pack.stdout || '').match(/(talocode-codra-[^\s]+\.tgz)/);
  if (!match) {
    console.error('[test] npm pack did not report a tarball');
    process.exit(1);
  }

  const tarball = path.join(packageRoot, match[1]);
  const install = spawnSync('npm', ['install', '-g', tarball], {
    cwd: packageRoot,
    encoding: 'utf8',
    env: process.env,
  });

  if (install.status !== 0) {
    console.error('[test] npm install -g tarball failed');
    if (install.stdout) console.error(install.stdout);
    if (install.stderr) console.error(install.stderr);
    process.exit(1);
  }

  const globalPrefix = spawnSync('npm', ['prefix', '-g'], {
    cwd: packageRoot,
    encoding: 'utf8',
    env: process.env,
  });

  if (globalPrefix.status !== 0) {
    console.error('[test] npm prefix -g failed');
    if (globalPrefix.stdout) console.error(globalPrefix.stdout);
    if (globalPrefix.stderr) console.error(globalPrefix.stderr);
    process.exit(1);
  }

  const globalCodra = path.join(
    (globalPrefix.stdout || '').trim(),
    'bin',
    process.platform === 'win32' ? 'codra.cmd' : 'codra',
  );

  const globalInstalled = spawnSync(globalCodra, ['--version'], {
    cwd: packageRoot,
    encoding: 'utf8',
    env: process.env,
  });

  if (globalInstalled.status !== 0) {
    console.error('[test] installed global codra --version failed');
    if (globalInstalled.stdout) console.error(globalInstalled.stdout);
    if (globalInstalled.stderr) console.error(globalInstalled.stderr);
    process.exit(1);
  }

  if (!(globalInstalled.stdout || '').includes(`codra ${packageVersion}`)) {
    console.error('[test] installed codra version mismatch');
    console.error(`[test] expected: codra ${packageVersion}`);
    console.error(`[test] global binary: ${globalCodra}`);
    console.error(`[test] stdout: ${globalInstalled.stdout || '<empty>'}`);
    console.error(`[test] stderr: ${globalInstalled.stderr || '<empty>'}`);
    process.exit(1);
  }

  const tarballBin = path.join(packageRoot, 'bin', 'native', `${process.platform}-${process.arch}`, process.platform === 'win32' ? 'codra.exe' : 'codra');
  if (fs.existsSync(tarballBin)) {
    const binary = spawnSync(tarballBin, ['--version'], {
      cwd: packageRoot,
      encoding: 'utf8',
      env: process.env,
    });

    if (binary.status !== 0) {
      console.error('[test] packaged native binary --version failed');
      if (binary.stdout) console.error(binary.stdout);
      if (binary.stderr) console.error(binary.stderr);
      process.exit(1);
    }

    assertVersionOutput(binary.stdout || '', packageVersion, 'packaged native binary version');
  }
}

function main() {
  testPlatformHelpers();

  const version = run(['--version']);
  assertVersionOutput(version.stdout || '', packageVersion, 'version output');

  const help = run(['--help']);
  assertIncludes(help.stdout + help.stderr, 'codra', 'help output');

  const doctor = run(['doctor']);
  assertIncludes(doctor.stdout, 'Codra doctor', 'doctor output');

  const memory = run(['memory', 'status']);
  assertIncludes(memory.stdout, 'provider:', 'memory status output');

  testUnderstand();
  testPackagedVersionMatchesPackageVersion();

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
