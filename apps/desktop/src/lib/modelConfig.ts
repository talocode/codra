// Model and provider configuration for the Codra desktop shell.
// Persisted in localStorage for the frontend shell only.

export type Provider =
  | "Codex"
  | "Claude"
  | "Cursor"
  | "Gemini"
  | "Kilo"
  | "OpenCode"
  | "Pi"
  | "Local";

export type RuntimeStatus = "ready" | "runtime_pending";

export interface ModelOption {
  id: string;
  label: string;
  available: boolean;
  description?: string;
  keywords?: string[];
}

export interface ProviderDefinition {
  id: Provider;
  label: string;
  runtimeLabel: string;
  runtimeStatus: RuntimeStatus;
  category: string;
  engine: string;
  description: string;
}

export const PROVIDERS: Provider[] = [
  "Codex",
  "Claude",
  "Cursor",
  "Gemini",
  "Kilo",
  "OpenCode",
  "Pi",
  "Local",
];

export const PROVIDER_DEFINITIONS: Record<Provider, ProviderDefinition> = {
  Codex: {
    id: "Codex",
    label: "Codex",
    runtimeLabel: "ready",
    runtimeStatus: "ready",
    category: "OpenAI",
    engine: "OpenAI",
    description: "OpenAI coding runtime currently mapped to Codra’s existing task flow.",
  },
  Claude: {
    id: "Claude",
    label: "Claude",
    runtimeLabel: "runtime pending",
    runtimeStatus: "runtime_pending",
    category: "Anthropic",
    engine: "Anthropic",
    description: "Claude-style coding workflow. UI-ready, runtime wiring lands later.",
  },
  Cursor: {
    id: "Cursor",
    label: "Cursor",
    runtimeLabel: "runtime pending",
    runtimeStatus: "runtime_pending",
    category: "OpenAI / Anthropic",
    engine: "Cursor",
    description: "Cursor adapter surface for imported workspace flows and configured models.",
  },
  Gemini: {
    id: "Gemini",
    label: "Gemini",
    runtimeLabel: "runtime pending",
    runtimeStatus: "runtime_pending",
    category: "Google Gemini",
    engine: "Gemini",
    description: "Gemini planner/executor surface. Not yet connected to Codra runtime.",
  },
  Kilo: {
    id: "Kilo",
    label: "Kilo",
    runtimeLabel: "runtime pending",
    runtimeStatus: "runtime_pending",
    category: "OpenRouter",
    engine: "Kilo",
    description: "Kilo provider placeholder for future adapter work.",
  },
  OpenCode: {
    id: "OpenCode",
    label: "OpenCode",
    runtimeLabel: "runtime pending",
    runtimeStatus: "runtime_pending",
    category: "OpenRouter",
    engine: "OpenCode",
    description: "OpenCode runtime placeholder for adapter-based execution later.",
  },
  Pi: {
    id: "Pi",
    label: "Pi",
    runtimeLabel: "runtime pending",
    runtimeStatus: "runtime_pending",
    category: "Custom endpoint",
    engine: "Pi",
    description: "Pi runtime placeholder for future provider support.",
  },
  Local: {
    id: "Local",
    label: "Local",
    runtimeLabel: "ready",
    runtimeStatus: "ready",
    category: "Ollama / LM Studio / Custom endpoint",
    engine: "Local",
    description: "Local and OpenAI-compatible endpoint selection stored in the desktop shell.",
  },
};

