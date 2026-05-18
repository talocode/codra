import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  PROVIDERS,
  MODELS,
  loadModelConfig,
  saveModelConfig,
  getModelLabel,
} from '../lib/modelConfig';
import type { Provider, ModelConfig } from '../lib/modelConfig';

interface ModelPickerProps {
  compact?: boolean;
  onChange?: (config: ModelConfig) => void;
}

export function ModelPicker({ compact = false, onChange }: ModelPickerProps) {
  const [config, setConfig] = useState<ModelConfig>(loadModelConfig());
  const [open, setOpen] = useState(false);
  const [selectedProviderTab, setSelectedProviderTab] = useState<Provider>(config.selectedProvider);

  const currentLabel = getModelLabel(config.selectedProvider, config.selectedModel);

  function updateConfig(partial: Partial<ModelConfig>) {
    const next = saveModelConfig(partial);
    setConfig(next);
    onChange?.(next);
  }

  function selectProvider(p: Provider) {
    const firstModel = MODELS[p][0]?.id || '';
    updateConfig({ selectedProvider: p, selectedModel: firstModel });
    setSelectedProviderTab(p);
    setOpen(false);
  }

  function selectModel(modelId: string) {
    updateConfig({ selectedModel: modelId });
    setOpen(false);
  }

  // Compact premium dropdown used inside composer
  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-[#0a0f18] px-3 py-1.5 text-xs hover:bg-white/[0.05]"
        >
          <span className="font-medium text-violet-300">{config.selectedProvider}</span>
          <span className="text-zinc-500">·</span>
          <span className="text-zinc-300">{currentLabel}</span>
          <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
        </button>

        {open && (
          <div className="absolute left-0 z-50 mt-1.5 w-[280px] rounded-xl border border-white/[0.08] bg-[#0a0f18] p-2 shadow-2xl">
            {/* Providers */}
            <div className="mb-1 px-2 text-[10px] uppercase tracking-widest text-zinc-500">Providers</div>
            <div className="mb-2 space-y-px">
              {PROVIDERS.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setSelectedProviderTab(p);
                    selectProvider(p);
                  }}
                  className={`flex w-full items-center justify-between rounded px-3 py-1.5 text-sm hover:bg-white/[0.04] ${
                    p === config.selectedProvider ? 'text-white' : 'text-zinc-300'
                  }`}
                >
                  {p}
                  {p !== 'Local' && p !== 'Claude' && (
                    <span className="rounded bg-amber-500/10 px-1.5 py-px text-[9px] text-amber-400">runtime pending</span>
                  )}
                </button>
              ))}
            </div>

            {/* Models for selected provider */}
            <div className="border-t border-white/[0.06] pt-2">
              <div className="mb-1 px-2 text-[10px] uppercase tracking-widest text-zinc-500">
                {selectedProviderTab} models
              </div>
              {MODELS[selectedProviderTab].map((m) => (
                <button
                  key={m.id}
                  onClick={() => selectModel(m.id)}
                  className="flex w-full items-center justify-between rounded px-3 py-1.5 text-sm text-zinc-200 hover:bg-white/[0.05]"
                >
                  <span>{m.label}</span>
                  {!m.available && (
                    <span className="text-[10px] text-amber-400">runtime pending</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full non-compact picker (rarely used)
  return (
    <div className="flex items-center gap-2">
      <select
        value={config.selectedProvider}
        onChange={(e) => {
          const p = e.target.value as Provider;
          const firstModel = MODELS[p][0]?.id || '';
          updateConfig({ selectedProvider: p, selectedModel: firstModel });
        }}
        className="rounded-md border border-white/[0.1] bg-[#111724] px-3 py-2 text-sm"
      >
        {PROVIDERS.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
      <select
        value={config.selectedModel}
        onChange={(e) => updateConfig({ selectedModel: e.target.value })}
        className="rounded-md border border-white/[0.1] bg-[#111724] px-3 py-2 text-sm"
      >
        {MODELS[config.selectedProvider].map((m) => (
          <option key={m.id} value={m.id}>{m.label}</option>
        ))}
      </select>
    </div>
  );
}
