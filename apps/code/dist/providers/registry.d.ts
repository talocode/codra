export interface ProviderInfo {
    name: string;
    label: string;
    hosted: boolean;
    needsAuth: boolean;
    local: boolean;
    models: string[];
    description?: string;
}
export declare const PROVIDER_REGISTRY: ProviderInfo[];
export declare function getProviderInfo(name: string): ProviderInfo | undefined;
export declare function getAvailableProviders(): ProviderInfo[];
export declare function isLocalProvider(name: string): boolean;
export declare function isHostedProvider(name: string): boolean;
export declare function getDefaultModelForProvider(name: string): string;
