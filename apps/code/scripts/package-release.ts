#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as os from 'os';

const VERSION = '0.1.4';
const PKG_NAME = 'codra-code';
const RELEASE_DIR = path.join(process.cwd(), 'release');

function cleanDir(dir: string) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir, { recursive: true });
}

function copyDir(src: string, dest: string) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const items = fs.readdirSync(src);
  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function createLinuxLauncher(binDir: string) {
  const launcher = `#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
exec node "$SCRIPT_DIR/../dist/index.js" "$@"
`;
  const launcherPath = path.join(binDir, 'codra-code');
  fs.writeFileSync(launcherPath, launcher);
  fs.chmodSync(launcherPath, '755');
}

function createMacOSLauncher(binDir: string) {
  createLinuxLauncher(binDir);
}

function createWindowsLauncher(binDir: string) {
  const launcher = `@echo off
set SCRIPT_DIR=%~dp0
node "%SCRIPT_DIR%..\\dist\\index.js" %*
`;
  const launcherPath = path.join(binDir, 'codra-code.cmd');
  fs.writeFileSync(launcherPath, launcher);
}

function createReadme(dir: string, platform: string) {
  const readme = `# Codra Code v${VERSION} - ${platform}

A local-first, open-source coding agent for real software work.

## Requirements

- Node.js >= 18.0.0

## Usage

### Linux/macOS

\`\`\`bash
./bin/codra-code --version
./bin/codra-code --help
./bin/codra-code --mock "/status"
\`\`\`

### Windows

\`\`\`cmd
.\\bin\\codra-code.cmd --version
.\\bin\\codra-code.cmd --help
.\\bin\\codra-code.cmd --mock "/status"
\`\`\`

## Provider Setup

### Ollama (Recommended)

\`\`\`bash
export CODRA_PROVIDER=ollama
export CODRA_MODEL=llama3.1
./bin/codra-code start
\`\`\`

### OpenAI-Compatible

\`\`\`bash
export CODRA_PROVIDER=openai
export CODRA_API_KEY=your-api-key
export CODRA_MODEL=gpt-4o-mini
./bin/codra-code start
\`\`\`

### Test Mode

\`\`\`bash
./bin/codra-code --mock
\`\`\`

## License

MIT - See LICENSE for details.
`;
  fs.writeFileSync(path.join(dir, 'README.md'), readme);
}

function createPackageJson(dir: string) {
  const pkg = {
    name: `@talocode/${PKG_NAME}`,
    version: VERSION,
    description: 'A local-first, open-source coding agent for real software work.',
    type: 'module',
    bin: {
      'codra-code': './bin/codra-code'
    },
    engines: {
      node: '>=18.0.0'
    }
  };
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(pkg, null, 2));
}

function packagePlatform(platform: string, arch: string = 'x64') {
  console.log(`\nPackaging for ${platform}-${arch}...`);
  
  const platformDir = path.join(RELEASE_DIR, `${PKG_NAME}-v${VERSION}-${platform}-${arch}`);
  const binDir = path.join(platformDir, 'bin');
  const distDir = path.join(platformDir, 'dist');
  
  cleanDir(platformDir);
  fs.mkdirSync(binDir, { recursive: true });
  
  // Copy dist
  copyDir(path.join(process.cwd(), 'dist'), distDir);
  
  // Copy skills and plugins
  copyDir(path.join(process.cwd(), 'skills'), path.join(platformDir, 'skills'));
  copyDir(path.join(process.cwd(), 'plugins'), path.join(platformDir, 'plugins'));
  
  // Copy documentation
  fs.copyFileSync(path.join(process.cwd(), 'README.md'), path.join(platformDir, 'README.md'));
  fs.copyFileSync(path.join(process.cwd(), 'CHANGELOG.md'), path.join(platformDir, 'CHANGELOG.md'));
  fs.copyFileSync(path.join(process.cwd(), 'LICENSE'), path.join(platformDir, 'LICENSE'));
  
  // Create launcher
  if (platform === 'windows') {
    createWindowsLauncher(binDir);
  } else if (platform === 'macos') {
    createMacOSLauncher(binDir);
  } else {
    createLinuxLauncher(binDir);
  }
  
  // Create package.json
  createPackageJson(platformDir);
  
  // Create readme
  const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
  createReadme(platformDir, `${platformName} ${arch}`);
  
  // Create archive
  const archiveName = platform === 'windows' 
    ? `${PKG_NAME}-v${VERSION}-${platform}-${arch}.zip`
    : `${PKG_NAME}-v${VERSION}-${platform}-${arch}.tar.gz`;
  
  const archivePath = path.join(RELEASE_DIR, archiveName);
  
  if (platform === 'windows') {
    execSync(`cd ${RELEASE_DIR} && zip -r ${archiveName} ${path.basename(platformDir)}`, { stdio: 'inherit' });
  } else {
    execSync(`tar -czf ${archivePath} -C ${RELEASE_DIR} ${path.basename(platformDir)}`, { stdio: 'inherit' });
  }
  
  console.log(`Created: ${archiveName}`);
  return archiveName;
}

function main() {
  const args = process.argv.slice(2);
  const platformArg = args[0];
  
  console.log(`Codra Code v${VERSION} Release Packaging`);
  console.log('=====================================');
  
  // Clean release directory
  cleanDir(RELEASE_DIR);
  
  // Determine what to package
  const platforms = platformArg ? [platformArg] : ['linux'];
  
  const artifacts: string[] = [];
  
  for (const platform of platforms) {
    switch (platform) {
      case 'linux':
        artifacts.push(packagePlatform('linux', 'x64'));
        break;
      case 'windows':
        artifacts.push(packagePlatform('windows', 'x64'));
        break;
      case 'macos':
        artifacts.push(packagePlatform('macos', 'arm64'));
        artifacts.push(packagePlatform('macos', 'x64'));
        break;
      case 'all':
        artifacts.push(packagePlatform('linux', 'x64'));
        artifacts.push(packagePlatform('windows', 'x64'));
        artifacts.push(packagePlatform('macos', 'arm64'));
        artifacts.push(packagePlatform('macos', 'x64'));
        break;
      default:
        console.error(`Unknown platform: ${platform}`);
        process.exit(1);
    }
  }
  
  // Also create npm tarball
  console.log('\nCreating npm tarball...');
  execSync('npm pack', { stdio: 'inherit' });
  const tgzFiles = fs.readdirSync(process.cwd()).filter(f => f.endsWith('.tgz'));
  if (tgzFiles.length > 0) {
    artifacts.push(tgzFiles[0]);
  }
  
  console.log('\n=====================================');
  console.log('Release artifacts:');
  artifacts.forEach(a => console.log(`  - ${a}`));
  
  // List release directory
  console.log('\nRelease directory contents:');
  const files = fs.readdirSync(RELEASE_DIR);
  files.forEach(f => {
    const stat = fs.statSync(path.join(RELEASE_DIR, f));
    console.log(`  ${f} (${(stat.size / 1024).toFixed(1)} KB)`);
  });
}

main();
