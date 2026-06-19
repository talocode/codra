import { MockProvider } from './mock.js';
import { OpenAIProvider } from './openai.js';
import { OllamaProvider } from './ollama.js';
export { MockProvider } from './mock.js';
export { OpenAIProvider } from './openai.js';
export { OllamaProvider } from './ollama.js';
export function createProvider(providerName, config) {
    switch (providerName.toLowerCase()) {
        case 'mock':
            return new MockProvider();
        case 'openai':
            return new OpenAIProvider(config?.baseUrl, config?.apiKey);
        case 'ollama':
            return new OllamaProvider(config?.baseUrl);
        default:
            throw new Error(`Unknown provider: ${providerName}. Supported: mock, openai, ollama`);
    }
}
export function getProviderStatus(provider) {
    return `${provider.name} provider`;
}
