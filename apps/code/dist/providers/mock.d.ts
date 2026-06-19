import { Provider, Message, ProviderResponse } from './types.js';
export declare class MockProvider implements Provider {
    name: string;
    chat(messages: Message[], model: string): Promise<ProviderResponse>;
    isAvailable(): Promise<boolean>;
}
