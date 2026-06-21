import { SkillMetadata, discoverSkills } from './discovery.js';

const TASK_SKILL_MAP: Record<string, string[]> = {
  // Debugging
  'debug': ['talocode-codebase-search', 'talocode-systematic-debugging', 'talocode-context-engineering'],
  'fix': ['talocode-codebase-search', 'talocode-systematic-debugging'],
  'error': ['talocode-systematic-debugging', 'talocode-codebase-search'],
  'bug': ['talocode-systematic-debugging', 'talocode-codebase-search'],
  'html instead of json': ['talocode-systematic-debugging', 'talocode-codebase-search'],
  'api returning': ['talocode-systematic-debugging', 'talocode-codebase-search'],
  
  // UI Design
  'design': ['talocode-product-design', 'talocode-theme-system'],
  'ui': ['talocode-product-design', 'talocode-theme-system'],
  'interface': ['talocode-product-design', 'talocode-theme-system'],
  'landing page': ['talocode-product-design', 'talocode-theme-system'],
  'dashboard': ['talocode-product-design', 'talocode-theme-system'],
  'new tab': ['talocode-product-design', 'talocode-theme-system'],
  
  // Video
  'video': ['talocode-video', 'talocode-generative-visuals', 'talocode-theme-system'],
  'launch video': ['talocode-video', 'talocode-generative-visuals'],
  'demo video': ['talocode-video'],
  'clip': ['talocode-video', 'talocode-generative-visuals'],
  
  // Visual Plans/Artifacts
  'visual plan': ['talocode-visual-artifact', 'talocode-agent-workflows'],
  'artifact': ['talocode-visual-artifact'],
  'review': ['talocode-visual-artifact', 'talocode-agent-workflows'],
  
  // Skill Creation
  'create skill': ['talocode-skill-creator', 'talocode-agent-workflows'],
  'new skill': ['talocode-skill-creator'],
  
  // Release/Workflow
  'release': ['talocode-agent-workflows', 'talocode-release'],
  'deploy': ['talocode-agent-workflows', 'talocode-production-deploy'],
  'pr': ['talocode-agent-workflows'],
  
  // Search/Refactor
  'search': ['talocode-codebase-search'],
  'find': ['talocode-codebase-search'],
  'refactor': ['talocode-codebase-search', 'talocode-context-engineering'],
  
  // Context
  'long session': ['talocode-context-engineering'],
  'context': ['talocode-context-engineering'],
  
  // Theme
  'theme': ['talocode-theme-system'],
  'color': ['talocode-theme-system'],
  
  // Partnership
  'partnership': ['talocode-partnership-branding', 'talocode-theme-system'],
  'collaboration': ['talocode-partnership-branding']
};

export function recommendSkills(task: string): string[] {
  const taskLower = task.toLowerCase();
  const recommended: Set<string> = new Set();
  
  // Check for direct matches
  for (const [pattern, skills] of Object.entries(TASK_SKILL_MAP)) {
    if (taskLower.includes(pattern)) {
      skills.forEach(s => recommended.add(s));
    }
  }
  
  // If no matches, provide general recommendations
  if (recommended.size === 0) {
    recommended.add('talocode-agent-workflows');
    recommended.add('talocode-codebase-search');
  }
  
  return Array.from(recommended).slice(0, 5);
}
