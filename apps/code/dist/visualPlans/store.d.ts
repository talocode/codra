import { VisualPlan } from './types.js';
export declare function saveVisualPlan(plan: VisualPlan): void;
export declare function getVisualPlan(id: string): VisualPlan | null;
export declare function listVisualPlans(): VisualPlan[];
export declare function deleteVisualPlan(id: string): boolean;
