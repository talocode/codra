import * as fs from 'fs';
import * as path from 'path';
function fileExists(p) {
    try {
        return fs.existsSync(p);
    }
    catch {
        return false;
    }
}
function readJsonSafe(p) {
    try {
        return JSON.parse(fs.readFileSync(p, 'utf-8'));
    }
    catch {
        return null;
    }
}
function detectPackageManager(cwd) {
    if (fileExists(path.join(cwd, 'pnpm-lock.yaml')))
        return 'pnpm';
    if (fileExists(path.join(cwd, 'yarn.lock')))
        return 'yarn';
    if (fileExists(path.join(cwd, 'bun.lockb')) || fileExists(path.join(cwd, 'bun.lock')))
        return 'bun';
    if (fileExists(path.join(cwd, 'package-lock.json')))
        return 'npm';
    return 'unknown';
}
function detectProjectType(cwd, pkg) {
    const deps = { ...(pkg?.dependencies || {}), ...(pkg?.devDependencies || {}) };
    const depNames = Object.keys(deps);
    if (fileExists(path.join(cwd, 'Cargo.toml')) && !fileExists(path.join(cwd, 'package.json')))
        return 'rust';
    if (fileExists(path.join(cwd, 'src-tauri')))
        return 'tauri';
    if (depNames.includes('remotion') || depNames.includes('@remotion/cli'))
        return 'remotion-video';
    if (depNames.includes('next'))
        return 'nextjs';
    if (depNames.includes('vite') && depNames.includes('react'))
        return 'react-vite';
    if (depNames.includes('react') && depNames.includes('react-dom'))
        return 'node-typescript';
    const scripts = pkg?.scripts || {};
    if (scripts.bin || pkg?.bin)
        return 'cli';
    if (fileExists(path.join(cwd, 'pnpm-workspace.yaml')) || fileExists(path.join(cwd, 'lerna.json')))
        return 'monorepo';
    if (pkg?.bin || scripts.start?.includes('node') || scripts.start?.includes('tsx'))
        return 'cli';
    if (fileExists(path.join(cwd, 'Cargo.toml')))
        return 'rust';
    if (fileExists(path.join(cwd, 'tsconfig.json')))
        return 'node-typescript';
    return 'unknown';
}
export function analyzeProject(cwd) {
    const pkg = readJsonSafe(path.join(cwd, 'package.json'));
    const scripts = pkg?.scripts || {};
    const deps = { ...(pkg?.dependencies || {}), ...(pkg?.devDependencies || {}) };
    const depNames = Object.keys(deps);
    const projectType = detectProjectType(cwd, pkg);
    const packageManager = detectPackageManager(cwd);
    return {
        packageManager,
        projectType,
        hasTypeScript: fileExists(path.join(cwd, 'tsconfig.json')),
        hasReact: depNames.includes('react'),
        hasTests: !!scripts.test,
        hasLint: !!scripts.lint,
        hasTypecheck: !!(scripts.typecheck || scripts['type-check'] || scripts.tsc),
        hasBuild: !!scripts.build,
        hasDocs: fileExists(path.join(cwd, 'docs')) || fileExists(path.join(cwd, 'README.md')),
        hasCodraMd: fileExists(path.join(cwd, 'CODRA.md')),
        hasAgentsMd: fileExists(path.join(cwd, 'AGENTS.md')),
        hasReadme: fileExists(path.join(cwd, 'README.md')),
        hasCopilotInstructions: fileExists(path.join(cwd, '.github', 'copilot-instructions.md')),
        hasEnvFiles: fileExists(path.join(cwd, '.env')) || fileExists(path.join(cwd, '.env.example')),
        hasSupabase: depNames.includes('@supabase/supabase-js') || fileExists(path.join(cwd, 'supabase')),
        hasNetlify: fileExists(path.join(cwd, 'netlify.toml')),
        hasVercel: fileExists(path.join(cwd, 'vercel.json')),
        hasWorkspaces: !!fileExists(path.join(cwd, 'pnpm-workspace.yaml')) || !!(pkg?.workspaces),
        hasRemotion: depNames.includes('remotion') || depNames.includes('@remotion/cli'),
        hasTauri: fileExists(path.join(cwd, 'src-tauri')),
        detectedFrameworks: depNames.filter(d => ['next', 'react', 'remotion', 'express', 'fastify', 'hono', 'nuxt', 'svelte', 'vue', 'tailwindcss'].includes(d))
    };
}
