import { loadSkillsConfig } from './config.js';
let activeSkills = [];
export function setActiveSkill(name, content) {
    const config = loadSkillsConfig();
    activeSkills = activeSkills.filter(s => s.name !== name);
    activeSkills.push({ name, content });
    // Enforce max active skills limit
    while (activeSkills.length > config.maxActiveSkills) {
        activeSkills.shift();
    }
}
export function getActiveSkill() {
    return activeSkills.length > 0 ? activeSkills[0] : null;
}
export function getActiveSkills() {
    return [...activeSkills];
}
export function clearActiveSkill() {
    activeSkills = [];
}
export function removeActiveSkill(name) {
    activeSkills = activeSkills.filter(s => s.name !== name);
}
export function getActiveSkillContext(maxChars) {
    if (activeSkills.length === 0)
        return '';
    const config = loadSkillsConfig();
    const limit = maxChars ?? config.maxSkillContextChars;
    const parts = [];
    let totalChars = 0;
    for (const skill of activeSkills) {
        if (totalChars >= limit)
            break;
        const truncated = skill.content.substring(0, limit - totalChars);
        parts.push(`## ${skill.name}\n\n${truncated}`);
        totalChars += truncated.length;
    }
    return parts.join('\n\n');
}
