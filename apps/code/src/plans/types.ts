export type PlanStatus = 'draft' | 'approved' | 'rejected' | 'running' | 'completed' | 'failed';
export type StepType = 'inspect' | 'edit' | 'command' | 'test' | 'docs' | 'release' | 'manual';
export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface PlanStep {
  id: string;
  title: string;
  description: string;
  type: StepType;
  status: StepStatus;
  requiresApproval: boolean;
  relatedFiles: string[];
  command?: string;
  expectedOutput?: string;
  riskLevel: RiskLevel;
}

export interface Plan {
  id: string;
  title: string;
  userTask: string;
  status: PlanStatus;
  createdAt: string;
  updatedAt: string;
  provider: string;
  model: string;
  activeSkill: string | null;
  projectPath: string;
  steps: PlanStep[];
  risks: string[];
  filesToInspect: string[];
  filesToModify: string[];
  commandsToRun: string[];
  validation: string[];
  notes: string[];
}
