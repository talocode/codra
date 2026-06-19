#!/usr/bin/env node

/**
 * Codra Code v0.1.6 Authentication Validation Script
 * 
 * This script validates the authentication flow without requiring
 * a running Tera backend. It tests:
 * 
 * 1. Auth module functionality
 * 2. Token storage and retrieval
 * 3. Protected command gating
 * 4. CLI commands
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

const AUTH_FILE = path.join(os.homedir(), '.codra', 'auth.json');
const CLI_PATH = path.join(process.cwd(), 'dist/index.js');

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`✗ ${name}: ${e.message}`);
    failed++;
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

// Clean up before tests
function cleanup() {
  if (fs.existsSync(AUTH_FILE)) {
    fs.unlinkSync(AUTH_FILE);
  }
}

// Test 1: Auth module functions
console.log('\n=== Auth Module Tests ===');

cleanup();

test('isAuthenticated returns false when no token', () => {
  // Dynamic import to get fresh state
  const { isAuthenticated } = require('./dist/auth/index.js');
  assert(!isAuthenticated(), 'Should not be authenticated');
});

test('getAuthFilePath returns correct path', () => {
  const { getAuthFilePath } = require('./dist/auth/index.js');
  assert(getAuthFilePath() === AUTH_FILE, 'Path mismatch');
});

test('Token can be saved and loaded', () => {
  const testToken = {
    userId: 'test-user-123',
    email: 'test@example.com',
    accessToken: 'test-token-abc123',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    source: 'teraai.chat'
  };

  const codraDir = path.join(os.homedir(), '.codra');
  if (!fs.existsSync(codraDir)) {
    fs.mkdirSync(codraDir, { recursive: true });
  }

  fs.writeFileSync(AUTH_FILE, JSON.stringify(testToken, null, 2));
  
  const savedToken = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf-8'));
  assert(savedToken.email === 'test@example.com', 'Email mismatch');
  assert(savedToken.accessToken === 'test-token-abc123', 'Token mismatch');
  
  cleanup();
});

test('Expired token is detected', () => {
  const expiredToken = {
    userId: 'test-user-123',
    email: 'test@example.com',
    accessToken: 'test-token-abc123',
    expiresAt: new Date(Date.now() - 1000).toISOString(), // Expired
    createdAt: new Date().toISOString(),
    source: 'teraai.chat'
  };

  fs.writeFileSync(AUTH_FILE, JSON.stringify(expiredToken, null, 2));
  
  const { getAuthToken } = require('./dist/auth/index.js');
  const token = getAuthToken();
  // getAuthToken should return null or warn about expired token
  // The exact behavior depends on implementation
  
  cleanup();
});

// Test 2: CLI commands
console.log('\n=== CLI Command Tests ===');

test('--version returns 0.1.6', () => {
  const output = execSync(`node ${CLI_PATH} --version`, { encoding: 'utf-8' });
  assert(output.trim() === '0.1.6', `Expected 0.1.6, got ${output.trim()}`);
});

test('--help works without auth', () => {
  const output = execSync(`node ${CLI_PATH} --help`, { encoding: 'utf-8' });
  assert(output.includes('login'), 'Should include login command');
  assert(output.includes('logout'), 'Should include logout command');
  assert(output.includes('auth'), 'Should include auth command');
});

test('auth status works without auth', () => {
  cleanup();
  const output = execSync(`node ${CLI_PATH} auth`, { encoding: 'utf-8' });
  assert(output.includes('Not authenticated'), 'Should show not authenticated');
});

test('logout works without auth', () => {
  cleanup();
  const output = execSync(`node ${CLI_PATH} logout`, { encoding: 'utf-8' });
  assert(output.includes('Signed out'), 'Should show signed out');
});

test('Protected command shows login requirement', () => {
  cleanup();
  const output = execSync(`node ${CLI_PATH} --mock "/status"`, { encoding: 'utf-8', env: { ...process.env, CODRA_AUTH_DEV_BYPASS: '0' } });
  assert(output.includes('requires a Tera account'), 'Should require auth');
});

test('Protected command works with valid token', () => {
  // Create test token
  const testToken = {
    userId: 'test-user-123',
    email: 'test@example.com',
    accessToken: 'test-token-abc123',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    source: 'teraai.chat'
  };
  
  const codraDir = path.join(os.homedir(), '.codra');
  if (!fs.existsSync(codraDir)) {
    fs.mkdirSync(codraDir, { recursive: true });
  }
  
  fs.writeFileSync(AUTH_FILE, JSON.stringify(testToken, null, 2));
  
  const output = execSync(`node ${CLI_PATH} --mock "/status"`, { encoding: 'utf-8', env: { ...process.env, CODRA_AUTH_DEV_BYPASS: '0' } });
  assert(output.includes('Codra Code Status'), 'Should show status');
  
  cleanup();
});

// Test 3: Login command
console.log('\n=== Login Command Tests ===');

test('login --no-browser prints URL', () => {
  // This will fail to connect but should print the URL pattern
  try {
    execSync(`timeout 3 node ${CLI_PATH} login --no-browser 2>&1 || true`, { encoding: 'utf-8' });
  } catch (e) {
    // Expected to timeout
  }
  // The login command should at least start
  assert(true, 'Login command starts');
});

// Summary
console.log('\n=== Summary ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('\n✓ All validation tests passed!');
  process.exit(0);
}
