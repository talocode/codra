# Codra Code v0.1.6 Launch Video Plan

## Video Title

"Codra Code v0.1.6 Launch Video"

## Positioning

"A local-first, open-source coding agent CLI for real software work."

## Core Hook (0–3s)

**Hook:** "Install a local-first coding agent in one command."

This immediately shows value - no setup, no config, just install and use.

## Video Structure (35–60 seconds)

### Scene 1: Hook (0–3s)
- **Visual:** Terminal window with `npm install -g @talocode/codra-code` executing
- **Caption:** "Install a local-first coding agent in one command"
- **Narration:** "Install a local-first coding agent in one command."
- **Command:** `npm install -g @talocode/codra-code`
- **Attention:** Hook - stop the scroll immediately

### Scene 2: Pain/Context (3–8s)
- **Visual:** Split screen showing frustrating AI coding experiences
- **Caption:** "Tired of black-box AI that doesn't understand your code?"
- **Narration:** "Tired of AI tools that can't see your code, don't understand your project, and require constant context?"
- **Attention:** Retention - create curiosity

### Scene 3: Product Workflow (8–25s)
- **Visual:** Terminal showing Codra Code in action
- **Caption:** "Codra Code runs locally, reads your files, and executes with full context"
- **Narration:** "Codra Code runs on your machine. It reads your files, understands your project, and executes with full context."
- **Commands shown:**
  - `codra-code --version`
  - `codra-code --help`
  - `codra-code --mock "/status"`
- **Attention:** Retention - keep watching

### Scene 4: Skills & Plugins (25–35s)
- **Visual:** Terminal showing skills and plugins
- **Caption:** "Built-in skills, plugins, and MCP support"
- **Narration:** "With built-in skills, plugins, and MCP support, Codra Code adapts to your workflow."
- **Commands shown:**
  - `codra-code --mock "/skills"`
  - `codra-code --mock "/plugins"`
- **Attention:** Retention - show depth

### Scene 5: Tera Integration (35–42s)
- **Visual:** Terminal showing Tera login
- **Caption:** "Authenticate with Tera for the full ecosystem"
- **Narration:** "Sign in with Tera to unlock the full ecosystem of AI tools."
- **Command:** `codra-code login`
- **Attention:** Emotion - ecosystem connection

### Scene 6: Proof (42–50s)
- **Visual:** Terminal showing git integration and file editing
- **Caption:** "Real git integration, real file editing, real control"
- **Narration:** "Real git integration. Real file editing. Real control over your codebase."
- **Commands shown:**
  - `codra-code --mock "/git status"`
  - `codra-code --mock "/read package.json"`
- **Attention:** Proof - show it works

### Scene 7: CTA/Distribution (50–58s)
- **Visual:** GitHub release page and npm page
- **Caption:** "Available now on npm and GitHub"
- **Narration:** "Available now on npm and GitHub. Start building with Codra Code today."
- **Links shown:**
  - npm: `npm install -g @talocode/codra-code`
  - GitHub: `github.com/talocode/codra`
- **Attention:** Distribution - make it shareable

### Scene 8: Closing (58–60s)
- **Visual:** Codra Code logo and tagline
- **Caption:** "Codra Code — A local-first coding agent for real software work"
- **Narration:** "Codra Code. A local-first coding agent for real software work."
- **Attention:** Distribution - brand recall

## Emotional Angle

- **Local-first control:** Your code stays on your machine
- **Open-source builders:** Built by and for developers
- **No black-box workflow:** Full transparency and control
- **Agents with skills, MCP, plugins, git, file editing:** Complete toolset
- **Tera login loop:** Ecosystem connection and community

## Required Command Shots

```bash
# Installation
npm install -g @talocode/codra-code

# Version check
codra-code --version

# Authentication
codra-code login
codra-code auth

# Help
codra-code --help

# Status (mock mode)
codra-code --mock "/status"

# Skills
codra-code --mock "/skills"

# Plugins
codra-code --mock "/plugins"

# Git integration
codra-code --mock "/git status"

# File reading
codra-code --mock "/read package.json"
```

## Distribution Plan

### X (Twitter)
- **Aspect ratio:** 16:9
- **Length:** 35-60 seconds
- **Caption style:** Bold, short, punchy
- **CTA:** "Install now: npm install -g @talocode/codra-code"

### LinkedIn
- **Aspect ratio:** 16:9 or 1:1
- **Length:** 45-60 seconds
- **Caption style:** Professional, detailed
- **CTA:** "Try Codra Code for your next project"

### YouTube Shorts
- **Aspect ratio:** 9:16 (vertical)
- **Length:** 30-60 seconds
- **Caption style:** Large, readable on mobile
- **CTA:** "Link in description"

### Instagram Reels
- **Aspect ratio:** 9:16 (vertical)
- **Length:** 30-60 seconds
- **Caption style:** Visual-first, clean
- **CTA:** "Link in bio"

### WhatsApp Status
- **Aspect ratio:** 9:16 (vertical)
- **Length:** 15-30 seconds
- **Caption style:** Clear, minimal text
- **CTA:** "Try it now"

## Renderer Decision

**Primary Renderer:** Remotion

**Why Remotion:**
- React-based (familiar for web developers)
- Programmatic animations for terminal demos
- TypeScript support
- Easy to version control
- Clean, professional output
- Good for CLI demo videos

**Alternative:** HyperFrames-style HTML if we want faster typography/motion, but Remotion is better for component-driven CLI demos.

## Quality Checklist

- [ ] First 3 seconds hook is strong
- [ ] Captions are readable on mobile
- [ ] No fake output shown
- [ ] CTA is visible
- [ ] Can be understood with sound off
- [ ] Release link included
- [ ] npm install command shown
- [ ] Sponsor link optional
- [ ] Every scene has one job
- [ ] Dead time is removed
- [ ] Emotional reason to care is present
- [ ] Result/proof is shown
- [ ] Can be repurposed to 3+ platforms

## Final X Post Copy

**Post from @talocode:**

🚀 Codra Code v0.1.6 is live on npm!

Install a local-first coding agent in one command:
`npm install -g @talocode/codra-code`

What you get:
✅ Local-first execution
✅ Full project context
✅ Built-in skills & plugins
✅ Git integration
✅ Tera ecosystem

No black-box AI. No cloud dependency. Just code.

Try it: https://www.npmjs.com/package/@talocode/codra-code
GitHub: https://github.com/talocode/codra

#OpenSource #AI #CodingAgent #LocalFirst #Talocode

---

## Validation

- [ ] File created at `docs/videos/codra-code-v0.1.6-launch.md`
- [ ] Git status shows changes
- [ ] Ready to commit and push

## Next Step

Render the video using Remotion or HyperFrames with the storyboard above.
