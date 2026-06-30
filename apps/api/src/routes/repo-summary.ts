import { handleRoute } from '../middleware/route-handler'
import { createProvider } from '../provider'
import type { RepoSummaryInput, CodraSuccessResponse, RepoSummaryResult } from '../types'

export async function handleRepoSummary(request: Request): Promise<Response> {
  return handleRoute(
    request,
    { action: 'codra.repo.summary', credits: 50 },
    async () => {
      const body: RepoSummaryInput = await request.json().catch(() => ({}))
      if (!body.files || !Array.isArray(body.files) || body.files.length === 0) {
        return Response.json(
          { ok: false, error: { code: 'invalid_request', message: 'files array is required and must not be empty.' } },
          { status: 400 },
        )
      }

      const provider = createProvider()
      const result = await provider.repoSummary(body)

      const response: CodraSuccessResponse<RepoSummaryResult> = {
        id: `codra_req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        object: 'codra.repo_summary',
        result,
        usage: { credits: 50, action: 'codra.repo.summary' },
      }
      return Response.json(response)
    },
  )
}