export const MODELS: Record<Provider, ModelOption[]> = {
  Codex: [
    { id: "gpt-5.5", label: "GPT-5.5", available: true, keywords: ["openai", "gpt"] },
    { id: "gpt-5.4", label: "GPT-5.4", available: true, keywords: ["openai", "gpt"] },
    {
      id: "gpt-5.3-codex",
      label: "GPT-5.3 Codex",
      available: true,
      keywords: ["codex", "openai", "gpt"],
    },
    {
      id: "gpt-5.2-codex",
      label: "GPT-5.2 Codex",
      available: true,
      keywords: ["codex", "openai", "gpt"],
    },
  ],
  Claude: [
    { id: "claude-opus-4.7", label: "Claude Opus 4.7", available: false, keywords: ["anthropic"] },
    { id: "claude-sonnet-4.6", label: "Claude Sonnet 4.6", available: false, keywords: ["anthropic"] },
    { id: "claude-haiku-4.5", label: "Claude Haiku 4.5", available: false, keywords: ["anthropic"] },
  ],
  Cursor: [
    { id: "cursor-auto", label: "Auto", available: false, keywords: ["cursor"] },
    { id: "cursor-composer-2.5", label: "Composer 2.5", available: false, keywords: ["cursor"] },
    { id: "cursor-composer-2", label: "Composer 2", available: false, keywords: ["cursor"] },
    { id: "cursor-configured-model", label: "Cursor configured model", available: false, keywords: ["cursor", "configured"] },
  ],
  Gemini: [
    { id: "gemini-3.1-pro", label: "Gemini 3.1 Pro", available: false, keywords: ["google", "gemini"] },
    { id: "gemini-3.1-flash", label: "Gemini 3.1 Flash", available: false, keywords: ["google", "gemini"] },
    { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", available: false, keywords: ["google", "gemini"] },
  ],
  Kilo: [
    { id: "kilo-configured-model", label: "Kilo configured model", available: false, keywords: ["kilo", "configured"] },
    { id: "kilo-provider-default", label: "Provider default", available: false, keywords: ["kilo", "default"] },
  ],
  OpenCode: [
    { id: "opencode-configured-model", label: "OpenCode configured model", available: false, keywords: ["opencode", "configured"] },
    { id: "opencode-provider-default", label: "Provider default", available: false, keywords: ["opencode", "default"] },
  ],
  Pi: [
    { id: "pi-configured-model", label: "Pi configured model", available: false, keywords: ["pi", "configured"] },
    { id: "pi-provider-default", label: "Provider default", available: false, keywords: ["pi", "default"] },
  ],
  Local: [
    { id: "local-ollama", label: "Ollama", available: true, keywords: ["ollama", "local"] },
    { id: "local-lm-studio", label: "LM Studio", available: true, keywords: ["lm studio", "local"] },
    {
      id: "local-custom-openai-endpoint",
      label: "Custom OpenAI-compatible endpoint",
      available: true,
      keywords: ["custom", "endpoint", "openai compatible"],
    },
  ],
};

export interface ModelConfig {
  selectedProvider: Provider;
  selectedModel: string;
  favoriteModels: string[];
  customEndpoint?: string;
  localProvider?: "ollama" | "lm-studio" | "custom";
}

const STORAGE_KEY = "codra_model_config";

const DEFAULT_CONFIG: ModelConfig = {
  selectedProvider: "Codex",
  selectedModel: "gpt-5.5",
  favoriteModels: ["Codex:gpt-5.5"],
  customEndpoint: "",
  localProvider: "ollama",
};

function favoriteKey(provider: Provider, modelId: string) {
  return `${provider}:${modelId}`;
}

function normalizeModelConfig(config: Partial<ModelConfig>): ModelConfig {
  const rawProvider = config.selectedProvider;
  const provider = PROVIDERS.includes(rawProvider as Provider)
    ? (rawProvider as Provider)
    : DEFAULT_CONFIG.selectedProvider;

  const modelList = MODELS[provider];
  const rawModel = config.selectedModel;
  const selectedModel = modelList.some((entry) => entry.id === rawModel)
    ? String(rawModel)
    : modelList[0]?.id || DEFAULT_CONFIG.selectedModel;

  const favoriteModels = Array.isArray(config.favoriteModels)
    ? config.favoriteModels.filter((entry) => typeof entry === "string" && entry.includes(":"))
    : DEFAULT_CONFIG.favoriteModels;

  return {
    ...DEFAULT_CONFIG,
    ...config,
    favoriteModels,
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

export function setSelectedProvider(provider: Provider) {
  const nextModel = MODELS[provider][0]?.id ?? DEFAULT_CONFIG.selectedModel;
  return saveModelConfig({ selectedProvider: provider, selectedModel: nextModel });
}

export function setSelectedProviderModel(provider: Provider, modelId: string) {
  const fallbackModel = MODELS[provider][0]?.id ?? DEFAULT_CONFIG.selectedModel;
  const selectedModel = MODELS[provider].some((entry) => entry.id === modelId) ? modelId : fallbackModel;
  return saveModelConfig({ selectedProvider: provider, selectedModel });
}

export function toggleFavoriteModel(provider: Provider, modelId: string) {
  const current = loadModelConfig();
  const key = favoriteKey(provider, modelId);
  const favoriteModels = current.favoriteModels.includes(key)
    ? current.favoriteModels.filter((entry) => entry !== key)
    : [...current.favoriteModels, key];
  return saveModelConfig({ favoriteModels });
}

export function isFavoriteModel(
  provider: Provider,
  modelId: string,
  favoriteModels: string[] | undefined,
) {
  return (favoriteModels ?? []).includes(favoriteKey(provider, modelId));
}

export function getModelLabel(provider: Provider, modelId: string): string {
  const models = MODELS[provider] || [];
  const found = models.find((model) => model.id === modelId);
  return found ? found.label : modelId;
}

export function getProviderRuntimeLabel(provider: Provider): string {
  return PROVIDER_DEFINITIONS[provider]?.runtimeLabel ?? "runtime pending";
}

export function getProviderCategory(provider: Provider): string {
  return PROVIDER_DEFINITIONS[provider]?.category ?? "Custom endpoint";
}

export function isProviderRuntimePending(provider: Provider): boolean {
  return PROVIDER_DEFINITIONS[provider]?.runtimeStatus === "runtime_pending";
}

export function isModelAvailable(provider: Provider, modelId: string): boolean {
  const models = MODELS[provider] || [];
  const found = models.find((model) => model.id === modelId);
  return found ? found.available : false;
}

export function getModelStatusLabel(provider: Provider, modelId: string): string {
  return isModelAvailable(provider, modelId) ? "ready" : "runtime pending";
}

export function getModelSearchText(provider: Provider, model: ModelOption): string {
  return [provider, model.label, model.id, ...(model.keywords ?? [])]
    .join(" ")
    .toLowerCase();
}

export function getProviderSearchText(provider: Provider): string {
  const definition = PROVIDER_DEFINITIONS[provider];
  return [definition.label, definition.category, definition.description, definition.engine]
    .join(" ")
    .toLowerCase();
}
