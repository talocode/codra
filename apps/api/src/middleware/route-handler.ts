import { extractApiKey, validateApiKey } from './auth'
import { chargeCredits } from './billing'

export interface RouteHandlerOptions {
  action: string
  credits: number
  getRequestId?: () => string
}

const defaultGetRequestId = () =>
  `codra_req_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

export async function handleRoute(
  request: Request,
  options: RouteHandlerOptions,
  execute: () => Promise<Response>,
): Promise<Response> {
  const apiKey = extractApiKey(request)
  const auth = validateApiKey(apiKey)
  const getRequestId = options.getRequestId ?? defaultGetRequestId

  if (!auth.valid) {
    const status = 401
    return Response.json(
      {
        ok: false,
        error: {
          code: auth.reason,
          message:
            auth.reason === 'missing_api_key'
              ? 'Missing Talocode Cloud API key. Provide via Authorization: Bearer header or X-Api-Key header.'
              : 'Invalid API key.',
        },
      },
      { status },
    )
  }

  if (!apiKey) {
    return Response.json(
      { ok: false, error: { code: 'missing_api_key', message: 'Missing API key.' } },
      { status: 401 },
    )
  }

  const requestId = getRequestId()

  if (process.env.CODRA_CLOUD_MOCK === 'true') {
    return execute()
  }

  const chargeResult = await chargeCredits(apiKey, {
    product: 'codra',
    action: options.action,
    credits: options.credits,
    requestId,
    idempotencyKey: requestId,
    metadata: {
      route: `/v1/codra/${options.action.replace('.', '/')}`,
    },
  })

  if (!chargeResult.success) {
    const err = chargeResult.error!
    const status =
      err.code === 'insufficient_credits' ? 402 : err.code === 'auth_error' ? 401 : 502
    return Response.json({ ok: false, error: err }, { status })
  }

  return execute()
}
