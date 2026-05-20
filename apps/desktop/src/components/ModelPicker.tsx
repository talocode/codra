import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, Sparkles, Star } from "lucide-react";
import {
  MODELS,
  PROVIDERS,
  PROVIDER_DEFINITIONS,
  getModelSearchText,
  getModelStatusLabel,
  getProviderCategory,
  getProviderSearchText,
  isFavoriteModel,
  isProviderRuntimePending,
  loadModelConfig,
  setSelectedProviderModel,
  toggleFavoriteModel,
  type ModelConfig,
  type ModelOption,
  type Provider,
} from "../lib/modelConfig";

interface ModelPickerProps {
  value?: ModelConfig;
  compact?: boolean;
  onChange?: (config: ModelConfig) => void;
}

function selectedModelSummary(config: ModelConfig) {
  const model = MODELS[config.selectedProvider].find((entry) => entry.id === config.selectedModel);
  return model?.label ?? config.selectedModel;
}

export function ModelPicker({ value, compact = false, onChange }: ModelPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [hoveredProvider, setHoveredProvider] = useState<Provider>(
    value?.selectedProvider ?? loadModelConfig().selectedProvider,
  );
  const rootRef = useRef<HTMLDivElement | null>(null);
  const config = value ?? loadModelConfig();

  useEffect(() => {
    setHoveredProvider(config.selectedProvider);
  }, [config.selectedProvider]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      window.addEventListener("mousedown", handlePointerDown);
    }

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
    };
  }, [open]);

  const normalizedSearch = search.trim().toLowerCase();

  const visibleProviders = useMemo(() => {
    if (!normalizedSearch) {
      return PROVIDERS;
    }

    return PROVIDERS.filter((provider) => {
      const providerHit = getProviderSearchText(provider).includes(normalizedSearch);
      const modelHit = MODELS[provider].some((model) =>
        getModelSearchText(provider, model).includes(normalizedSearch),
      );
      return providerHit || modelHit;
    });
  }, [normalizedSearch]);

  const activeProvider = visibleProviders.includes(hoveredProvider)
    ? hoveredProvider
    : visibleProviders[0] ?? config.selectedProvider;

  const visibleModels = useMemo(() => {
    const models = MODELS[activeProvider] ?? [];
    if (!normalizedSearch) {
      return models;
    }

    return models.filter((model) => getModelSearchText(activeProvider, model).includes(normalizedSearch));
  }, [activeProvider, normalizedSearch]);

  const favoriteModels = useMemo(
    () => visibleModels.filter((model) => isFavoriteModel(activeProvider, model.id, config.favoriteModels)),
    [activeProvider, config.favoriteModels, visibleModels],
  );

  const remainingModels = useMemo(
    () => visibleModels.filter((model) => !isFavoriteModel(activeProvider, model.id, config.favoriteModels)),
    [activeProvider, config.favoriteModels, visibleModels],
  );

  function commit(next: ModelConfig) {
    onChange?.(next);
  }

  function handleSelectModel(provider: Provider, model: ModelOption) {
    const next = setSelectedProviderModel(provider, model.id);
    commit(next);
    setOpen(false);
    setSearch("");
  }

  function handleToggleFavorite(provider: Provider, modelId: string) {
    const next = toggleFavoriteModel(provider, modelId);
    commit(next);
  }

  const triggerLabel = selectedModelSummary(config);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={[
          "inline-flex items-center gap-3 rounded-2xl border border-[color:var(--border)] bg-[var(--panel-muted)] text-left text-[var(--text-primary)] transition hover:border-[color:var(--border-strong)] hover:bg-[var(--panel-elevated)]",
          compact ? "min-h-10 px-3 py-2" : "min-h-10 px-3.5 py-2",
        ].join(" ")}
      >
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl border border-[color:var(--border)] bg-[var(--panel-base)] text-[var(--accent)]">
          <Sparkles className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block text-[10px] uppercase tracking-[0.22em] text-[var(--text-muted)]">
            {config.selectedProvider}
          </span>
          <span className="block max-w-[11rem] truncate text-sm font-medium">{triggerLabel}</span>
        </span>
        {isProviderRuntimePending(config.selectedProvider) ? (
          <span className="hidden rounded-full border border-[color:var(--border)] px-2 py-0.5 text-[10px] text-[var(--text-muted)] lg:inline-flex">
            pending
          </span>
        ) : null}
        <ChevronDown className="ml-auto h-4 w-4 text-[var(--text-muted)]" />
      </button>

      {open ? (
        <div className="absolute bottom-[calc(100%+12px)] left-0 z-50 w-[min(44rem,calc(100vw-1.5rem))] overflow-hidden rounded-[24px] border border-[color:var(--border)] bg-[var(--panel-overlay)] shadow-[0_36px_120px_rgba(0,0,0,0.48)] backdrop-blur-xl">
          <div className="grid max-h-[30rem] grid-cols-[200px_minmax(0,1fr)] overflow-hidden max-sm:grid-cols-[160px_minmax(0,1fr)]">
            <div className="border-r border-[color:var(--border)] bg-transparent px-2 py-2.5">
              <div className="px-2 pb-2 text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">Providers</div>
              <div className="max-h-[30rem] space-y-1 overflow-y-auto pr-1">
                {visibleProviders.map((provider) => {
                  const definition = PROVIDER_DEFINITIONS[provider];
                  const selected = provider === activeProvider;
                  return (
                    <button
                      key={provider}
                      type="button"
                      onMouseEnter={() => setHoveredProvider(provider)}
                      onFocus={() => setHoveredProvider(provider)}
                      onClick={() => setHoveredProvider(provider)}
                      className={[
                        "flex w-full flex-col rounded-2xl border px-3 py-3 text-left transition",
                        selected
                          ? "border-[color:var(--border-strong)] bg-[var(--panel-selected)]"
                          : "border-transparent bg-transparent hover:border-[color:var(--border)] hover:bg-[var(--panel-muted)]",
                      ].join(" ")}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="font-medium text-[var(--text-primary)]">{definition.label}</span>
                        {config.selectedProvider === provider ? (
                          <Check className="h-4 w-4 text-[var(--accent)]" />
                        ) : null}
                      </span>
                      <span className="mt-1 text-xs text-[var(--text-muted)]">{getProviderCategory(provider)}</span>
                      <span className="mt-2 inline-flex w-fit rounded-full border border-[color:var(--border)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
                        {definition.runtimeLabel}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="min-h-0 bg-[var(--panel-card)]/95">
              <div className="border-b border-[color:var(--border)] px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-[var(--text-primary)]">{activeProvider}</div>
                    <div className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                      {PROVIDER_DEFINITIONS[activeProvider].description}
                    </div>
                  </div>
                  <span className="rounded-full border border-[color:var(--border)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
                    {PROVIDER_DEFINITIONS[activeProvider].runtimeLabel}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-3 rounded-2xl border border-[color:var(--border)] bg-[var(--panel-muted)] px-3 py-2.5">
                  <Search className="h-4 w-4 text-[var(--text-muted)]" />
                  <input
                    autoFocus
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search models"
                    className="w-full bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
                  />
                </div>
              </div>

              <div className="max-h-[30rem] space-y-4 overflow-y-auto p-3">
                {favoriteModels.length > 0 ? (
                  <div>
                    <div className="mb-2 text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">Favorites</div>
                    <div className="space-y-2">
                      {favoriteModels.map((model) => (
                        <ModelRow
                          key={model.id}
                          provider={activeProvider}
                          model={model}
                          selected={config.selectedProvider === activeProvider && config.selectedModel === model.id}
                          favorited
                          onSelect={handleSelectModel}
                          onToggleFavorite={handleToggleFavorite}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}

                <div>
                  <div className="mb-2 text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">
                    {favoriteModels.length > 0 ? "All models" : "Models"}
                  </div>
                  <div className="space-y-2">
                    {remainingModels.length > 0 ? (
                      remainingModels.map((model) => (
                        <ModelRow
                          key={model.id}
                          provider={activeProvider}
                          model={model}
                          selected={config.selectedProvider === activeProvider && config.selectedModel === model.id}
                          favorited={isFavoriteModel(activeProvider, model.id, config.favoriteModels)}
                          onSelect={handleSelectModel}
                          onToggleFavorite={handleToggleFavorite}
                        />
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-[color:var(--border)] px-4 py-6 text-sm text-[var(--text-muted)]">
                        No models matched your search.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ModelRow({
  provider,
  model,
  selected,
  favorited,
  onSelect,
  onToggleFavorite,
}: {
  provider: Provider;
  model: ModelOption;
  selected: boolean;
  favorited: boolean;
  onSelect: (provider: Provider, model: ModelOption) => void;
  onToggleFavorite: (provider: Provider, modelId: string) => void;
}) {
  return (
    <div
      className={[
        "group flex items-start gap-3 rounded-2xl border px-3 py-3 transition",
        selected
          ? "border-[color:var(--border-strong)] bg-[var(--panel-selected)]"
          : "border-[color:var(--border)] bg-[var(--panel-muted)] hover:border-[color:var(--border-strong)] hover:bg-[var(--panel-elevated)]",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={() => onSelect(provider, model)}
        className="flex min-w-0 flex-1 items-start gap-3 text-left"
      >
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[color:var(--border)] bg-[var(--panel-base)] text-sm text-[var(--text-primary)]">
          {selected ? <Check className="h-4 w-4 text-[var(--accent)]" /> : provider.slice(0, 1)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-[var(--text-primary)]">{model.label}</span>
          <span className="mt-1 block text-xs text-[var(--text-muted)]">{model.id}</span>
          <span className="mt-2 inline-flex rounded-full border border-[color:var(--border)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
            {getModelStatusLabel(provider, model.id)}
          </span>
        </span>
      </button>

      <button
        type="button"
        aria-label={favorited ? "Remove favorite" : "Add favorite"}
        onClick={() => onToggleFavorite(provider, model.id)}
        className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-transparent text-[var(--text-muted)] transition hover:border-[color:var(--border)] hover:bg-[var(--panel-base)] hover:text-[var(--accent)]"
      >
        <Star className={favorited ? "h-4 w-4 fill-current text-[var(--accent)]" : "h-4 w-4"} />
      </button>
    </div>
  );
}
