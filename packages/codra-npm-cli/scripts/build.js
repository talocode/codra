'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const packageRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(packageRoot, '../..');

function platformArchKey() {
  return `${process.platform}-${process.arch}`;
}

function binaryFileName() {
  return process.platform === 'win32' ? 'codra.exe' : 'codra';
}

function main() {
  console.log(`[build] repo root: ${repoRoot}`);
  console.log('[build] cargo build -p codra-cli --release');

  try {
    execSync('cargo build -p codra-cli --release', {
      cwd: repoRoot,
      stdio: 'inherit',
    });
  } catch {
    console.error('[build] cargo build failed');
    process.exit(1);
  }

  const key = platformArchKey();
  const name = binaryFileName();
  const src = path.join(repoRoot, 'target', 'release', name);
  const destDir = path.join(packageRoot, 'bin', 'native', key);
  const dest = path.join(destDir, name);

  if (!fs.existsSync(src)) {
    console.error(`[build] release binary missing: ${src}`);
    process.exit(1);
  }

  fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(src, dest);

  if (process.platform !== 'win32') {
    fs.chmodSync(dest, 0o755);
  }

  console.log(`[build] packaged ${key}: ${dest}`);
}

main();