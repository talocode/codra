import * as fs from 'fs';
import * as path from 'path';
import { Plan } from './types.js';

const PLANS_DIR = path.join(process.cwd(), '.codra', 'plans');

function ensurePlansDir() {
  if (!fs.existsSync(PLANS_DIR)) {
    fs.mkdirSync(PLANS_DIR, { recursive: true });
  }
}

function sanitizeContent(content: string): string {
  const patterns = [
    /api[_-]?key\s*[=:]\s*['"]?[^\s'"&]+['"]?/gi,
    /password\s*[=:]\s*['"]?[^\s'"&]+['"]?/gi,
    /secret\s*[=:]\s*['"]?[^\s'"&]+['"]?/gi,
  ];
  let sanitized = content;
  for (const pattern of patterns) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }
  return sanitized;
}

export function savePlan(plan: Plan): void {
  ensurePlansDir();
  const filePath = path.join(PLANS_DIR, `${plan.id}.json`);
  const sanitized = {
    ...plan,
    notes: plan.notes.map(n => sanitizeContent(n)),
    risks: plan.risks.map(r => sanitizeContent(r))
  };
  fs.writeFileSync(filePath, JSON.stringify(sanitized, null, 2));
}

export function getPlan(id: string): Plan | null {
  const filePath = path.join(PLANS_DIR, `${id}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export function listPlans(): Plan[] {
  ensurePlansDir();
  const files = fs.readdirSync(PLANS_DIR).filter(f => f.endsWith('.json'));
  return files.map(f => JSON.parse(fs.readFileSync(path.join(PLANS_DIR, f), 'utf-8')));
}

export function deletePlan(id: string): boolean {
  const filePath = path.join(PLANS_DIR, `${id}.json`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
}
