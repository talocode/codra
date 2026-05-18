/**
 * Robust Tauri v2 runtime detection.
 * Checks multiple safe signals without throwing.
 * Works reliably inside Tauri WebView even when some globals are not yet populated.
 */
export function isTauriRuntime(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const w = window as any;

  // Primary Tauri v2 signals
  if (w.__TAURI_INTERNALS__ !== undefined) return true;
  if (w.__TAURI__ !== undefined) return true;

  // Protocol check (Tauri serves from tauri: protocol in some builds)
  if (typeof window.location === 'object' && window.location.protocol === 'tauri:') {
    return true;
  }

  // User agent sometimes contains Tauri identifier
  if (typeof navigator === 'object' && /Tauri/i.test(navigator.userAgent)) {
    return true;
  }

  return false;
}
