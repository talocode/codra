import * as fs from 'fs';
import * as path from 'path';
import { loadSkillsConfig } from './config.js';

interface ActiveSkill {
  name: string;
  content: string;
}

let activeSkills: ActiveSkill[] = [];

export function setActiveSkill(name: string, content: string): void {
  const config = loadSkillsConfig();
  activeSkills = activeSkills.filter(s => s.name !== name);
  activeSkills.push({ name, content });
  
  // Enforce max active skills limit
  while (activeSkills.length > config.maxActiveSkills) {
    activeSkills.shift();
  }
}

export function getActiveSkill(): { name: string; content: string } | null {
  return activeSkills.length > 0 ? activeSkills[0] : null;
}

export function getActiveSkills(): { name: string; content: string }[] {
  return [...activeSkills];
}

export function clearActiveSkill(): void {
  activeSkills = [];
}

export function removeActiveSkill(name: string): void {
  activeSkills = activeSkills.filter(s => s.name !== name);
}

export function getActiveSkillContext(maxChars?: number): string {
  if (activeSkills.length === 0) return '';
  
  const config = loadSkillsConfig();
  const limit = maxChars ?? config.maxSkillContextChars;
  const parts: string[] = [];
  let totalChars = 0;
  
  for (const skill of activeSkills) {
    if (totalChars >= limit) break;
    
    const truncated = skill.content.substring(0, limit - totalChars);
    parts.push(`## ${skill.name}\n\n${truncated}`);
    totalChars += truncated.length;
  }
  
  return parts.join('\n\n');
}
