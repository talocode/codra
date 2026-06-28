import { getPlan } from '../plans/store.js';
import { getConfig } from '../config.js';
import { getActiveSkill } from '../skills/active.js';
export function createVisualPlanFromTask(task) {
    const config = getConfig();
    const activeSkill = getActiveSkill();
    const sections = [
        {
            id: generateId(),
            title: 'Task Summary',
            type: 'summary',
            content: task,
            priority: 'high'
        },
        {
            id: generateId(),
            title: 'Implementation Steps',
            type: 'steps',
            content: '1. Inspect current project structure\n2. Identify files to modify\n3. Implement changes\n4. Run validation\n5. Test changes',
            priority: 'high'
        },
        {
            id: generateId(),
            title: 'Files to Inspect',
            type: 'files',
            content: 'Review existing codebase before making changes.',
            priority: 'medium'
        },
        {
            id: generateId(),
            title: 'Risk Assessment',
            type: 'risks',
            content: '- Potential breaking changes\n- File modifications may affect other code\n- Changes should be tested before merge',
            priority: 'medium'
        },
        {
            id: generateId(),
            title: 'Validation Checklist',
            type: 'validation',
            content: '- Run build commands\n- Run tests if available\n- Verify file syntax\n- Check for errors',
            priority: 'medium'
        }
    ];
    return {
        id: generateId(),
        planId: '',
        title: task,
        summary: `Visual plan for: ${task}`,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        projectPath: process.cwd(),
        sections,
        files: [],
        risks: ['Potential breaking changes', 'File modifications may affect other code'],
        validation: ['Run build', 'Run tests'],
        diagrams: [],
        reviewQuestions: [
            'Are there any edge cases to consider?',
            'Will this change affect other parts of the codebase?',
            'Are there any dependencies that need to be updated?'
        ],
        comments: [],
        approval: { status: 'pending' }
    };
}
export function createVisualPlanFromPlanId(planId) {
    const plan = getPlan(planId);
    if (!plan)
        return null;
    const sections = [
        {
            id: generateId(),
            title: 'Task Summary',
            type: 'summary',
            content: plan.userTask,
            priority: 'high'
        },
        {
            id: generateId(),
            title: 'Implementation Steps',
            type: 'steps',
            content: plan.steps.map((s, i) => `${i + 1}. ${s.title}: ${s.description}`).join('\n'),
            priority: 'high'
        },
        {
            id: generateId(),
            title: 'Files to Inspect',
            type: 'files',
            content: plan.filesToInspect.length > 0 ? plan.filesToInspect.join('\n') : 'No files specified',
            priority: 'medium'
        },
        {
            id: generateId(),
            title: 'Risk Assessment',
            type: 'risks',
            content: plan.risks.join('\n'),
            priority: 'medium'
        },
        {
            id: generateId(),
            title: 'Validation Checklist',
            type: 'validation',
            content: plan.validation.join('\n'),
            priority: 'medium'
        }
    ];
    return {
        id: generateId(),
        planId: planId,
        title: plan.title,
        summary: plan.userTask,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        projectPath: process.cwd(),
        sections,
        files: plan.filesToModify.map(f => ({
            path: f,
            action: 'modify',
            reason: 'Planned modification',
            riskLevel: 'medium',
            relatedSteps: []
        })),
        risks: plan.risks,
        validation: plan.validation,
        diagrams: [],
        reviewQuestions: [
            'Are there any edge cases to consider?',
            'Will this change affect other parts of the codebase?',
            'Are there any dependencies that need to be updated?'
        ],
        comments: [],
        approval: { status: 'pending' }
    };
}
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
