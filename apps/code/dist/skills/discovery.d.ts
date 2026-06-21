export interface SkillMetadata {
    name: string;
    path: string;
    description: string;
    tags: string[];
    products: string[];
    triggers: string[];
    priority: number;
    source: 'local' | 'user' | 'talocode' | 'bundled';
    hasSkillFile: boolean;
}
export declare function discoverSkills(): SkillMetadata[];
export declare function getSkillByName(name: string): SkillMetadata | null;
