import { Plan } from './types.js';
export declare function savePlan(plan: Plan): void;
export declare function getPlan(id: string): Plan | null;
export declare function listPlans(): Plan[];
export declare function deletePlan(id: string): boolean;
