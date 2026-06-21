import type { Session } from '../session/index.js';

let currentSession: Session | null = null;

export function setCurrentSession(session: Session): void {
  currentSession = session;
}

export function getCurrentSession(): Session | null {
  return currentSession;
}
