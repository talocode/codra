export interface SkillsConfig {
    paths: string[];
    active: string[];
    autoRecommend: boolean;
    maxActiveSkills: number;
    maxSkillContextChars: number;
}
export declare function loadSkillsConfig(): SkillsConfig;
export declare function saveSkillsConfig(config: SkillsConfig): void;
export declare function getAllSkillPaths(): string[];
