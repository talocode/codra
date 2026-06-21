import { SkillMetadata } from './discovery.js';
export declare function formatSkillList(skills: SkillMetadata[]): string;
export declare function formatSkillRecommendations(skills: string[], task: string): string;
export declare function formatActiveSkills(skills: {
    name: string;
    content: string;
}[]): string;
