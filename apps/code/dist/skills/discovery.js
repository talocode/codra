import * as fs from 'fs';
import * as path from 'path';
import { getAllSkillPaths, loadSkillsConfig } from './config.js';
function extractMetadata(skillDir, skillName, source) {
    const skillFile = path.join(skillDir, skillName, 'SKILL.md');
    if (!fs.existsSync(skillFile)) {
        return null;
    }
    try {
        const content = fs.readFileSync(skillFile, 'utf-8');
        const lines = content.split('\n');
        // Extract description from first non-heading, non-empty line
        let description = '';
        for (const line of lines) {
            if (line.startsWith('#') || line.trim() === '')
                continue;
            description = line.trim();
            break;
        }
        // Infer tags from content
        const tags = [];
        const contentLower = content.toLowerCase();
        if (contentLower.includes('debug'))
            tags.push('debugging');
        if (contentLower.includes('design'))
            tags.push('design');
        if (contentLower.includes('video'))
            tags.push('video');
        if (contentLower.includes('plan'))
            tags.push('planning');
        if (contentLower.includes('search'))
            tags.push('search');
        if (contentLower.includes('context'))
            tags.push('context');
        if (contentLower.includes('theme'))
            tags.push('theme');
        if (contentLower.includes('visual'))
            tags.push('visual');
        if (contentLower.includes('workflow'))
            tags.push('workflow');
        // Infer products
        const products = [];
        if (contentLower.includes('tera'))
            products.push('tera');
        if (contentLower.includes('codra'))
            products.push('codra');
        if (contentLower.includes('cliploop'))
            products.push('cliploop');
        if (contentLower.includes('tradia'))
            products.push('tradia');
        if (contentLower.includes('worklane'))
            products.push('worklane');
        return {
            name: skillName,
            path: skillDir,
            description: description.substring(0, 100),
            tags,
            products,
            triggers: [],
            priority: 1,
            source,
            hasSkillFile: true
        };
    }
    catch {
        return null;
    }
}
export function discoverSkills() {
    const skills = [];
    const config = loadSkillsConfig();
    const searchPaths = getAllSkillPaths();
    const sources = searchPaths.map((dir, i) => ({
        dir,
        source: i === 0 ? 'local' : i === 1 ? 'talocode' : 'user'
    }));
    for (const { dir, source } of sources) {
        if (!fs.existsSync(dir))
            continue;
        const items = fs.readdirSync(dir).filter(f => {
            const skillFile = path.join(dir, f, 'SKILL.md');
            return fs.existsSync(skillFile);
        });
        for (const item of items) {
            const metadata = extractMetadata(dir, item, source);
            if (metadata) {
                skills.push(metadata);
            }
        }
    }
    return skills;
}
export function getSkillByName(name) {
    const skills = discoverSkills();
    return skills.find(s => s.name === name) || null;
}
