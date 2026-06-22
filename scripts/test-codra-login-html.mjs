#!/usr/bin/env node

/**
 * Codra login HTML response tests.
 * Run: node scripts/test-codra-login-html.mjs
 */

import * as fs from 'fs';
import * as path from 'path';

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  ✓ ${label}`); passed++; }
  else { console.log(`  ✗ ${label}`); failed++; }
}

console.log('\n=== Codra Login HTML Response Tests ===\n');

// Test 1: Auth module has safe response parsing
console.log('1. Auth Module Safety');
const authContent = fs.readFileSync('apps/code/src/auth/index.ts', 'utf-8');
assert(authContent.includes('readJsonResponse'), 'Has readJsonResponse helper');
assert(authContent.includes('content-type'), 'Checks content-type header');
assert(authContent.includes('NON_JSON_RESPONSE'), 'Throws NON_JSON_RESPONSE error');
assert(authContent.includes('<html'), 'Detects HTML responses');
assert(authContent.includes('self.__next_f.push'), 'Detects RSC responses');
assert(authContent.includes('LoginError'), 'Has LoginError class');
assert(authContent.includes('NETWORK_ERROR'), 'Handles network errors');
assert(authContent.includes('codra-code doctor'), 'Suggests doctor command in error');

// Test 2: startLogin uses safe parsing
console.log('\n2. startLogin Safety');
assert(authContent.includes("readJsonResponse(startResponse, 'Tera auth start endpoint'"), 'startLogin uses readJsonResponse');
assert(authContent.includes('NON_JSON_RESPONSE'), 'startLogin catches non-JSON');

// Test 3: pollForAuth uses safe parsing
console.log('\n3. pollForAuth Safety');
assert(authContent.includes("readJsonResponse(response, 'Tera auth poll endpoint'"), 'pollForAuth uses readJsonResponse');
assert(authContent.includes('nonJsonWarningShown'), 'pollForAuth shows warning once');

// Test 4: Doctor checks Tera API
console.log('\n4. Doctor Command');
const doctorContent = fs.readFileSync('apps/code/src/commands/doctor.ts', 'utf-8');
assert(doctorContent.includes('getAuthBaseUrl'), 'Doctor imports getAuthBaseUrl');
assert(doctorContent.includes('isAuthenticated'), 'Doctor imports isAuthenticated');
assert(doctorContent.includes('content-type'), 'Doctor checks content-type');
assert(doctorContent.includes('application/json'), 'Doctor checks for JSON');
assert(doctorContent.includes('Login endpoint'), 'Doctor shows login endpoint status');
assert(doctorContent.includes('HTML instead of JSON'), 'Doctor detects HTML responses');
assert(doctorContent.includes('codra-code login'), 'Doctor suggests login command');

// Test 5: No raw HTML printing
console.log('\n5. No Raw HTML in CLI Output');
assert(!authContent.includes('console.log(error)'), 'Does not log raw error body');
assert(!authContent.includes('console.log(rawBody)'), 'Does not log raw body');
assert(authContent.includes('MAX_DEBUG_BODY_LENGTH'), 'Has debug body length limit');

// Test 6: Tera routes return JSON (check if Tera repo is available)
console.log('\n6. Tera API Routes');
const teraPath = '/root/projects/tera';
if (fs.existsSync(teraPath)) {
  const startRoute = fs.readFileSync(path.join(teraPath, 'app/api/codra/auth/device/start/route.ts'), 'utf-8');
  assert(startRoute.includes('NextResponse.json'), 'Start route returns JSON');
  assert(!startRoute.includes('return <'), 'Start route does not return JSX');

  const pollRoute = fs.readFileSync(path.join(teraPath, 'app/api/codra/auth/device/poll/route.ts'), 'utf-8');
  assert(pollRoute.includes('NextResponse.json'), 'Poll route returns JSON');
  assert(!pollRoute.includes('return <'), 'Poll route does not return JSX');

  const approveRoute = fs.readFileSync(path.join(teraPath, 'app/api/codra/auth/device/approve/route.ts'), 'utf-8');
  assert(approveRoute.includes('NextResponse.json'), 'Approve route returns JSON');
} else {
  console.log('  (Tera repo not available, skipping Tera route checks)');
}

// Test 7: Error handling structure
console.log('\n7. Error Handling');
assert(authContent.includes('try {'), 'Has try-catch in startLogin');
assert(authContent.includes('catch (fetchErr)'), 'Catches fetch errors specifically');
assert(authContent.includes('Network error'), 'Shows friendly network error');
assert(authContent.includes('status'), 'Shows HTTP status in errors');

// Test 8: No secrets in errors
console.log('\n8. No Secrets in Errors');
assert(!authContent.includes('Authorization'), 'Does not leak auth headers in errors');
assert(!authContent.includes('Bearer'), 'Does not leak bearer tokens');

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
