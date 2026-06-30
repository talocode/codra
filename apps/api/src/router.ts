import { handleRepoSummary } from './routes/repo-summary'
import { handleExplain } from './routes/explain'
import { handleReview } from './routes/review'
import { handlePlan } from './routes/plan'

export interface RouteMatch {
  handler: (request: Request) => Promise<Response>
}

export interface RouterEntry {
  method: string
  pattern: RegExp
  handler: (request: Request) => Promise<Response>
}

const routes: RouterEntry[] = [
  { method: 'POST', pattern: /^\/v1\/codra\/repo-summary$/, handler: handleRepoSummary },
  { method: 'POST', pattern: /^\/v1\/codra\/explain$/, handler: handleExplain },
  { method: 'POST', pattern: /^\/v1\/codra\/review$/, handler: handleReview },
  { method: 'POST', pattern: /^\/v1\/codra\/plan$/, handler: handlePlan },
  { method: 'POST', pattern: /^\/api\/v1\/codra\/repo-summary$/, handler: handleRepoSummary },
  { method: 'POST', pattern: /^\/api\/v1\/codra\/explain$/, handler: handleExplain },
  { method: 'POST', pattern: /^\/api\/v1\/codra\/review$/, handler: handleReview },
  { method: 'POST', pattern: /^\/api\/v1\/codra\/plan$/, handler: handlePlan },
  { method: 'GET', pattern: /^\/health$/, handler: async () => Response.json({ status: 'ok', service: 'codra-cloud', version: '0.1.0' }) },
  { method: 'GET', pattern: /^\/v1\/codra\/health$/, handler: async () => Response.json({ status: 'ok', service: 'codra-cloud', version: '0.1.0' }) },
]

export function findRoute(method: string, pathname: string): RouteMatch | null {
  for (const route of routes) {
    if (route.method === method && route.pattern.test(pathname)) {
      return { handler: route.handler }
    }
  }
  return null
}

export function handleNotFound(): Response {
  return Response.json(
    { ok: false, error: { code: 'not_found', message: `Route not found.` } },
    { status: 404 },
  )
}
