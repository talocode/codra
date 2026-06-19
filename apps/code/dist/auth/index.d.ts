export interface AuthToken {
    userId: string;
    email: string;
    accessToken: string;
    refreshToken?: string;
    expiresAt: string;
    createdAt: string;
    source: string;
}
export declare function getAuthBaseUrl(): string;
export declare function getAuthFilePath(): string;
export declare function isAuthenticated(): boolean;
export declare function getAuthToken(): AuthToken | null;
export declare function saveAuthToken(token: AuthToken): Promise<void>;
export declare function clearAuthToken(): Promise<void>;
export declare function startLogin(options?: {
    noBrowser?: boolean;
    authUrl?: string;
}): Promise<boolean>;
export declare function authStatus(): Promise<void>;
export declare function requireAuth(): boolean;
