import { getConfig } from '../config.js';
import { getActiveSkill } from '../skills/active.js';
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
export function createPlan(task) {
    const config = getConfig();
    const activeSkill = getActiveSkill();
    const steps = [
        {
            id: generateId(),
            title: 'Inspect project structure',
            description: 'Read current project files and understand the codebase',
            type: 'inspect',
            status: 'pending',
            requiresApproval: false,
            relatedFiles: [],
            riskLevel: 'low'
        },
        {
            id: generateId(),
            title: 'Implement changes',
            description: `Implement the requested task: ${task}`,
            type: 'edit',
            status: 'pending',
            requiresApproval: true,
            relatedFiles: [],
            riskLevel: 'medium'
        },
        {
            id: generateId(),
            title: 'Validate changes',
            description: 'Run validation commands to verify the changes',
            type: 'test',
            status: 'pending',
            requiresApproval: false,
            relatedFiles: [],
            command: 'npm run build',
            riskLevel: 'low'
        }
    ];
    return {
        id: generateId(),
        title: task,
        userTask: task,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        provider: config.provider,
        model: config.model,
        activeSkill: activeSkill?.name || null,
        projectPath: process.cwd(),
        steps,
        risks: ['Potential breaking changes', 'File modifications may affect other code'],
        filesToInspect: [],
        filesToModify: [],
        commandsToRun: [],
        validation: ['Run build', 'Run tests if available'],
        notes: []
    };
}
