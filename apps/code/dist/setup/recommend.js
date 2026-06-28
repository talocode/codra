const SKILL_MAP = {
    'debug': ['talocode-codebase-search', 'talocode-systematic-debugging', 'talocode-context-engineering'],
    'frontend': ['talocode-product-design', 'talocode-theme-system'],
    'video': ['talocode-video', 'talocode-generative-visuals', 'talocode-theme-system'],
    'cli': ['talocode-agent-workflows', 'talocode-codebase-search', 'talocode-context-engineering'],
    'planning': ['talocode-visual-artifact', 'talocode-agent-workflows'],
    'release': ['talocode-release', 'talocode-open-source-positioning', 'talocode-github-sponsors'],
    'agent': ['talocode-agent-workflows', 'talocode-codebase-search'],
};
function getProjectSkillCategories(stack) {
    const cats = [];
    if (stack.projectType === 'nextjs' || stack.projectType === 'react-vite' || stack.hasReact)
        cats.push('frontend');
    if (stack.projectType === 'cli' || stack.projectType === 'rust')
        cats.push('cli');
    if (stack.projectType === 'remotion-video')
        cats.push('video');
    if (stack.projectType === 'tauri')
        cats.push('cli', 'frontend');
    if (stack.hasTests || stack.hasLint)
        cats.push('debug');
    cats.push('planning');
    if (stack.projectType !== 'unknown')
        cats.push('release');
    return [...new Set(cats)];
}
function getConfidence(stack) {
    let score = 0;
    if (stack.projectType !== 'unknown')
        score += 30;
    if (stack.packageManager !== 'unknown')
        score += 15;
    if (stack.hasTypeScript)
        score += 10;
    if (stack.hasBuild)
        score += 10;
    if (stack.hasTests)
        score += 10;
    if (stack.hasReadme)
        score += 5;
    if (stack.detectedFrameworks.length > 0)
        score += 10;
    if (stack.hasWorkspaces)
        score += 5;
    return Math.min(score, 100);
}
function getRecommendedValidation(stack) {
    const cmds = [];
    if (stack.hasBuild)
        cmds.push('npm run build');
    if (stack.hasLint)
        cmds.push('npm run lint');
    if (stack.hasTypecheck)
        cmds.push('npm run typecheck');
    if (stack.hasTests)
        cmds.push('npm test');
    if (stack.packageManager === 'pnpm')
        cmds.unshift('pnpm install');
    else
        cmds.unshift('npm install');
    return cmds;
}
function getRisks(stack) {
    const risks = [];
    if (!stack.hasCodraMd && !stack.hasAgentsMd)
        risks.push('No CODRA.md or AGENTS.md found — agent may lack project context');
    if (!stack.hasBuild)
        risks.push('No build script detected — unable to verify compilation');
    if (!stack.hasTests)
        risks.push('No test script detected — unable to verify correctness');
    if (!stack.hasReadme)
        risks.push('No README.md found — project documentation missing');
    if (stack.hasEnvFiles && !stack.hasCodraMd)
        risks.push('Env files present but no project instructions — ensure secrets are protected');
    return risks;
}
function getNextSteps(stack) {
    const steps = [];
    if (!stack.hasCodraMd)
        steps.push('Create a CODRA.md file with project-specific instructions for the agent');
    if (!stack.hasAgentsMd)
        steps.push('Consider adding AGENTS.md for cross-project agent guidance');
    if (!stack.hasTests)
        steps.push('Add tests to enable safe agent-driven code changes');
    if (!stack.hasLint)
        steps.push('Add linting for consistent code quality');
    if (!stack.hasBuild)
        steps.push('Add a build script to enable build verification');
    steps.push('Run /skills to activate recommended skills');
    return steps;
}
function getPermissionLevel(stack) {
    if (stack.projectType === 'cli' || stack.projectType === 'rust')
        return 'confirm-commands';
    if (stack.hasTests && stack.hasLint)
        return 'confirm-edits';
    return 'confirm-edits';
}
function getHooks(stack) {
    const hooks = [];
    if (stack.hasBuild)
        hooks.push('pre-commit: run build verification');
    if (stack.hasLint)
        hooks.push('pre-commit: run lint check');
    if (stack.hasTests)
        hooks.push('pre-push: run test suite');
    return hooks;
}
function getContextFiles(stack) {
    const files = [];
    if (!stack.hasCodraMd)
        files.push('CODRA.md — project instructions for the agent');
    if (!stack.hasAgentsMd)
        files.push('AGENTS.md — cross-project agent rules');
    if (stack.hasReadme)
        files.push('README.md — already exists, will be used as context');
    if (stack.hasEnvFiles)
        files.push('.env.example — reference for required env vars (never read .env directly)');
    return files;
}
function getMcpTools(stack) {
    const tools = [];
    if (stack.hasSupabase)
        tools.push('supabase — database management and migrations');
    if (stack.hasNetlify)
        tools.push('netlify — deployment management');
    if (stack.projectType === 'tauri')
        tools.push('tauri — desktop build and dev');
    return tools;
}
export function generateRecommendations(stack) {
    const categories = getProjectSkillCategories(stack);
    const skills = [];
    for (const cat of categories) {
        for (const skill of SKILL_MAP[cat] || []) {
            if (!skills.includes(skill))
                skills.push(skill);
        }
    }
    const commands = ['/skills', '/plan', '/status', '/doctor', '/context'];
    if (stack.hasTests)
        commands.push('/run npm test');
    return {
        projectType: stack.projectType,
        detectedStack: stack,
        confidence: getConfidence(stack),
        recommendedSkills: skills,
        recommendedCommands: commands,
        recommendedContextFiles: getContextFiles(stack),
        recommendedHooks: getHooks(stack),
        recommendedMcpTools: getMcpTools(stack),
        recommendedPermissionLevel: getPermissionLevel(stack),
        recommendedValidation: getRecommendedValidation(stack),
        risks: getRisks(stack),
        nextSteps: getNextSteps(stack)
    };
}
