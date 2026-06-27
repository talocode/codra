import type { Provider } from './types.js';
import { MockProvider } from './mock.js';
import { OpenAIProvider } from './openai.js';
import { OllamaProvider } from './ollama.js';
import { PROVIDER_REGISTRY, getProviderInfo, isLocalProvider } from './registry.js';

export type { Provider, Message, ProviderResponse } from './types.js';
export { MockProvider } from './mock.js';
export { OpenAIProvider } from './openai.js';
export { OllamaProvider } from './ollama.js';
export * from './registry.js';

export function createProvider(providerName: string, config?: { baseUrl?: string; apiKey?: string }): Provider {
  const name = providerName.toLowerCase();
  switch (name) {
    case 'mock':
      return new MockProvider();
    case 'ollama':
      return new OllamaProvider(config?.baseUrl);
    case 'openai':
    case 'gemini':
    case 'anthropic':
    case 'xai':
      // For hosted, use openai compatible if base or key, else will be gated by auth
      return new OpenAIProvider(config?.baseUrl, config?.apiKey);
    default:
      // unknown -> mock safe
      console.log(`Unknown provider ${providerName}, falling back to mock`);
      return new MockProvider();
  }
}

export function getProviderStatus(provider: Provider): string {
  return `${provider.name} provider`;
}

export function getModeLabel(providerName: string): string {
  return isLocalProvider(providerName) ? 'local' : 'hosted';
}
