#!/usr/bin/env node

/**
 * Codra Agent-Native Protocol docs tests.
 * Run: node scripts/test-agent-native-protocol-docs.mjs
 */

import * as fs from 'fs'

let passed = 0
let failed = 0

function assert(condition, label) {
  if (condition) { console.log(`  ✓ ${label}`); passed++; }
  else { console.log(`  ✗ ${label}`); failed++; }
}

console.log('\n=== Codra Agent-Native Protocol Docs Tests ===\n')

// Test 1: Protocol doc exists
console.log('1. Protocol Doc')
assert(fs.existsSync('apps/code/docs/AGENT_NATIVE_PROTOCOL.md'), 'Protocol doc exists')
const doc = fs.readFileSync('apps/code/docs/AGENT_NATIVE_PROTOCOL.md', 'utf-8')
assert(doc.includes('Talocode Agent-Native Protocol'), 'Names the protocol')
assert(doc.includes('Planned'), 'Marks planned items')

// Test 2: Actions documented
console.log('\n2. Actions Documented')
assert(doc.includes('codra.plan.create'), 'Plans create action')
assert(doc.includes('codra.plan.run'), 'Plans run action')
assert(doc.includes('codra.file.read'), 'File read action')
assert(doc.includes('codra.file.write'), 'File write action')
assert(doc.includes('codra.git.status'), 'Git status action')
assert(doc.includes('codra.command.run'), 'Command run action')

// Test 3: Context providers
console.log('\n3. Context Providers')
assert(doc.includes('codra.thread'), 'Thread context provider')
assert(doc.includes('codra.plan'), 'Plan context provider')
assert(doc.includes('codra.files'), 'Files context provider')
assert(doc.includes('codra.git'), 'Git context provider')

// Test 4: Permission gates
console.log('\n4. Permission Gates')
assert(doc.includes('codra:read'), 'Read permission')
assert(doc.includes('codra:write'), 'Write permission')
assert(doc.includes('codra:execute'), 'Execute permission')

// Test 5: No external names
console.log('\n5. No External Names')
let noExternal = true
const content = doc.toLowerCase()
if (content.includes('builderio') || content.includes('builder.io') || content.includes('agent-native repo')) {
  noExternal = false
}
assert(noExternal, 'No external repo/product names')

// Test 6: No overclaiming
console.log('\n6. No Overclaiming')
let noOverclaim = true
const overclaimTerms = ['bypass approval', 'uncontrolled agent', 'hidden action', 'fully implemented']
for (const term of overclaimTerms) {
  if (content.includes(term)) { noOverclaim = false }
}
assert(noOverclaim, 'No overclaiming language')

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`)
process.exit(failed > 0 ? 1 : 0)
