export interface CodraFileInput {
  path: string
  content: string
}

export interface RepoSummaryInput {
  files: CodraFileInput[]
  focus?: string[]
}

export interface RepoSummaryResult {
  summary: string
  architecture: string[]
  risks: string[]
  nextSteps: string[]
}

export interface ExplainInput {
  language: string
  code: string
  level?: 'beginner' | 'intermediate' | 'expert'
}

export interface ExplainResult {
  explanation: string
  keyConcepts: string[]
  suggestions?: string[]
}

export interface ReviewInput {
  language: string
  code: string
  focus?: string[]
  strictness?: 'gentle' | 'normal' | 'strict'
}

export interface ReviewResult {
  issues: ReviewIssue[]
  summary: string
  score: number
}

export interface ReviewIssue {
  severity: 'critical' | 'warning' | 'info'
  category: string
  title: string
  description: string
  line?: number
  suggestion?: string
}

export interface PlanInput {
  task: string
  context?: string
  constraints?: string[]
}

export interface PlanResult {
  plan: string
  steps: PlanStep[]
  risks: string[]
  estimatedEffort: string
}

export interface PlanStep {
  order: number
  title: string
  description: string
  files?: string[]
  effort: 'small' | 'medium' | 'large'
}

export interface CodraSuccessResponse<T> {
  id: string
  object: string
  result: T
  usage: {
    credits: number
    action: string
  }
}

export interface CodraErrorResponse {
  ok: false
  error: {
    code: string
    message: string
    required?: number
    available?: number
  }
}

export interface BillingAction {
  product: string
  action: string
  credits: number
  requestId: string
  idempotencyKey?: string
  metadata?: Record<string, unknown>
}

export interface BillingResult {
  success: boolean
  remainingCredits?: number
  error?: {
    code: string
    message: string
    required?: number
    available?: number
  }
}

export interface AuthResult {
  valid: boolean
  reason?: string
}
