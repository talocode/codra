export interface Config {
    provider: string;
    model: string;
    apiKey: string;
    baseUrl: string;
    mockMode: boolean;
}
export declare function loadConfig(): Promise<Config>;
export declare function getConfig(): Config;
export declare function updateConfig(updates: Partial<Config>): void;
export declare function isSecretsFile(filePath: string): boolean;
