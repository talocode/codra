export type VisualPlanStatus = 'draft' | 'reviewed' | 'approved' | 'rejected' | 'stale';
export type SectionType = 'summary' | 'steps' | 'files' | 'risks' | 'validation' | 'diagram' | 'wireframe' | 'questions' | 'notes';
export type Priority = 'low' | 'medium' | 'high';
export type FileAction = 'inspect' | 'create' | 'modify' | 'delete' | 'rename';
export type DiagramType = 'flow' | 'dependency' | 'file-map' | 'sequence' | 'ui-wireframe';

export interface VisualPlanSection {
  id: string;
  title: string;
  type: SectionType;
  content: string;
  priority: Priority;
}

export interface FileImpact {
  path: string;
  action: FileAction;
  reason: string;
  riskLevel: Priority;
  relatedSteps: string[];
}

export interface VisualPlanDiagram {
  id: string;
  type: DiagramType;
  title: string;
  sourceFormat: 'mermaid' | 'ascii' | 'html';
  source: string;
}

export interface VisualPlan {
  id: string;
  planId: string;
  threadId?: string;
  title: string;
  summary: string;
  status: VisualPlanStatus;
  createdAt: string;
  updatedAt: string;
  projectPath: string;
  sections: VisualPlanSection[];
  files: FileImpact[];
  risks: string[];
  validation: string[];
  diagrams: VisualPlanDiagram[];
  wireframes?: string[];
  reviewQuestions: string[];
  comments: string[];
  approval: {
    status: 'pending' | 'approved' | 'rejected';
    approvedBy?: string;
    approvedAt?: string;
    notes?: string;
  };
}
