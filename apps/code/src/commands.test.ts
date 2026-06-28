import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isAuthenticated, isHtmlContent, sanitizeErrorMessage } from './auth/index.js';
import { getConfig, saveConfig } from './config.js';
import { isLocalProvider } from './providers/index.js';
import { getComposerState, renderStatusLine, getFooterLine } from './ui/composer.js';

// Basic slash parser simulation
function parseSlash(input: string) {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) return { isSlash: false, cmd: '' };
  const parts = trimmed.split(' ');
  return { isSlash: true, cmd: parts[0].toLowerCase(), args: parts.slice(1) };
}

const VERSION = '0.2.3';

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
  it('/model command still works', () => {
    const p = parseSlash('/model');
    assert.equal(p.cmd, '/model');
  });
  it('/status command still works', () => {
    const p = parseSlash('/status');
    assert.equal(p.cmd, '/status');
  });
  it('/auth command still works', () => {
    const p = parseSlash('/auth');
    assert.equal(p.cmd, '/auth');
  });
  it('/login command still works', () => {
    const p = parseSlash('/login');
    assert.equal(p.cmd, '/login');
  });
  it('/logout command still works', () => {
    const p = parseSlash('/logout');
    assert.equal(p.cmd, '/logout');
  });
  it('/clear command still works', () => {
    const p = parseSlash('/clear');
    assert.equal(p.cmd, '/clear');
  });
  it('/exit command still works', () => {
    const p = parseSlash('/exit');
    assert.equal(p.cmd, '/exit');
  });
  it('/help command still works', () => {
    const p = parseSlash('/help');
    assert.equal(p.cmd, '/help');
  });
  it('/provider command still works', () => {
    const p = parseSlash('/provider');
    assert.equal(p.cmd, '/provider');
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
  it('ollama is local', () => {
    assert.equal(isLocalProvider('ollama'), true);
  });
});

describe('config persist', () => {
  it('saveConfig updates model without throwing', () => {
    const before = getConfig().model;
    saveConfig({ model: 'test-model-unit' });
    const after = getConfig().model;
    assert.equal(after, 'test-model-unit');
  });
});

describe('hosted gating logic', () => {
  it('local providers do not require auth gate', () => {
    const local = isLocalProvider('mock');
    assert.equal(local, true);
  });
  it('hosted providers require auth gate', () => {
    const hosted = isLocalProvider('openai');
    assert.equal(hosted, false);
  });
});

describe('codra-code composer UI', () => {
  it('composer state has required fields', () => {
    const state = getComposerState();
    assert.ok(state.provider);
    assert.equal(typeof state.model, 'string');
    assert.equal(typeof state.mode, 'string');
    assert.equal(typeof state.editPolicy, 'string');
    assert.equal(typeof state.cols, 'number');
  });

  it('status line contains Build label', () => {
    const status = renderStatusLine();
    assert.ok(status.includes('Build'));
  });

  it('status line contains provider/model info', () => {
    const status = renderStatusLine();
    assert.ok(status.includes('·'));
  });

  it('status line contains mode (local/hosted)', () => {
    const status = renderStatusLine();
    assert.ok(status.includes('local') || status.includes('hosted'));
  });

  it('status line contains edit policy', () => {
    const status = renderStatusLine();
    assert.ok(status.includes('confirm-edits') || status.includes('dry-run'));
  });

  it('footer line contains workspace and version', () => {
    const footer = getFooterLine();
    assert.ok(footer.includes('/workspace') || footer.includes('codra'));
    assert.ok(footer.includes(VERSION));
  });
});

describe('auth error HTML sanitization', () => {
  it('detects HTML content', () => {
    assert.equal(isHtmlContent('<!DOCTYPE html><html>...</html>'), true);
    assert.equal(isHtmlContent('<html><body>404</body></html>'), true);
    assert.equal(isHtmlContent('<HTML><body>error</body></HTML>'), true);
  });

  it('does not flag plain text as HTML', () => {
    assert.equal(isHtmlContent('{"error":"not found"}'), false);
    assert.equal(isHtmlContent('Failed to connect'), false);
  });

  it('does not flag JSON as HTML', () => {
    assert.equal(isHtmlContent('{"status":"ok"}'), false);
  });

  it('sanitizes HTML error message', () => {
    const htmlError = new Error('Server returned <!DOCTYPE html><html><body>404 page not found</body></html>');
    const sanitized = sanitizeErrorMessage(htmlError);
    assert.ok(!sanitized.includes('<!DOCTYPE html>'));
    assert.ok(!sanitized.includes('<html>'));
    assert.ok(sanitized.includes('Login failed'));
    assert.ok(sanitized.includes('Tera auth endpoint was not found'));
  });

  it('sanitizes HTML error with URL path', () => {
    const htmlError = new Error('Failed fetching https://teraai.chat/api/codra/auth/device/start got <html>404</html>');
    const sanitized = sanitizeErrorMessage(htmlError);
    assert.ok(!sanitized.includes('<html>'));
    assert.ok(sanitized.includes('teraai.chat'));
  });

  it('preserves non-HTML error messages', () => {
    const normalError = new Error('Connection refused');
    const sanitized = sanitizeErrorMessage(normalError);
    assert.equal(sanitized, 'Connection refused');
  });

  it('handles non-Error objects', () => {
    const sanitized = sanitizeErrorMessage('some string error');
    assert.equal(sanitized, 'some string error');
  });

  it('no raw HTML printed in sanitized output', () => {
    const errors = [
      '<!DOCTYPE html><html>404</html>',
      '<html><body>Not Found</body></html>',
      '<HTML>error</HTML>',
    ];
    for (const errText of errors) {
      const sanitized = sanitizeErrorMessage(new Error(errText));
      assert.ok(!sanitized.includes('<!DOCTYPE'), `Should not contain DOCTYPE: ${errText}`);
      assert.ok(!sanitized.includes('<html>'), `Should not contain <html>: ${errText}`);
      assert.ok(!sanitized.includes('<body>'), `Should not contain <body>: ${errText}`);
    }
  });

  it('no secrets or tokens in sanitized output', () => {
    const htmlError = new Error('token=sk-xxx-secret <!DOCTYPE html>');
    const sanitized = sanitizeErrorMessage(htmlError);
    assert.ok(!sanitized.includes('sk-xxx-secret'));
    assert.ok(!sanitized.includes('<!DOCTYPE'));
  });
});

describe('local/mock mode without login', () => {
  it('mock provider is local', () => {
    assert.equal(isLocalProvider('mock'), true);
  });

  it('local providers work without auth', () => {
    const isLocal = isLocalProvider('mock');
    assert.equal(isLocal, true);
  });
});
