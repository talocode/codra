let activeSkillName = null;
let activeSkillContent = null;
export function setActiveSkill(name, content) {
    activeSkillName = name;
    activeSkillContent = content;
}
export function getActiveSkill() {
    if (activeSkillName && activeSkillContent) {
        return { name: activeSkillName, content: activeSkillContent };
    }
    return null;
}
export function clearActiveSkill() {
    activeSkillName = null;
    activeSkillContent = null;
}
