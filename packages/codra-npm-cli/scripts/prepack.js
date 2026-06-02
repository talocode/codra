'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const packageRoot = path.resolve(__dirname, '..');

const TARGET_ARTIFACTS = [
  'codra-linux-x64',
  'codra-linux-arm64',
  'codra-darwin-x64',
  'codra-darwin-arm64',
  'codra-win32-x64.exe',
];

function artifactsDir() {
  return process.env.CODRA_ARTIFACTS_DIR
    ? path.resolve(process.env.CODRA_ARTIFACTS_DIR)
    : path.join(packageRoot, 'artifacts');
}

function shouldUseArtifacts() {
  if (process.env.CODRA_USE_ARTIFACTS === '1') {
    return true;
  }

  const dir = artifactsDir();
  if (!fs.existsSync(dir)) {
    return false;
  }

  return TARGET_ARTIFACTS.some((name) => fs.existsSync(path.join(dir, name)));
}

function installedNativePlatformKeys() {
  const nativeRoot = path.join(packageRoot, 'bin', 'native');
  if (!fs.existsSync(nativeRoot)) {
    return [];
  }

  return fs.readdirSync(nativeRoot).filter((key) => {
    const name = key.startsWith('win32') ? 'codra.exe' : 'codra';
    return fs.existsSync(path.join(nativeRoot, key, name));
  });
}

function expectedPlatformKeys() {
  if (!process.env.CODRA_EXPECT_PLATFORMS) {
    return [];
  }

  return process.env.CODRA_EXPECT_PLATFORMS.split(',')
    .map((key) => key.trim())
    .filter(Boolean);
}

function hasExpectedNativeBinaries() {
  const expected = expectedPlatformKeys();
  const installed = installedNativePlatformKeys();
  if (expected.length === 0) {
    return installed.length > 0;
  }
  return expected.every((key) => installed.includes(key));
}

function shouldSkipArtifactRebuild() {
  if (!shouldUseArtifacts()) {
    return false;
  }

  if (installedNativePlatformKeys().length === 0) {
    return false;
  }

  // CI already ran build:from-artifacts; skip only when every expected selected platform is present.
  if (process.env.CODRA_ALLOW_PARTIAL_BINARIES === '1' && hasExpectedNativeBinaries()) {
    return true;
  }

  return false;
}

function packagingEnv() {
  const env = { ...process.env };
  const keys = [
    'CODRA_USE_ARTIFACTS',
    'CODRA_ARTIFACTS_DIR',
    'CODRA_ALLOW_PARTIAL_BINARIES',
    'CODRA_EXPECT_PLATFORMS',
    'CODRA_EXPECT_ALL_PLATFORMS',
  ];
  for (const key of keys) {
    if (process.env[key] !== undefined) {
      env[key] = process.env[key];
    }
  }
  return env;
}

function main() {
  if (shouldSkipArtifactRebuild()) {
    console.log(
      `[prepack] skip rebuild (${installedNativePlatformKeys().join(', ')} already in bin/native/)`,
    );
    return;
  }

  const script = shouldUseArtifacts()
    ? path.join(__dirname, 'build-platform-binaries.js')
    : path.join(__dirname, 'build.js');

  console.log(`[prepack] running ${path.basename(script)}`);
  execSync(`node "${script}"`, { cwd: packageRoot, stdio: 'inherit', env: packagingEnv() });
}

main();