import * as fs from 'fs';
import * as path from 'path';

const CONTEXT_FILES = [
  'CODRA.md',
  '.codra/instructions.md',
  'AGENTS.md',
  '.cursor/rules',
  '.github/copilot-instructions.md'
];

export function loadProjectInstructions(): string[] {
  const loaded: string[] = [];
  
  for (const file of CONTEXT_FILES) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        if (content.trim().length > 0) {
          loaded.push(file);
        }
      } catch {
        // Skip unreadable files
      }
    }
  }
  
  return loaded;
}

export function getProjectInstructions(): string {
  const files = loadProjectInstructions();
  const instructions: string[] = [];
  
  for (const file of files) {
    const filePath = path.join(process.cwd(), file);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      instructions.push(`## ${file}\n\n${content}`);
    } catch {
      // Skip unreadable files
    }
  }
  
  return instructions.join('\n\n');
}
