'use strict';

const fs = require('fs');
const path = require('path');

const SUPPORTED_PLATFORM_KEYS = [
  'linux-x64',
  'linux-arm64',
  'darwin-x64',
  'darwin-arm64',
  'win32-x64',
];

function platformArchKey(platform = process.platform, arch = process.arch) {
  return `${platform}-${arch}`;
}

function isSupportedPlatformKey(key) {
  return SUPPORTED_PLATFORM_KEYS.includes(key);
}

function binaryFileName(platformKey) {
  return platformKey && platformKey.startsWith('win32') ? 'codra.exe' : 'codra';
}

function defaultNativeRoot() {
  return path.join(__dirname, 'native');
}

function nativeBinaryPath(platformKey, nativeRoot = defaultNativeRoot()) {
  const name = binaryFileName(platformKey);
  return path.join(nativeRoot, platformKey, name);
}

function listInstalledBinaryPaths(nativeRoot = defaultNativeRoot()) {
  if (!fs.existsSync(nativeRoot)) {
    return [];
  }

  const installed = [];
  for (const entry of fs.readdirSync(nativeRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const key = entry.name;
    const candidate = nativeBinaryPath(key, nativeRoot);
    if (fs.existsSync(candidate)) {
      installed.push(candidate);
    }
  }
  return installed.sort();
}

function formatMissingBinaryMessage(requestedKey, nativeRoot = defaultNativeRoot()) {
  const lines = [];
  const expected = nativeBinaryPath(requestedKey, nativeRoot);
  const installed = listInstalledBinaryPaths(nativeRoot);

  lines.push(`Codra CLI binary is not available for ${requestedKey} in this package.`);
  lines.push(`Expected path: ${expected}`);
  lines.push(`Supported platforms: ${SUPPORTED_PLATFORM_KEYS.join(', ')}`);

  if (installed.length > 0) {
    lines.push('Binaries bundled in this package:');
    for (const p of installed) {
      lines.push(`  - ${p}`);
    }
  } else {
    lines.push(
      'No native binaries are bundled. For local dev: npm run build (packages/codra-npm-cli).',
    );
  }

  lines.push(
    'Multi-platform npm installs require release-built binaries for your OS/arch.',
  );

  return lines.join('\n') + '\n';
}

function formatUnsupportedPlatformMessage(requestedKey) {
  const installed = listInstalledBinaryPaths();
  const lines = [
    `Codra CLI does not support platform ${requestedKey}.`,
    `Supported platforms: ${SUPPORTED_PLATFORM_KEYS.join(', ')}`,
  ];

  if (installed.length > 0) {
    lines.push('Binaries bundled in this package:');
    for (const p of installed) {
      lines.push(`  - ${p}`);
    }
  }

  return lines.join('\n') + '\n';
}

function resolveNativeBinary(nativeRoot = defaultNativeRoot()) {
  const key = platformArchKey();

  if (!isSupportedPlatformKey(key)) {
    return { ok: false, reason: 'unsupported', key };
  }

  const nativePath = nativeBinaryPath(key, nativeRoot);
  if (!fs.existsSync(nativePath)) {
    return { ok: false, reason: 'missing', key };
  }

  return { ok: true, path: nativePath, key };
}

module.exports = {
  SUPPORTED_PLATFORM_KEYS,
  platformArchKey,
  isSupportedPlatformKey,
  binaryFileName,
  nativeBinaryPath,
  listInstalledBinaryPaths,
  formatMissingBinaryMessage,
  formatUnsupportedPlatformMessage,
  resolveNativeBinary,
  defaultNativeRoot,
};