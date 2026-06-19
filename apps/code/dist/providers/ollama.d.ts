import { Provider, Message, ProviderResponse } from './types.js';
export declare class OllamaProvider implements Provider {
    name: string;
    private baseUrl;
    constructor(baseUrl?: string);
    chat(messages: Message[], model: string): Promise<ProviderResponse>;
    isAvailable(): Promise<boolean>;
}
