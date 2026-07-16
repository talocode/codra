import type { Provider } from './types.js';
import { MockProvider } from './mock.js';
import { OpenAIProvider } from './openai.js';
import { OllamaProvider } from './ollama.js';
import { TeraProvider } from './tera.js';

export type { Provider, Message, ProviderResponse } from './types.js';
export { MockProvider } from './mock.js';
export { OpenAIProvider } from './openai.js';
export { OllamaProvider } from './ollama.js';
export { TeraProvider } from './tera.js';

export function createProvider(providerName: string, config?: { baseUrl?: string; apiKey?: string }): Provider {
  switch (providerName.toLowerCase()) {
    case 'mock':
      return new MockProvider();
    case 'openai':
      return new OpenAIProvider(config?.baseUrl, config?.apiKey);
    case 'ollama':
      return new OllamaProvider(config?.baseUrl);
    case 'tera':
      return new TeraProvider(config?.baseUrl);
    default:
      throw new Error(`Unknown provider: ${providerName}. Supported: mock, openai, ollama, tera`);
  }
}

export function getProviderStatus(provider: Provider): string {
  return `${provider.name} provider`;
}
