import { handleRoute } from '../middleware/route-handler'
import { createProvider } from '../provider'
import type { ExplainInput, CodraSuccessResponse, ExplainResult } from '../types'

export async function handleExplain(request: Request): Promise<Response> {
  return handleRoute(
    request,
    { action: 'codra.explain', credits: 20 },
    async () => {
      const body: ExplainInput = await request.json().catch(() => ({}))
      if (!body.language || !body.code) {
        return Response.json(
          { ok: false, error: { code: 'invalid_request', message: 'language and code are required.' } },
          { status: 400 },
        )
      }

      const validLevels = ['beginner', 'intermediate', 'expert']
      if (body.level && !validLevels.includes(body.level)) {
        return Response.json(
          { ok: false, error: { code: 'invalid_request', message: `level must be one of: ${validLevels.join(', ')}` } },
          { status: 400 },
        )
      }

      const provider = createProvider()
      const result = await provider.explain(body)

      const response: CodraSuccessResponse<ExplainResult> = {
        id: `codra_req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        object: 'codra.explain',
        result,
        usage: { credits: 20, action: 'codra.explain' },
      }
      return Response.json(response)
    },
  )
}
