import { handleRoute } from '../middleware/route-handler'
import { createProvider } from '../provider'
import type { PlanInput, CodraSuccessResponse, PlanResult } from '../types'

export async function handlePlan(request: Request): Promise<Response> {
  return handleRoute(
    request,
    { action: 'codra.plan', credits: 40 },
    async () => {
      const body: PlanInput = await request.json().catch(() => ({}))
      if (!body.task) {
        return Response.json(
          { ok: false, error: { code: 'invalid_request', message: 'task is required.' } },
          { status: 400 },
        )
      }

      const provider = createProvider()
      const result = await provider.plan(body)

      const response: CodraSuccessResponse<PlanResult> = {
        id: `codra_req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        object: 'codra.plan',
        result,
        usage: { credits: 40, action: 'codra.plan' },
      }
      return Response.json(response)
    },
  )
}
