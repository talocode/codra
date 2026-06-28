export interface ComposerState {
    provider: string;
    model: string;
    mode: string;
    editPolicy: string;
    cols: number;
}
export declare function getComposerState(): ComposerState;
export declare function renderComposer(state?: ComposerState): void;
export declare function renderStatusLine(): string;
export declare function getFooterLine(): string;
