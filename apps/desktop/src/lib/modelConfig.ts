// Model and provider configuration for the Codra desktop shell.
// Persisted in localStorage for the frontend shell only.

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
  available: boolean;
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

export const PROVIDER_META: Record<Provider, { runtimeLabel: string; pending: boolean }> = {
  Codex: { runtimeLabel: 'local execution', pending: false },
  Claude: { runtimeLabel: 'available', pending: false },
  Gemini: { runtimeLabel: 'remote connector', pending: true },
  OpenCode: { runtimeLabel: 'adapter pending', pending: true },
  Kilo: { runtimeLabel: 'adapter pending', pending: true },
  Cursor: { runtimeLabel: 'adapter pending', pending: true },
  Local: { runtimeLabel: 'self-hosted', pending: false },
};

export const MODELS: Record<Provider, ModelOption[]> = {
  Codex: [
    { id: 'codra-5', label: 'Codra 5', available: true },
    { id: 'codra-5-fast', label: 'Codra 5 Fast', available: true },
    { id: 'codex-scout', label: 'Scout', available: false },
  ],
  Claude: [
    { id: 'claude-sonnet-4-5', label: 'Sonnet 4.5', available: true },
    { id: 'claude-opus-4', label: 'Opus 4', available: false },
  ],
  Gemini: [
    { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', available: false },
    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', available: false },
  ],
  OpenCode: [
    { id: 'opencode-openrouter', label: 'OpenRouter bridge', available: false },
    { id: 'opencode-local', label: 'Local bridge', available: false },
  ],
  Kilo: [
    { id: 'kilo-architect', label: 'Architect', available: false },
    { id: 'kilo-runner', label: 'Runner', available: false },
  ],
  Cursor: [
    { id: 'cursor-agent', label: 'Cursor Agent', available: false },
    { id: 'cursor-fast', label: 'Cursor Fast', available: false },
  ],
  Local: [
    { id: 'llama-3.1', label: 'Llama 3.1', available: true },
    { id: 'mistral-small', label: 'Mistral Small', available: true },
    { id: 'custom-openai', label: 'Custom OpenAI-compatible', available: false },
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
  selectedProvider: 'Codex',
  selectedModel: 'codra-5',
  favoriteModels: [],
  customEndpoint: '',
  localProvider: 'ollama',
};

function normalizeModelConfig(config: Partial<ModelConfig>): ModelConfig {
  const rawProvider = config.selectedProvider;
  const provider = PROVIDERS.includes(rawProvider as Provider)
    ? (rawProvider as Provider)
    : DEFAULT_CONFIG.selectedProvider;

  const modelList = MODELS[provider];
  const rawModel = config.selectedModel;
  const modelExists = modelList.some((entry) => entry.id === rawModel);
  const selectedModel = modelExists ? String(rawModel) : modelList[0]?.id || DEFAULT_CONFIG.selectedModel;

  return {
    ...DEFAULT_CONFIG,
    ...config,
    selectedProvider: provider,
    selectedModel,
  };
}

export function loadModelConfig(): ModelConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return normalizeModelConfig(JSON.parse(raw) as Partial<ModelConfig>);
    }
  } catch {
    // Ignore malformed localStorage entries and fall back to defaults.
  }

  return { ...DEFAULT_CONFIG };
}

export function saveModelConfig(config: Partial<ModelConfig>) {
  const current = loadModelConfig();
  const next = normalizeModelConfig({ ...current, ...config });

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage unavailable in some preview contexts.
  }

  return next;
}

export function getModelLabel(provider: Provider, modelId: string): string {
  const models = MODELS[provider] || [];
  const found = models.find((m) => m.id === modelId);
  return found ? found.label : modelId;
}

export function getProviderRuntimeLabel(provider: Provider): string {
  return PROVIDER_META[provider]?.runtimeLabel ?? 'runtime pending';
}

export function isProviderRuntimePending(provider: Provider): boolean {
  return PROVIDER_META[provider]?.pending ?? true;
}

export function isModelAvailable(provider: Provider, modelId: string): boolean {
  const models = MODELS[provider] || [];
  const found = models.find((m) => m.id === modelId);
  return found ? found.available : false;
}

export function getModelStatusLabel(provider: Provider, modelId: string): string {
  return isModelAvailable(provider, modelId) ? 'ready' : 'runtime pending';
}
