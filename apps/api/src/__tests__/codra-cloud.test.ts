import { describe, it, before, after } from 'node:test'
import assert from 'node:assert'
import { findRoute } from '../router'
import { extractApiKey, validateApiKey } from '../middleware/auth'
import type { RepoSummaryInput, ExplainInput, ReviewInput, PlanInput } from '../types'

const ORIGINAL_ENV = { ...process.env }

describe('Codra Cloud API v0.1', () => {
  before(() => {
    process.env.TALOCODE_API_KEY = 'test-api-key'
    process.env.CODRA_CLOUD_MOCK = 'true'
    process.env.NODE_ENV = 'test'
  })

  after(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  describe('router', () => {
    it('resolves POST /v1/codra/repo-summary', () => {
      const route = findRoute('POST', '/v1/codra/repo-summary')
      assert.ok(route, 'route should be found')
      assert.strictEqual(typeof route!.handler, 'function')
    })

    it('resolves POST /v1/codra/explain', () => {
      const route = findRoute('POST', '/v1/codra/explain')
      assert.ok(route)
    })

    it('resolves POST /v1/codra/review', () => {
      const route = findRoute('POST', '/v1/codra/review')
      assert.ok(route)
    })

    it('resolves POST /v1/codra/plan', () => {
      const route = findRoute('POST', '/v1/codra/plan')
      assert.ok(route)
    })

    it('resolves local route /api/v1/codra/repo-summary', () => {
      const route = findRoute('POST', '/api/v1/codra/repo-summary')
      assert.ok(route, 'local route should also be found')
    })

    it('resolves local route /api/v1/codra/explain', () => {
      const route = findRoute('POST', '/api/v1/codra/explain')
      assert.ok(route)
    })

    it('resolves local route /api/v1/codra/review', () => {
      const route = findRoute('POST', '/api/v1/codra/review')
      assert.ok(route)
    })

    it('resolves local route /api/v1/codra/plan', () => {
      const route = findRoute('POST', '/api/v1/codra/plan')
      assert.ok(route)
    })

    it('resolves GET /health', () => {
      const route = findRoute('GET', '/health')
      assert.ok(route)
    })

    it('returns null for unknown routes', () => {
      const route = findRoute('GET', '/v1/codra/unknown')
      assert.strictEqual(route, null)
    })

    it('returns null for wrong method', () => {
      const route = findRoute('GET', '/v1/codra/repo-summary')
      assert.strictEqual(route, null)
    })
  })

  describe('auth', () => {
    it('extracts API key from Authorization header', () => {
      const r = new Request('http://test', {
        headers: { authorization: 'Bearer test-api-key' },
      })
      assert.strictEqual(extractApiKey(r), 'test-api-key')
    })

    it('extracts API key from X-Api-Key header', () => {
      const r = new Request('http://test', {
        headers: { 'x-api-key': 'test-api-key' },
      })
      assert.strictEqual(extractApiKey(r), 'test-api-key')
    })

    it('returns null when no auth header present', () => {
      const r = new Request('http://test')
      assert.strictEqual(extractApiKey(r), null)
    })

    it('validates correct API key', () => {
      process.env.TALOCODE_API_KEY = 'test-api-key'
      const result = validateApiKey('test-api-key')
      assert.strictEqual(result.valid, true)
    })

    it('rejects missing API key', () => {
      const result = validateApiKey(null)
      assert.strictEqual(result.valid, false)
      assert.strictEqual(result.reason, 'missing_api_key')
    })

    it('rejects invalid API key', () => {
      process.env.TALOCODE_API_KEY = 'real-key'
      const result = validateApiKey('wrong-key')
      assert.strictEqual(result.valid, false)
      assert.strictEqual(result.reason, 'invalid_api_key')
    })

    it('accepts test API key in test env', () => {
      process.env.NODE_ENV = 'test'
      const result = validateApiKey('test-api-key')
      assert.strictEqual(result.valid, true)
    })

    it('does not leak API key in error messages', () => {
      const key = 'sk-my-secret-key-12345'
      const result = validateApiKey(key)
      if (!result.valid && result.reason) {
        assert.ok(!result.reason.includes(key), 'Error reason leaked API key')
      }
    })
  })

  describe('billing (mock)', () => {
    it('fails with 401 when API key is missing', async () => {
      const request = new Request('http://test/v1/codra/repo-summary', {
        method: 'POST',
        body: JSON.stringify({ files: [{ path: 'test.ts', content: 'x' }] }),
      })
      const route = findRoute('POST', '/v1/codra/repo-summary')
      assert.ok(route)
      const response = await route!.handler(request)
      assert.strictEqual(response.status, 401)
      const body = await response.json()
      assert.strictEqual(body.error.code, 'missing_api_key')
    })

    it('fails with 401 when API key is invalid', async () => {
      const request = new Request('http://test/v1/codra/repo-summary', {
        method: 'POST',
        headers: { authorization: 'Bearer bad-key' },
        body: JSON.stringify({ files: [{ path: 'test.ts', content: 'x' }] }),
      })
      const route = findRoute('POST', '/v1/codra/repo-summary')
      assert.ok(route)
      const response = await route!.handler(request)
      assert.strictEqual(response.status, 401)
    })
  })

  describe('repo-summary endpoint', () => {
    it('returns 400 when files is empty', async () => {
      const request = new Request('http://test/v1/codra/repo-summary', {
        method: 'POST',
        headers: { authorization: 'Bearer test-api-key' },
        body: JSON.stringify({ files: [] } as RepoSummaryInput),
      })
      const route = findRoute('POST', '/v1/codra/repo-summary')
      assert.ok(route)
      const response = await route!.handler(request)
      assert.strictEqual(response.status, 400)
    })

    it('returns 400 when files is missing', async () => {
      const request = new Request('http://test/v1/codra/repo-summary', {
        method: 'POST',
        headers: { authorization: 'Bearer test-api-key' },
        body: JSON.stringify({}),
      })
      const route = findRoute('POST', '/v1/codra/repo-summary')
      assert.ok(route)
      const response = await route!.handler(request)
      assert.strictEqual(response.status, 400)
    })

    it('returns mock repo-summary with valid input', async () => {
      const input: RepoSummaryInput = {
        files: [
          { path: 'src/index.ts', content: 'console.log("hello");' },
          { path: 'src/utils.ts', content: 'export function add(a: number, b: number) { return a + b; }' },
        ],
        focus: ['architecture', 'risks'],
      }
      const request = new Request('http://test/v1/codra/repo-summary', {
        method: 'POST',
        headers: { authorization: 'Bearer test-api-key' },
        body: JSON.stringify(input),
      })
      const route = findRoute('POST', '/v1/codra/repo-summary')
      assert.ok(route)
      const response = await route!.handler(request)
      assert.strictEqual(response.status, 200)
      const body = await response.json()
      assert.ok(body.id.startsWith('codra_req_'))
      assert.strictEqual(body.object, 'codra.repo_summary')
      assert.ok(body.result.summary)
      assert.ok(Array.isArray(body.result.architecture))
      assert.ok(Array.isArray(body.result.risks))
      assert.ok(Array.isArray(body.result.nextSteps))
      assert.strictEqual(body.usage.credits, 50)
      assert.strictEqual(body.usage.action, 'codra.repo.summary')
    })
  })

  describe('explain endpoint', () => {
    it('returns 400 when language is missing', async () => {
      const request = new Request('http://test/v1/codra/explain', {
        method: 'POST',
        headers: { authorization: 'Bearer test-api-key' },
        body: JSON.stringify({ code: 'x' }),
      })
      const route = findRoute('POST', '/v1/codra/explain')
      assert.ok(route)
      const response = await route!.handler(request)
      assert.strictEqual(response.status, 400)
    })

    it('returns 400 when level is invalid', async () => {
      const request = new Request('http://test/v1/codra/explain', {
        method: 'POST',
        headers: { authorization: 'Bearer test-api-key' },
        body: JSON.stringify({ language: 'ts', code: 'x', level: 'invalid' }),
      })
      const route = findRoute('POST', '/v1/codra/explain')
      assert.ok(route)
      const response = await route!.handler(request)
      assert.strictEqual(response.status, 400)
    })

    it('returns mock explain with valid input', async () => {
      const input: ExplainInput = {
        language: 'typescript',
        code: 'const x = 1;',
        level: 'beginner',
      }
      const request = new Request('http://test/v1/codra/explain', {
        method: 'POST',
        headers: { authorization: 'Bearer test-api-key' },
        body: JSON.stringify(input),
      })
      const route = findRoute('POST', '/v1/codra/explain')
      assert.ok(route)
      const response = await route!.handler(request)
      assert.strictEqual(response.status, 200)
      const body = await response.json()
      assert.strictEqual(body.object, 'codra.explain')
      assert.ok(body.result.explanation)
      assert.ok(Array.isArray(body.result.keyConcepts))
      assert.strictEqual(body.usage.credits, 20)
    })
  })

  describe('review endpoint', () => {
    it('returns 400 when code is missing', async () => {
      const request = new Request('http://test/v1/codra/review', {
        method: 'POST',
        headers: { authorization: 'Bearer test-api-key' },
        body: JSON.stringify({ language: 'ts' }),
      })
      const route = findRoute('POST', '/v1/codra/review')
      assert.ok(route)
      const response = await route!.handler(request)
      assert.strictEqual(response.status, 400)
    })

    it('returns mock review with valid input', async () => {
      const input: ReviewInput = {
        language: 'typescript',
        code: 'function bad(x) { return x }',
        focus: ['bugs', 'types'],
      }
      const request = new Request('http://test/v1/codra/review', {
        method: 'POST',
        headers: { authorization: 'Bearer test-api-key' },
        body: JSON.stringify(input),
      })
      const route = findRoute('POST', '/v1/codra/review')
      assert.ok(route)
      const response = await route!.handler(request)
      assert.strictEqual(response.status, 200)
      const body = await response.json()
      assert.strictEqual(body.object, 'codra.review')
      assert.ok(Array.isArray(body.result.issues))
      assert.strictEqual(body.usage.credits, 40)
    })
  })

  describe('plan endpoint', () => {
    it('returns 400 when task is missing', async () => {
      const request = new Request('http://test/v1/codra/plan', {
        method: 'POST',
        headers: { authorization: 'Bearer test-api-key' },
        body: JSON.stringify({}),
      })
      const route = findRoute('POST', '/v1/codra/plan')
      assert.ok(route)
      const response = await route!.handler(request)
      assert.strictEqual(response.status, 400)
    })

    it('returns mock plan with valid input', async () => {
      const input: PlanInput = {
        task: 'Add Stripe topups',
        context: 'We use Stripe for payments',
        constraints: ['do not break auth'],
      }
      const request = new Request('http://test/v1/codra/plan', {
        method: 'POST',
        headers: { authorization: 'Bearer test-api-key' },
        body: JSON.stringify(input),
      })
      const route = findRoute('POST', '/v1/codra/plan')
      assert.ok(route)
      const response = await route!.handler(request)
      assert.strictEqual(response.status, 200)
      const body = await response.json()
      assert.strictEqual(body.object, 'codra.plan')
      assert.ok(body.result.plan)
      assert.ok(Array.isArray(body.result.steps))
      assert.ok(Array.isArray(body.result.risks))
      assert.strictEqual(body.usage.credits, 40)
    })
  })

  describe('API key not leaked', () => {
    it('does not include raw API key in error responses', async () => {
      const request = new Request('http://test/v1/codra/repo-summary', {
        method: 'POST',
        headers: { authorization: 'Bearer sk-super-secret-key-99999' },
        body: JSON.stringify({ files: [{ path: 't.ts', content: 'x' }] }),
      })
      const route = findRoute('POST', '/v1/codra/repo-summary')
      assert.ok(route)
      const response = await route!.handler(request)
      const body = await response.json()
      const bodyStr = JSON.stringify(body)
      assert.ok(!bodyStr.includes('sk-super-secret-key-99999'), 'API key leaked in response')
    })
  })
})
