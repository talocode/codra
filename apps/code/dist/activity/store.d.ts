import { ActivityEvent, ActivityConfig } from './types.js';
export declare function trackEvent(event: ActivityEvent): void;
export declare function getEvents(): ActivityEvent[];
export declare function getActivityConfig(): ActivityConfig;
