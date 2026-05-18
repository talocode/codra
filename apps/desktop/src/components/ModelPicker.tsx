import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  getModelLabel,
  getModelStatusLabel,
  getProviderRuntimeLabel,
  isModelAvailable,
  isProviderRuntimePending,
  loadModelConfig,
  MODELS,
  PROVIDERS,
  saveModelConfig,
} from '../lib/modelConfig';
import type { ModelConfig, Provider } from '../lib/modelConfig';

interface ModelPickerProps {
  compact?: boolean;
  onChange?: (config: ModelConfig) => void;
}

export function ModelPicker({ compact = false, onChange }: ModelPickerProps) {
  const [config, setConfig] = useState<ModelConfig>(() => loadModelConfig());
  const [open, setOpen] = useState(false);
  const [activeProvider, setActiveProvider] = useState<Provider>(config.selectedProvider);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  function updateConfig(partial: Partial<ModelConfig>) {
    const next = saveModelConfig(partial);
    setConfig(next);
    onChange?.(next);
  }

  function selectProvider(provider: Provider) {
    setActiveProvider(provider);
    const firstModel = MODELS[provider][0]?.id || '';
    updateConfig({ selectedProvider: provider, selectedModel: firstModel });
  }

  function selectModel(modelId: string) {
    updateConfig({ selectedModel: modelId });
    setOpen(false);
  }

  const currentLabel = getModelLabel(config.selectedProvider, config.selectedModel);
  const pending = isProviderRuntimePending(config.selectedProvider) || !isModelAvailable(config.selectedProvider, config.selectedModel);
  const compactStatusLabel = pending ? 'runtime pending' : getProviderRuntimeLabel(config.selectedProvider);

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        className={[
          'inline-flex h-11 items-center gap-2 rounded-2xl border border-white/[0.08] bg-[#070b12] px-3.5 text-left text-xs text-white transition hover:border-[rgba(155,192,255,0.18)] hover:bg-[rgba(255,255,255,0.05)]',
          compact ? 'max-w-full' : 'min-w-[260px]',
        ].join(' ')}
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[10px] font-medium text-[#9bc0ff]">
          {config.selectedProvider}
        </span>
        <span className="min-w-0 truncate text-[#96a0b4]">·</span>
        <span className="min-w-0 truncate text-sm text-white">{currentLabel}</span>
        <span className="ml-1 inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[10px] font-medium text-[#96a0b4]">
          {compactStatusLabel}
        </span>
        <ChevronDown className="ml-1 h-3.5 w-3.5 shrink-0 text-[#6f7889]" />
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-2 w-[360px] max-w-[calc(100vw-24px)] overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#0b0f18] shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
          <div className="grid grid-cols-[1fr_1.15fr]">
            <div className="border-r border-white/[0.06] p-2">
              <div className="px-2 py-2 text-[10px] uppercase tracking-[0.34em] text-[#6f7889]">Providers</div>
              <div className="space-y-1">
                {PROVIDERS.map((provider) => {
                  const active = provider === config.selectedProvider;
                  const runtimePending = isProviderRuntimePending(provider);

                  return (
                    <button
                      key={provider}
                      onClick={() => {
                        setActiveProvider(provider);
                        selectProvider(provider);
                      }}
                      className={[
                        'flex w-full items-center justify-between gap-2 rounded-2xl px-3 py-2 text-left text-sm transition',
                        active
                          ? 'bg-[rgba(77,137,255,0.12)] text-white'
                          : 'text-[#d7deea] hover:bg-[rgba(255,255,255,0.05)]',
                      ].join(' ')}
                    >
                      <span className="truncate">{provider}</span>
                      {runtimePending ? (
                        <span className="shrink-0 rounded-full border border-[rgba(240,179,95,0.18)] bg-[rgba(240,179,95,0.08)] px-2 py-1 text-[10px] font-medium text-[#f0b35f]">
                          runtime pending
                        </span>
                      ) : (
                        <span className="shrink-0 text-[10px] text-[#96a0b4]">{getProviderRuntimeLabel(provider)}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-2">
              <div className="px-2 py-2 text-[10px] uppercase tracking-[0.34em] text-[#6f7889]">
                {activeProvider} models
              </div>
              <div className="space-y-1">
                {MODELS[activeProvider].map((model) => {
                  const active = model.id === config.selectedModel;

                  return (
                    <button
                      key={model.id}
                      onClick={() => selectModel(model.id)}
                      className={[
                        'flex w-full items-start justify-between gap-3 rounded-2xl px-3 py-2 text-left transition',
                        active
                          ? 'bg-[rgba(77,137,255,0.12)] text-white'
                          : 'text-[#d7deea] hover:bg-[rgba(255,255,255,0.05)]',
                      ].join(' ')}
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{model.label}</div>
                        <div className="mt-1 text-[10px] text-[#96a0b4]">{getModelStatusLabel(activeProvider, model.id)}</div>
                      </div>
                      {!model.available && (
                        <span className="shrink-0 rounded-full border border-[rgba(240,179,95,0.18)] bg-[rgba(240,179,95,0.08)] px-2 py-1 text-[10px] font-medium text-[#f0b35f]">
                          runtime pending
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
