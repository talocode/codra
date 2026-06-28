export const PROVIDER_REGISTRY = [
    {
        name: 'mock',
        label: 'Mock (local, no API)',
        hosted: false,
        needsAuth: false,
        local: true,
        models: ['mock'],
        description: 'Offline mock for testing',
    },
    {
        name: 'ollama',
        label: 'Ollama (local)',
        hosted: false,
        needsAuth: false,
        local: true,
        models: ['llama3.2', 'llama3.1', 'codellama', 'mistral', 'qwen2.5'],
        description: 'Run models locally via Ollama',
    },
    {
        name: 'openai',
        label: 'OpenAI',
        hosted: true,
        needsAuth: true,
        local: false,
        models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'],
        description: 'OpenAI hosted models (requires Tera auth or API key)',
    },
    {
        name: 'gemini',
        label: 'Google Gemini',
        hosted: true,
        needsAuth: true,
        local: false,
        models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-flash'],
        description: 'Google Gemini via Tera or direct',
    },
    {
        name: 'anthropic',
        label: 'Anthropic Claude',
        hosted: true,
        needsAuth: true,
        local: false,
        models: ['claude-3-5-sonnet', 'claude-3-haiku'],
        description: 'Anthropic models (hosted)',
    },
    {
        name: 'xai',
        label: 'xAI Grok',
        hosted: true,
        needsAuth: true,
        local: false,
        models: ['grok-3', 'grok-2'],
        description: 'xAI hosted (via Tera)',
    },
];
export function getProviderInfo(name) {
    return PROVIDER_REGISTRY.find(p => p.name.toLowerCase() === name.toLowerCase());
}
export function getAvailableProviders() {
    return [...PROVIDER_REGISTRY];
}
export function isLocalProvider(name) {
    const info = getProviderInfo(name);
    return info ? info.local : false;
}
export function isHostedProvider(name) {
    const info = getProviderInfo(name);
    return info ? info.hosted : true;
}
export function getDefaultModelForProvider(name) {
    const info = getProviderInfo(name);
    if (info && info.models.length > 0)
        return info.models[0];
    return 'default';
}
