import * as fs from 'fs';
import * as path from 'path';

let activeSkillName: string | null = null;
let activeSkillContent: string | null = null;

export function setActiveSkill(name: string, content: string): void {
  activeSkillName = name;
  activeSkillContent = content;
}

export function getActiveSkill(): { name: string; content: string } | null {
  if (activeSkillName && activeSkillContent) {
    return { name: activeSkillName, content: activeSkillContent };
  }
  return null;
}

export function clearActiveSkill(): void {
  activeSkillName = null;
  activeSkillContent = null;
}
