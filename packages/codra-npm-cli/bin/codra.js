#!/usr/bin/env node
'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PLANNED_PLATFORMS = [
  'linux-x64',
  'linux-arm64',
  'darwin-x64',
  'darwin-arm64',
  'win32-x64',
];

function platformArchKey() {
  return `${process.platform}-${process.arch}`;
}

function binaryFileName(platformKey) {
  return platformKey && platformKey.startsWith('win32') ? 'codra.exe' : 'codra';
}

function nativeBinaryPath(platformKey) {
  const name = binaryFileName(platformKey);
  return path.join(__dirname, 'native', platformKey, name);
}

function listInstalledBinaryPaths() {
  const nativeRoot = path.join(__dirname, 'native');
  if (!fs.existsSync(nativeRoot)) {
    return [];
  }

  const installed = [];
  for (const entry of fs.readdirSync(nativeRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const key = entry.name;
    const candidate = nativeBinaryPath(key);
    if (fs.existsSync(candidate)) {
      installed.push(candidate);
    }
  }
  return installed.sort();
}

function reportMissingBinary(requestedKey) {
  const expected = nativeBinaryPath(requestedKey);
  const installed = listInstalledBinaryPaths();

  process.stderr.write(
    `Codra CLI binary is not available for ${requestedKey} in this package.\n` +
      `Expected path: ${expected}\n` +
      `Planned release targets: ${PLANNED_PLATFORMS.join(', ')}\n`,
  );

  if (installed.length > 0) {
    process.stderr.write('Binaries included in this package:\n');
    for (const p of installed) {
      process.stderr.write(`  - ${p}\n`);
    }
  } else {
    process.stderr.write(
      'No native binaries are bundled. Run: npm run build (from packages/codra-npm-cli)\n',
    );
  }

  process.stderr.write(
    'Public npm installs require a release-built binary for your platform. ' +
      'This tarball currently ships only binaries built on the publishing machine.\n',
  );
}

function resolveNativeBinary() {
  const key = platformArchKey();
  const nativePath = nativeBinaryPath(key);

  if (!fs.existsSync(nativePath)) {
    reportMissingBinary(key);
    process.exit(1);
  }

  return nativePath;
}

function main() {
  const binary = resolveNativeBinary();
  const args = process.argv.slice(2);

  const result = spawnSync(binary, args, {
    stdio: 'inherit',
    env: process.env,
  });

  if (result.error) {
    process.stderr.write(`codra: failed to run native binary: ${result.error.message}\n`);
    process.exit(1);
  }

  if (result.signal) {
    process.exit(1);
  }

  process.exit(result.status === null ? 1 : result.status);
}

main();