'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const packageRoot = path.resolve(__dirname, '..');
const forbidden = [/^node_modules\//, /^target\//, /\.env$/, /^scripts\//];

function main() {
  const output = execSync('npm pack --dry-run 2>&1', {
    cwd: packageRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
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

  if (errors.length > 0) {
    console.error('[pack-dry-run] failed:');
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  console.log('[pack-dry-run] ok');
  console.log(`[pack-dry-run] native binaries: ${nativeBins.join(', ')}`);
  process.stdout.write(output);
}

main();