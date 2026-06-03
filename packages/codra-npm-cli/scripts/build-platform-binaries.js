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

function selectedTargets() {
  const expect = process.env.CODRA_EXPECT_PLATFORMS;
  if (!expect) {
    return TARGETS;
  }

  const keys = expect
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean);
  const selected = TARGETS.filter((target) => keys.includes(target.key));
  if (selected.length === 0) {
    console.error('[build:from-artifacts] CODRA_EXPECT_PLATFORMS did not match any known targets');
    process.exit(1);
  }
  return selected;
}

function resolveArtifactPath(srcDir, artifactName) {
  const direct = path.join(srcDir, artifactName);
  if (fs.existsSync(direct)) {
    const stat = fs.statSync(direct);
    if (stat.isFile()) {
      return direct;
    }
    if (stat.isDirectory()) {
      const nested = path.join(direct, artifactName);
      if (fs.existsSync(nested) && fs.statSync(nested).isFile()) {
        return nested;
      }
      const nestedBin = path.join(direct, path.basename(artifactName, path.extname(artifactName)));
      if (fs.existsSync(nestedBin) && fs.statSync(nestedBin).isFile()) {
        return nestedBin;
      }
    }
  }

  return null;
}

function main() {
  const srcDir = artifactsDir();
  const partial = allowPartial();
  const targets = selectedTargets();
  const missing = [];
  const packaged = [];

  console.log(`[build:from-artifacts] artifacts dir: ${srcDir}`);
  console.log(`[build:from-artifacts] partial packaging: ${partial ? 'yes' : 'no'}`);
  console.log(
    `[build:from-artifacts] selected targets: ${targets.map((target) => target.key).join(', ')}`,
  );

  if (!fs.existsSync(srcDir)) {
    console.error(`[build:from-artifacts] artifacts directory not found: ${srcDir}`);
    process.exit(1);
  }

  for (const target of targets) {
    const src = resolveArtifactPath(srcDir, target.artifact);
    const destDir = path.join(packageRoot, 'bin', 'native', target.key);
    const dest = path.join(destDir, target.destName);

    if (!src) {
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
      console.error(`  - ${name}`);
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

  const requiredCount = partial ? packaged.length : targets.length;
  if (!partial && packaged.length !== targets.length) {
    console.error(
      `[build:from-artifacts] expected ${targets.length} binaries, packaged ${packaged.length}`,
    );
    process.exit(1);
  }

  console.log(
    `[build:from-artifacts] packaged ${packaged.length}/${targets.length} selected targets (required ${requiredCount})`,
  );
}

main();