export type ThreadStatus = 'active' | 'archived';
export interface Thread {
    id: string;
    title: string;
    projectPath: string;
    status: ThreadStatus;
    createdAt: string;
    updatedAt: string;
    messageCount: number;
    toolCallCount: number;
    activeProvider: string;
    activeModel: string;
    activeSkill: string | null;
    linkedPlanId: string | null;
    loadedInstructionFiles: string[];
}
