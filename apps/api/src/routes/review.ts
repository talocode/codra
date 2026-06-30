import { handleRoute } from '../middleware/route-handler'
import { createProvider } from '../provider'
import type { ReviewInput, CodraSuccessResponse, ReviewResult } from '../types'

export async function handleReview(request: Request): Promise<Response> {
  return handleRoute(
    request,
    { action: 'codra.review', credits: 40 },
    async () => {
      const body: ReviewInput = await request.json().catch(() => ({}))
      if (!body.language || !body.code) {
        return Response.json(
          { ok: false, error: { code: 'invalid_request', message: 'language and code are required.' } },
          { status: 400 },
        )
      }

      const provider = createProvider()
      const result = await provider.review(body)

      const response: CodraSuccessResponse<ReviewResult> = {
        id: `codra_req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        object: 'codra.review',
        result,
        usage: { credits: 40, action: 'codra.review' },
      }
      return Response.json(response)
    },
  )
}
