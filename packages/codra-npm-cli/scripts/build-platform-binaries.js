'use strict';

const fs = require('fs');
const path = require('path');

const packageRoot = path.resolve(__dirname, '..');

const TARGETS = [
  { key: 'linux-x64', artifact: 'codra-linux-x64', destName: 'codra' },
  { key: 'linux-arm64', artifact: 'codra-linux-arm64', destName: 'codra' },
  { key: 'darwin-x64', artifact: 'codra-darwin-x64', destName: 'codra' },
  { key: 'darwin-arm64', artifact: 'codra-darwin-arm64', destName: 'codra' },
  { key: 'win32-x64', artifact: 'codra-win32-x64.exe', destName: 'codra.exe' },
];

function artifactsDir() {
  return process.env.CODRA_ARTIFACTS_DIR
    ? path.resolve(process.env.CODRA_ARTIFACTS_DIR)
    : path.join(packageRoot, 'artifacts');
}

function allowPartial() {
  return process.env.CODRA_ALLOW_PARTIAL_BINARIES === '1';
}

function main() {
  const srcDir = artifactsDir();
  const partial = allowPartial();
  const missing = [];
  const packaged = [];

  console.log(`[build:from-artifacts] artifacts dir: ${srcDir}`);
  console.log(`[build:from-artifacts] partial packaging: ${partial ? 'yes' : 'no'}`);

  if (!fs.existsSync(srcDir)) {
    console.error(`[build:from-artifacts] artifacts directory not found: ${srcDir}`);
    process.exit(1);
  }

  for (const target of TARGETS) {
    const src = path.join(srcDir, target.artifact);
    const destDir = path.join(packageRoot, 'bin', 'native', target.key);
    const dest = path.join(destDir, target.destName);

    if (!fs.existsSync(src)) {
      missing.push(target.artifact);
      continue;
    }

    fs.mkdirSync(destDir, { recursive: true });
    fs.copyFileSync(src, dest);

    if (!target.key.startsWith('win32')) {
      fs.chmodSync(dest, 0o755);
    }

    packaged.push(`${target.key} -> ${dest}`);
  }

  for (const line of packaged) {
    console.log(`[build:from-artifacts] ${line}`);
  }

  if (missing.length > 0) {
    console.error('[build:from-artifacts] missing artifacts:');
    for (const name of missing) {
      console.error(`  - ${path.join(srcDir, name)}`);
    }

    if (!partial) {
      console.error(
        '[build:from-artifacts] set CODRA_ALLOW_PARTIAL_BINARIES=1 to package available targets only',
      );
      process.exit(1);
    }
  }

  if (packaged.length === 0) {
    console.error('[build:from-artifacts] no artifacts packaged');
    process.exit(1);
  }

  console.log(`[build:from-artifacts] packaged ${packaged.length}/${TARGETS.length} targets`);
}

main();