import { open } from '@tauri-apps/plugin-dialog';
import { isTauriRuntime } from './tauriRuntime';

/**
 * Opens a native folder picker for selecting a Codra workspace.
 * Returns the selected directory path or null if cancelled.
 * Works only inside the real Tauri desktop window.
 */
export async function selectWorkspaceFolder(): Promise<string | null> {
  if (!isTauriRuntime()) {
    console.warn('[workspacePicker] Tauri runtime not detected. Native folder picker unavailable.');
    throw new Error('Native folder picker is only available in the Tauri app window.');
  }

  try {
    const selected = await open({
      directory: true,
      multiple: false,
      title: 'Select Codra workspace',
      defaultPath: undefined,
    });

    if (selected === null) {
      return null;
    }

    // open() returns string | string[] | null
    if (Array.isArray(selected)) {
      return selected.length > 0 ? selected[0] : null;
    }

    return selected;
  } catch (err) {
    console.error('[workspacePicker] Failed to open folder picker:', err);
    throw new Error(`Failed to open folder picker: ${err}`);
  }
}
