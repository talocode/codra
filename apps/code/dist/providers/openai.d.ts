import { Provider, Message, ProviderResponse } from './types.js';
export declare class OpenAIProvider implements Provider {
    name: string;
    private baseUrl;
    private apiKey;
    constructor(baseUrl?: string, apiKey?: string);
    chat(messages: Message[], model: string): Promise<ProviderResponse>;
    isAvailable(): Promise<boolean>;
}
