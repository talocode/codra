export type ProjectType =
  | 'node-typescript'
  | 'nextjs'
  | 'react-vite'
  | 'cli'
  | 'rust'
  | 'tauri'
  | 'remotion-video'
  | 'monorepo'
  | 'unknown';

export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun' | 'unknown';

export interface DetectedStack {
  packageManager: PackageManager;
  projectType: ProjectType;
  hasTypeScript: boolean;
  hasReact: boolean;
  hasTests: boolean;
  hasLint: boolean;
  hasTypecheck: boolean;
  hasBuild: boolean;
  hasDocs: boolean;
  hasCodraMd: boolean;
  hasAgentsMd: boolean;
  hasReadme: boolean;
  hasCopilotInstructions: boolean;
  hasEnvFiles: boolean;
  hasSupabase: boolean;
  hasNetlify: boolean;
  hasVercel: boolean;
  hasWorkspaces: boolean;
  hasRemotion: boolean;
  hasTauri: boolean;
  detectedFrameworks: string[];
}

export interface SetupRecommendation {
  projectType: ProjectType;
  detectedStack: DetectedStack;
  confidence: number;
  recommendedSkills: string[];
  recommendedCommands: string[];
  recommendedContextFiles: string[];
  recommendedHooks: string[];
  recommendedMcpTools: string[];
  recommendedPermissionLevel: string;
  recommendedValidation: string[];
  risks: string[];
  nextSteps: string[];
}

export interface SetupReport {
  version: string;
  analyzedAt: string;
  cwd: string;
  stack: DetectedStack;
  recommendation: SetupRecommendation;
}
