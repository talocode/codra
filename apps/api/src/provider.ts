import type {
  RepoSummaryInput,
  RepoSummaryResult,
  ExplainInput,
  ExplainResult,
  ReviewInput,
  ReviewResult,
  PlanInput,
  PlanResult,
} from './types'

export interface CodraProvider {
  repoSummary(input: RepoSummaryInput): Promise<RepoSummaryResult>
  explain(input: ExplainInput): Promise<ExplainResult>
  review(input: ReviewInput): Promise<ReviewResult>
  plan(input: PlanInput): Promise<PlanResult>
}

class MockProvider implements CodraProvider {
  async repoSummary(input: RepoSummaryInput): Promise<RepoSummaryResult> {
    const fileCount = input.files.length
    const languages = new Set(input.files.map(f => f.path.split('.').pop() ?? 'unknown'))

    return {
      summary: `Mock analysis of ${fileCount} file(s) across ${languages.size} language(s).`,
      architecture: [
        `${fileCount} source file(s) detected`,
        `Languages: ${[...languages].join(', ')}`,
        'No framework detected (mock)',
      ],
      risks: ['Mock: no real analysis performed'],
      nextSteps: [
        'Set CODRA_CLOUD_MOCK=false and configure a real provider',
        'Review architecture documentation',
      ],
    }
  }

  async explain(input: ExplainInput): Promise<ExplainResult> {
    return {
      explanation: `Mock explanation for ${input.language} code at ${input.level ?? 'intermediate'} level.`,
      keyConcepts: ['Mock concept 1', 'Mock concept 2'],
      suggestions: ['Configure a real provider for accurate analysis'],
    }
  }

  async review(input: ReviewInput): Promise<ReviewResult> {
    return {
      issues: [
        {
          severity: 'info',
          category: 'mock',
          title: 'Mock review only',
          description:
            'This is a mock review result. Set CODRA_CLOUD_MOCK=false and configure a real provider.',
          line: 1,
        },
      ],
      summary: `Mock review of ${input.language} code with focus on: ${(input.focus ?? ['general']).join(', ')}`,
      score: 50,
    }
  }

  async plan(input: PlanInput): Promise<PlanResult> {
    return {
      plan: `Mock plan for: ${input.task}`,
      steps: [
        {
          order: 1,
          title: 'Analysis',
          description: 'Analyze requirements (mock)',
          effort: 'small',
        },
        {
          order: 2,
          title: 'Implementation',
          description: `Implement: ${input.task}`,
          effort: 'medium',
        },
        {
          order: 3,
          title: 'Review',
          description: 'Review and validate changes',
          effort: 'small',
        },
      ],
      risks: ['Mock: no real planning performed'],
      estimatedEffort: 'medium',
    }
  }
}

class ProductionProvider implements CodraProvider {
  async repoSummary(_input: RepoSummaryInput): Promise<RepoSummaryResult> {
    throw new Error('Production provider not yet implemented')
  }

  async explain(_input: ExplainInput): Promise<ExplainResult> {
    throw new Error('Production provider not yet implemented')
  }

  async review(_input: ReviewInput): Promise<ReviewResult> {
    throw new Error('Production provider not yet implemented')
  }

  async plan(_input: PlanInput): Promise<PlanResult> {
    throw new Error('Production provider not yet implemented')
  }
}

export function createProvider(): CodraProvider {
  const mockEnabled = process.env.CODRA_CLOUD_MOCK === 'true'
  if (mockEnabled) {
    return new MockProvider()
  }
  return new ProductionProvider()
}
