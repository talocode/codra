import type { SetupReport } from './types.js';
export declare function saveSetupReport(report: SetupReport): void;
export declare function loadSetupReport(cwd: string): SetupReport | null;
