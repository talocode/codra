import * as fs from 'fs';
import * as path from 'path';
import { Thread } from './types.js';

const THREADS_DIR = path.join(process.cwd(), '.codra', 'threads');

function ensureThreadsDir() {
  if (!fs.existsSync(THREADS_DIR)) {
    fs.mkdirSync(THREADS_DIR, { recursive: true });
  }
}

export function saveThread(thread: Thread): void {
  ensureThreadsDir();
  const filePath = path.join(THREADS_DIR, `${thread.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(thread, null, 2));
}

export function getThread(id: string): Thread | null {
  const filePath = path.join(THREADS_DIR, `${id}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export function listThreads(): Thread[] {
  ensureThreadsDir();
  const files = fs.readdirSync(THREADS_DIR).filter(f => f.endsWith('.json'));
  return files.map(f => JSON.parse(fs.readFileSync(path.join(THREADS_DIR, f), 'utf-8')));
}

export function deleteThread(id: string): boolean {
  const filePath = path.join(THREADS_DIR, `${id}.json`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
}
