#!/usr/bin/env node
'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SUPPORTED_PLATFORMS = new Set([
  'linux-arm64',
  'linux-x64',
  'darwin-arm64',
  'darwin-x64',
  'win32-x64',
]);

function platformArchKey() {
  const platform = process.platform;
  const arch = process.arch;
  return `${platform}-${arch}`;
}

function binaryFileName() {
  return process.platform === 'win32' ? 'codra.exe' : 'codra';
}

function resolveNativeBinary() {
  const key = platformArchKey();
  const name = binaryFileName();
  const nativePath = path.join(__dirname, 'native', key, name);

  if (!fs.existsSync(nativePath)) {
    const supported = [...SUPPORTED_PLATFORMS].sort().join(', ');
    process.stderr.write(
      `codra: native binary not found for ${key}.\n` +
        `Expected: ${nativePath}\n` +
        `Supported platform keys (when built): ${supported}\n` +
        `Build the package for this machine: npm run build (from packages/codra-npm-cli)\n`,
    );
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