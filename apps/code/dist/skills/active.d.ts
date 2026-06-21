export declare function setActiveSkill(name: string, content: string): void;
export declare function getActiveSkill(): {
    name: string;
    content: string;
} | null;
export declare function getActiveSkills(): {
    name: string;
    content: string;
}[];
export declare function clearActiveSkill(): void;
export declare function removeActiveSkill(name: string): void;
export declare function getActiveSkillContext(maxChars?: number): string;
