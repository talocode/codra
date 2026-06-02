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

function main() {
  const script = shouldUseArtifacts()
    ? path.join(__dirname, 'build-platform-binaries.js')
    : path.join(__dirname, 'build.js');

  console.log(`[prepack] running ${path.basename(script)}`);
  execSync(`node "${script}"`, { cwd: packageRoot, stdio: 'inherit' });
}

main();