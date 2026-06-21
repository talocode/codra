export declare const theme: {
    accent: import("chalk").ChalkInstance;
    accentDim: import("chalk").ChalkInstance;
    white: import("chalk").ChalkInstance;
    bold: import("chalk").ChalkInstance;
    gray: import("chalk").ChalkInstance;
    dim: import("chalk").ChalkInstance;
    green: import("chalk").ChalkInstance;
    cyan: import("chalk").ChalkInstance;
    yellow: import("chalk").ChalkInstance;
    red: import("chalk").ChalkInstance;
    muted: import("chalk").ChalkInstance;
    border: {
        top: (w: number) => string;
        frame: (content: string) => string;
    };
    section: (label: string, value: string) => string;
    shortcut: (key: string, label: string) => string;
};
