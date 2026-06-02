#!/usr/bin/env node
'use strict';

const { spawnSync } = require('child_process');
const {
  resolveNativeBinary,
  formatMissingBinaryMessage,
  formatUnsupportedPlatformMessage,
} = require('./codra-lib');

function main() {
  const resolved = resolveNativeBinary();

  if (!resolved.ok) {
    if (resolved.reason === 'unsupported') {
      process.stderr.write(formatUnsupportedPlatformMessage(resolved.key));
    } else {
      process.stderr.write(formatMissingBinaryMessage(resolved.key));
    }
    process.exit(1);
  }

  const args = process.argv.slice(2);
  const result = spawnSync(resolved.path, args, {
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