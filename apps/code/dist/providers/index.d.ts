import type { Provider } from './types.js';
export type { Provider, Message, ProviderResponse } from './types.js';
export { MockProvider } from './mock.js';
export { OpenAIProvider } from './openai.js';
export { OllamaProvider } from './ollama.js';
export * from './registry.js';
export declare function createProvider(providerName: string, config?: {
    baseUrl?: string;
    apiKey?: string;
}): Provider;
export declare function getProviderStatus(provider: Provider): string;
export declare function getModeLabel(providerName: string): string;
