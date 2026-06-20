import * as fs from 'fs';
import * as path from 'path';
import { ToolCall } from './types.js';
import { redactSecrets, redactFilePath } from '../security/redact.js';

const TOOL_CALLS_DIR = path.join(process.cwd(), '.codra', 'tool-calls');
const EVENTS_FILE = path.join(TOOL_CALLS_DIR, 'events.jsonl');

function ensureToolCallsDir() {
  if (!fs.existsSync(TOOL_CALLS_DIR)) {
    fs.mkdirSync(TOOL_CALLS_DIR, { recursive: true });
  }
}

function sanitizeToolCall(toolCall: ToolCall): ToolCall {
  return {
    ...toolCall,
    inputSummary: redactSecrets(toolCall.inputSummary),
    outputSummary: redactSecrets(toolCall.outputSummary),
    redacted: true
  };
}

export function logToolCall(toolCall: ToolCall): void {
  try {
    ensureToolCallsDir();
    const sanitized = sanitizeToolCall(toolCall);
    const line = JSON.stringify(sanitized) + '\n';
    fs.appendFileSync(EVENTS_FILE, line);
  } catch {
    // Tool logging failure should not crash the CLI
  }
}

export function getToolCalls(): ToolCall[] {
  ensureToolCallsDir();
  if (!fs.existsSync(EVENTS_FILE)) return [];
  
  const content = fs.readFileSync(EVENTS_FILE, 'utf-8');
  const lines = content.trim().split('\n').filter(l => l);
  
  return lines.map(line => {
    try {
      return JSON.parse(line) as ToolCall;
    } catch {
      return null;
    }
  }).filter((tc): tc is ToolCall => tc !== null);
}

export function getToolCallsByThread(threadId: string): ToolCall[] {
  return getToolCalls().filter(tc => tc.threadId === threadId);
}

export function getRecentToolCalls(count: number = 10): ToolCall[] {
  return getToolCalls().slice(-count);
}

export function clearToolCalls(): void {
  ensureToolCallsDir();
  fs.writeFileSync(EVENTS_FILE, '');
}
