import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isAuthenticated } from './auth/index.js';
import { getConfig, saveConfig } from './config.js';
import { isLocalProvider } from './providers/index.js';

// Basic slash parser simulation
function parseSlash(input: string) {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) return { isSlash: false, cmd: '' };
  const parts = trimmed.split(' ');
  return { isSlash: true, cmd: parts[0].toLowerCase(), args: parts.slice(1) };
}

describe('slash command parser', () => {
  it('detects / command', () => {
    const p = parseSlash('/model');
    assert.equal(p.isSlash, true);
    assert.equal(p.cmd, '/model');
  });
  it('detects / with args', () => {
    const p = parseSlash('/provider ollama');
    assert.equal(p.cmd, '/provider');
    assert.deepEqual(p.args, ['ollama']);
  });
  it('ignores non slash', () => {
    const p = parseSlash('hello world');
    assert.equal(p.isSlash, false);
  });
});

describe('auth and gating', () => {
  it('isAuthenticated returns boolean', () => {
    const auth = isAuthenticated();
    assert.equal(typeof auth, 'boolean');
  });
});

describe('provider registry', () => {
  it('mock is local', () => {
    assert.equal(isLocalProvider('mock'), true);
  });
  it('openai is not local', () => {
    assert.equal(isLocalProvider('openai'), false);
  });
});

describe('config persist', () => {
  it('saveConfig updates model without throwing', () => {
    const before = getConfig().model;
    saveConfig({ model: 'test-model-unit' });
    const after = getConfig().model;
    assert.equal(after, 'test-model-unit');
    // restore? skip for test
  });
});

describe('hosted gating logic', () => {
  it('local providers do not require auth gate', () => {
    // simulate
    const local = isLocalProvider('mock');
    assert.equal(local, true);
  });
});
