import * as fs from 'fs';
import * as path from 'path';
import { VisualPlan } from './types.js';

const VISUAL_PLANS_DIR = path.join(process.cwd(), '.codra', 'visual-plans');

function ensureDir() {
  if (!fs.existsSync(VISUAL_PLANS_DIR)) {
    fs.mkdirSync(VISUAL_PLANS_DIR, { recursive: true });
  }
}

export function saveVisualPlan(plan: VisualPlan): void {
  ensureDir();
  const jsonPath = path.join(VISUAL_PLANS_DIR, `${plan.id}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(plan, null, 2));
}

export function getVisualPlan(id: string): VisualPlan | null {
  const jsonPath = path.join(VISUAL_PLANS_DIR, `${id}.json`);
  if (!fs.existsSync(jsonPath)) return null;
  return JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
}

export function listVisualPlans(): VisualPlan[] {
  ensureDir();
  const files = fs.readdirSync(VISUAL_PLANS_DIR).filter(f => f.endsWith('.json'));
  return files.map(f => JSON.parse(fs.readFileSync(path.join(VISUAL_PLANS_DIR, f), 'utf-8')));
}

export function deleteVisualPlan(id: string): boolean {
  const jsonPath = path.join(VISUAL_PLANS_DIR, `${id}.json`);
  if (fs.existsSync(jsonPath)) {
    fs.unlinkSync(jsonPath);
    return true;
  }
  return false;
}
