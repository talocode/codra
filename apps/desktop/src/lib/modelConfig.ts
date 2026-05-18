// Model and Provider configuration for Codra
// Persisted in localStorage for MVP (can migrate to backend later)

export type Provider =
  | 'Codex'
  | 'Claude'
  | 'Gemini'
  | 'OpenCode'
  | 'Kilo'
  | 'Cursor'
  | 'Local';

export interface ModelOption {
  id: string;
  label: string;
  available: boolean; // false = "UI configured, runtime integration pending"
}

export const PROVIDERS: Provider[] = [
  'Codex',
  'Claude',
  'Gemini',
  'OpenCode',
  'Kilo',
  'Cursor',
  'Local',
];

export const MODELS: Record<Provider, ModelOption[]> = {
  Codex: [
    { id: 'gpt-5.5', label: 'GPT-5.5', available: false },
    { id: 'gpt-5.4', label: 'GPT-5.4', available: false },
    { id: 'gpt-5.3-codex', label: 'GPT-5.3 Codex', available: false },
    { id: 'gpt-5.2-codex', label: 'GPT-5.2 Codex', available: false },
    { id: 'gpt-5.1-codex', label: 'GPT-5.1 Codex', available: false },
  ],
  Claude: [
    { id: 'claude-opus-4.7', label: 'Claude Opus 4.7', available: false },
    { id: 'claude-sonnet-4.6', label: 'Claude Sonnet 4.6', available: false },
    { id: 'claude-haiku-4.5', label: 'Claude Haiku 4.5', available: false },
  ],
  Gemini: [
    { id: 'gemini-3.1-pro', label: 'Gemini 3.1 Pro', available: false },
    { id: 'gemini-3.1-flash', label: 'Gemini 3.1 Flash', available: false },
    { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', available: false },
  ],
  OpenCode: [
    { id: 'default', label: 'Provider default', available: false },
    { id: 'configured', label: 'OpenCode configured model', available: false },
  ],
  Kilo: [
    { id: 'default', label: 'Provider default', available: false },
    { id: 'configured', label: 'Kilo configured model', available: false },
  ],
  Cursor: [
    { id: 'auto', label: 'Auto', available: false },
    { id: 'configured', label: 'Cursor configured model', available: false },
  ],
  Local: [
    { id: 'ollama', label: 'Ollama configured model', available: true },
    { id: 'lm-studio', label: 'LM Studio configured model', available: true },
    { id: 'custom', label: 'Custom OpenAI-compatible', available: false },
  ],
};

export interface ModelConfig {
  selectedProvider: Provider;
  selectedModel: string;
  favoriteModels: string[];
  customEndpoint?: string;
  localProvider?: 'ollama' | 'lm-studio' | 'custom';
}

const STORAGE_KEY = 'codra_model_config';

const DEFAULT_CONFIG: ModelConfig = {
  selectedProvider: 'Claude',
  selectedModel: 'claude-sonnet-4.6',
  favoriteModels: [],
  customEndpoint: '',
  localProvider: 'ollama',
};

export function loadModelConfig(): ModelConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_CONFIG, ...parsed };
    }
  } catch {}
  return { ...DEFAULT_CONFIG };
}

export function saveModelConfig(config: Partial<ModelConfig>) {
  const current = loadModelConfig();
  const next = { ...current, ...config };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}
  return next;
}

export function getModelLabel(provider: Provider, modelId: string): string {
  const models = MODELS[provider] || [];
  const found = models.find((m) => m.id === modelId);
  return found ? found.label : modelId;
}

export function isModelAvailable(provider: Provider, modelId: string): boolean {
  const models = MODELS[provider] || [];
  const found = models.find((m) => m.id === modelId);
  return found ? found.available : false;
}
