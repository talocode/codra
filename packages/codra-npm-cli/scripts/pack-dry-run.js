'use strict';

const { execSync } = require('child_process');
const path = require('path');

const packageRoot = path.resolve(__dirname, '..');
const { SUPPORTED_PLATFORM_KEYS } = require('../bin/codra-lib');

const forbidden = [/^node_modules\//, /^target\//, /^artifacts\//, /\.env$/, /^scripts\//];

const EXPECTED_NATIVE = SUPPORTED_PLATFORM_KEYS.map((key) => {
  const name = key.startsWith('win32') ? 'codra.exe' : 'codra';
  return `bin/native/${key}/${name}`;
});

function main() {
  const expectAll = process.env.CODRA_EXPECT_ALL_PLATFORMS === '1';

  const output = execSync('npm pack --dry-run 2>&1', {
    cwd: packageRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
    env: {
      ...process.env,
      CODRA_USE_ARTIFACTS: process.env.CODRA_USE_ARTIFACTS || (expectAll ? '1' : process.env.CODRA_USE_ARTIFACTS),
    },
  });

  const lines = output.split('\n');
  const tarballLines = lines.filter((line) => line.startsWith('npm notice '));
  const fileLines = tarballLines
    .map((line) => line.replace(/^npm notice /, '').trim())
    .filter((line) => /^[\d.]+[kMG]?B\s+/.test(line))
    .map((line) => line.replace(/^[\d.]+[kMG]?B\s+/, ''));

  const errors = [];

  for (const file of fileLines) {
    if (forbidden.some((re) => re.test(file))) {
      errors.push(`forbidden path in pack: ${file}`);
    }
  }

  const required = ['package.json', 'README.md', 'bin/codra.js'];
  for (const file of required) {
    if (!fileLines.includes(file)) {
      errors.push(`missing required file: ${file}`);
    }
  }

  const nativeBins = fileLines.filter((f) => f.startsWith('bin/native/'));
  if (nativeBins.length === 0) {
    errors.push('no bin/native/<platform>-<arch>/ binary in pack (run npm run build first)');
  }

  if (expectAll) {
    for (const expected of EXPECTED_NATIVE) {
      if (!fileLines.includes(expected)) {
        errors.push(`missing release binary: ${expected}`);
      }
    }
  }

  if (errors.length > 0) {
    console.error('[pack-dry-run] failed:');
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  console.log('[pack-dry-run] ok');
  console.log(`[pack-dry-run] native binaries (${nativeBins.length}): ${nativeBins.join(', ')}`);
  process.stdout.write(output);
}

main();