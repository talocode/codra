export type AppTheme = "dark" | "light";

const STORAGE_KEY = "codra_theme";
const DEFAULT_THEME: AppTheme = "dark";

function isTheme(value: unknown): value is AppTheme {
  return value === "dark" || value === "light";
}

export function loadTheme(): AppTheme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isTheme(stored)) {
      return stored;
    }
  } catch {
    // ignore storage access failures
  }
  return DEFAULT_THEME;
}

export function saveTheme(theme: AppTheme): AppTheme {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // ignore storage access failures
  }
  return theme;
}

export function applyTheme(theme: AppTheme) {
  if (typeof document === "undefined") {
    return;
  }
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}
