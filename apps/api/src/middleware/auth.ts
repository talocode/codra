import type { AuthResult } from '../types'

export function extractApiKey(request: Request): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }
  const xApiKey = request.headers.get('x-api-key')
  if (xApiKey) {
    return xApiKey
  }
  return null
}

export function validateApiKey(incomingKey: string | null): AuthResult {
  if (!incomingKey) {
    return { valid: false, reason: 'missing_api_key' }
  }

  const configuredKey = process.env.TALOCODE_API_KEY

  if (configuredKey && incomingKey === configuredKey) {
    return { valid: true }
  }

  if (process.env.NODE_ENV === 'test' && incomingKey === 'test-api-key') {
    return { valid: true }
  }

  return { valid: false, reason: 'invalid_api_key' }
}
