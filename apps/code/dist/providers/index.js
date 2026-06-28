import { MockProvider } from './mock.js';
import { OpenAIProvider } from './openai.js';
import { OllamaProvider } from './ollama.js';
import { isLocalProvider } from './registry.js';
export { MockProvider } from './mock.js';
export { OpenAIProvider } from './openai.js';
export { OllamaProvider } from './ollama.js';
export * from './registry.js';
export function createProvider(providerName, config) {
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
export function getProviderStatus(provider) {
    return `${provider.name} provider`;
}
export function getModeLabel(providerName) {
    return isLocalProvider(providerName) ? 'local' : 'hosted';
}
