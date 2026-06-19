export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}
export interface ProviderResponse {
    content: string;
    model: string;
    provider: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
    };
}
export interface Provider {
    name: string;
    chat(messages: Message[], model: string): Promise<ProviderResponse>;
    isAvailable(): Promise<boolean>;
}
