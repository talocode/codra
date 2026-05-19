import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, Sparkles, Star } from "lucide-react";
import {
  MODELS,
  PROVIDERS,
  PROVIDER_DEFINITIONS,
  getModelSearchText,
  getModelStatusLabel,
  getProviderCategory,
  getProviderRuntimeLabel,
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
    () =>
      visibleModels.filter((model) =>
        isFavoriteModel(activeProvider, model.id, config.favoriteModels),
      ),
    [activeProvider, config.favoriteModels, visibleModels],
  );

  const nonFavoriteModels = useMemo(
    () =>
      visibleModels.filter(
        (model) => !isFavoriteModel(activeProvider, model.id, config.favoriteModels),
      ),
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
          compact ? "min-h-11 px-3 py-2.5" : "min-h-12 px-4 py-3",
        ].join(" ")}
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
          <Sparkles className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">
            {config.selectedProvider}
          </span>
          <span className="block truncate text-sm font-medium">{triggerLabel}</span>
        </span>
        <span className="ml-auto inline-flex items-center gap-2">
          {isProviderRuntimePending(config.selectedProvider) && (
            <span className="hidden rounded-full border border-[color:var(--border)] px-2 py-0.5 text-[10px] text-[var(--text-muted)] sm:inline-flex">
              runtime pending
            </span>
          )}
          <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
        </span>
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+12px)] z-40 w-[min(46rem,calc(100vw-2rem))] overflow-hidden rounded-[24px] border border-[color:var(--border)] bg-[var(--panel-overlay)] shadow-[0_24px_80px_rgba(15,23,42,0.28)] backdrop-blur-xl">
          <div className="border-b border-[color:var(--border)] px-4 py-3">
            <div className="flex items-center gap-3 rounded-2xl border border-[color:var(--border)] bg-[var(--panel-muted)] px-3 py-2.5">
              <Search className="h-4 w-4 text-[var(--text-muted)]" />
              <input
                autoFocus
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search providers or models"
                className="w-full bg-transparent text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
              />
            </div>
          </div>

          <div className="grid max-h-[28rem] grid-cols-1 overflow-hidden md:grid-cols-[220px_minmax(0,1fr)]">
            <div className="border-b border-[color:var(--border)] md:border-b-0 md:border-r">
              <div className="px-4 py-3 text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">
                Providers
              </div>
              <div className="max-h-[28rem] overflow-y-auto px-2 pb-2">
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
                        "mb-1 flex w-full flex-col rounded-2xl border px-3 py-3 text-left transition",
                        selected
                          ? "border-[color:var(--accent)] bg-[var(--accent-soft)]"
                          : "border-transparent hover:border-[color:var(--border)] hover:bg-[var(--panel-muted)]",
                      ].join(" ")}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="font-medium text-[var(--text-primary)]">{definition.label}</span>
                        <span className="rounded-full border border-[color:var(--border)] px-2 py-0.5 text-[10px] text-[var(--text-muted)]">
                          {definition.runtimeLabel}
                        </span>
                      </span>
                      <span className="mt-1 text-xs text-[var(--text-muted)]">{getProviderCategory(provider)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="min-h-0">
              <div className="flex items-center justify-between gap-3 border-b border-[color:var(--border)] px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">{activeProvider}</div>
                  <div className="text-xs text-[var(--text-muted)]">
                    {PROVIDER_DEFINITIONS[activeProvider].description}
                  </div>
                </div>
                <span className="rounded-full border border-[color:var(--border)] px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  {getProviderRuntimeLabel(activeProvider)}
                </span>
              </div>

              <div className="max-h-[28rem] overflow-y-auto p-3">
                {favoriteModels.length > 0 && (
                  <div className="mb-4">
                    <div className="mb-2 text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">
                      Favorites
                    </div>
                    <div className="space-y-2">
                      {favoriteModels.map((model) => (
                        <ModelRow
                          key={model.id}
                          provider={activeProvider}
                          model={model}
                          selected={
                            config.selectedProvider === activeProvider &&
                            config.selectedModel === model.id
                          }
                          favorited
                          onSelect={handleSelectModel}
                          onToggleFavorite={handleToggleFavorite}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div className="mb-2 text-[10px] uppercase tracking-[0.24em] text-[var(--text-muted)]">
                    {favoriteModels.length > 0 ? "All models" : "Models"}
                  </div>
                  <div className="space-y-2">
                    {nonFavoriteModels.length > 0 ? (
                      nonFavoriteModels.map((model) => (
                        <ModelRow
                          key={model.id}
                          provider={activeProvider}
                          model={model}
                          selected={
                            config.selectedProvider === activeProvider &&
                            config.selectedModel === model.id
                          }
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
      )}
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
          ? "border-[color:var(--accent)] bg-[var(--accent-soft)]"
          : "border-[color:var(--border)] bg-[var(--panel-muted)] hover:border-[color:var(--border-strong)] hover:bg-[var(--panel-elevated)]",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={() => onSelect(provider, model)}
        className="flex min-w-0 flex-1 items-start gap-3 text-left"
      >
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[color:var(--border)] bg-[var(--panel-base)] text-[var(--text-primary)]">
          {selected ? <Check className="h-4 w-4 text-[var(--accent)]" /> : provider.slice(0, 1)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-[var(--text-primary)]">
            {model.label}
          </span>
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
