import type { BillingAction, BillingResult } from '../types'

function getBaseUrl(): string {
  return (
    process.env.TALOCODE_BASE_URL ??
    process.env.STACKLANE_API_BASE_URL ??
    'https://api.talocode.xyz'
  )
}

export async function chargeCredits(
  apiKey: string,
  input: BillingAction,
): Promise<BillingResult> {
  const url = `${getBaseUrl()}/api/v1/cloud/usage/charge`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(input),
    })

    if (response.status === 401) {
      return {
        success: false,
        error: { code: 'auth_error', message: 'Invalid or missing API key.' },
      }
    }

    if (response.status === 402) {
      const body = await response.json().catch(() => ({}))
      return {
        success: false,
        error: {
          code: 'insufficient_credits',
          message: 'Insufficient Talocode Cloud credits.',
          required: body.required ?? input.credits,
          available: body.available,
        },
      }
    }

    if (!response.ok) {
      return {
        success: false,
        error: {
          code: 'billing_unavailable',
          message: `Billing service returned status ${response.status}.`,
        },
      }
    }

    const body = await response.json()
    return {
      success: true,
      remainingCredits: body.remainingCredits ?? body.data?.remainingCredits,
    }
  } catch (err) {
    return {
      success: false,
      error: {
        code: 'billing_unavailable',
        message:
          err instanceof Error ? err.message : 'Billing service unreachable.',
      },
    }
  }
}
