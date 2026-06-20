# Codra TUI Design

Status: first implementation pass landed

## Video Access

- The reference video `"/Internal storage/Download/Finetuner.mp4"` was not accessible from this workspace at the time of writing.
- This spec therefore uses the requested Finetuner-inspired goals plus the current Codra architecture as the source of truth.
- When the video becomes accessible, this document should be updated with direct observations from the recording.

## Lessons To Apply

The intended Finetuner-style feel is:

- Simple first screen, not a busy dashboard.
- Strong hierarchy: one primary action, secondary actions below it.
- Fast keyboard-only flow.
- Clear empty states and lightweight status feedback.
- Panels that appear only when needed.
- Calm colors, restrained borders, and dense but readable spacing.
- Dark mode first, with a practical light mode for terminals that support it.
- The UI should feel like a tool, not a website in a terminal.

## Codra TUI Principles

- Home screen is the default `codra` experience.
- The TUI is a launcher and navigator, not a duplicate backend.
- Existing non-interactive commands keep their current behavior.
- The TUI calls existing domain logic and commands rather than reimplementing repository analysis or memory logic.
- Dark theme is the default.
- Light theme is a supported secondary mode, toggled on demand.
- Keep contrast high, borders subtle, and colors limited to semantic states.

## Proposed CLI Behavior

- `codra` opens the interactive home screen.
- `codra --help` remains a normal CLI help output.
- `codra doctor` remains a normal command.
- `codra understand` remains a normal command.
- `codra memory status` remains a normal command.

## Screen Map

### 1. Home

Primary landing screen.

Actions:

- Understand repo
- Memory context
- Doctor check
- Plugins
- Skills
- Hooks
- MCP info
- Exit

### 2. Understand Repo

Entry point for repository scanning and summary output.

Expected content:

- repo path
- scan summary
- detected stack
- recent findings
- next suggested action

### 3. Memory Context

Entry point for memory status and scoped context.

Expected content:

- memory provider state
- project memory summary
- user memory summary if available
- status / freshness indicators

### 4. Doctor Check

Entry point for health and readiness checks.

Expected content:

- environment readiness
- workspace availability
- tool availability
- warnings and errors

### 5. Plugins

Entry point for installed or available plugin metadata.

Expected content:

- plugin list
- enabled / disabled state
- brief capability summaries

### 6. Skills

Entry point for discovered skills or learned capabilities.

Expected content:

- skill list
- short descriptions
- activation hints

### 7. Hooks

Entry point for automation hooks.

Expected content:

- hook list
- trigger events
- last run status

### 8. MCP Info

Entry point for model/context protocol integration info.

Expected content:

- available servers
- connection status
- capability overview

## Navigation Model

- `↑` / `↓` and `k` / `j` move between items.
- `Enter` opens the selected item.
- `Esc` goes back one level.
- `q` exits the TUI.
- `?` shows keyboard shortcuts and usage hints.
- `t` toggles dark/light theme if supported.

Navigation behavior:

- Always keep a visible selection.
- Preserve the last selected item when returning to a screen.
- Avoid modal complexity unless a task requires it.
- Prefer one focused panel with optional side details over several competing panes.

## Layout Structure

### Home Screen

- Title row at the top.
- Short subtitle beneath the title.
- Main vertical action list centered or left-aligned, depending on terminal width.
- Right-side or lower detail panel only when an item is selected.
- Footer with shortcuts and current theme.

### Subscreens

- Main content panel.
- Compact status bar.
- Optional contextual help panel.
- Empty state or loading state replaces the content area rather than stacking more UI.

## Status Indicators

Use semantic, restrained indicators:

- success: ready / complete
- warning: attention needed
- error: failed / unavailable
- info: neutral progress

Rules:

- Do not overuse color.
- Pair color with text so the UI remains readable in monochrome terminals.
- Keep indicators short and consistent.

## Empty States

Empty states should explain:

- what is missing
- why the screen is empty
- what the user can do next

Examples:

- No repository detected.
- No memory files found yet.
- No plugins available.
- No hooks configured.

## Progress And Loading

- Use a compact spinner or progress line.
- Keep progress feedback in place, not as a full-screen interruption.
- Prefer a deterministic message when possible, such as `Scanning repo...`.
- Show elapsed activity only when useful.

## Error Handling

- Errors should be human-readable and short.
- Show the failure cause first.
- Show the next recovery step second.
- Keep tracebacks out of the default view unless explicitly requested.
- If a command can be retried, show that path in the same screen.

## Typography, Spacing, Borders

- Use one primary display font style and one muted metadata style.
- Prefer moderate line spacing with dense but not cramped rows.
- Use borders sparingly to separate regions.
- Keep padding consistent.
- Avoid decorative noise.
- Maintain a strong content hierarchy through size, weight, and spacing rather than color alone.

## Theme Tokens

### Dark Theme

- `background`: `#0b0f14`
- `surface`: `#11161d`
- `surfaceAlt`: `#161c24`
- `border`: `#273140`
- `textPrimary`: `#e6edf3`
- `textSecondary`: `#9da7b3`
- `textMuted`: `#6f7b87`
- `accent`: `#7aa2f7`
- `accentSoft`: `#2b3b5f`
- `success`: `#7ddc9a`
- `warning`: `#f4c96b`
- `error`: `#ff7a7a`
- `info`: `#8cc8ff`

### Light Theme

- `background`: `#f6f8fb`
- `surface`: `#ffffff`
- `surfaceAlt`: `#edf2f7`
- `border`: `#c8d1dc`
- `textPrimary`: `#14202b`
- `textSecondary`: `#5c6b78`
- `textMuted`: `#768391`
- `accent`: `#315efb`
- `accentSoft`: `#dbe5ff`
- `success`: `#15803d`
- `warning`: `#a16207`
- `error`: `#b42318`
- `info`: `#2563eb`

## Accessibility And Readability Rules

- Default to dark mode.
- Keep text readable in Termux, Linux terminals, and macOS terminals.
- Maintain strong contrast between text and background.
- Do not rely on color alone to indicate state.
- Ensure all navigation works from keyboard only.
- Keep shortcut hints visible or one key away.
- Do not trap focus.
- Support narrow terminal widths with graceful stacking.

## Implementation Architecture

### Recommended Crates

- `ratatui` for terminal layout and rendering.
- `crossterm` for input, alternate screen handling, and theme-aware terminal control.
- `clap` remains the command parser for non-interactive commands.

### Integration Rules

- The interactive TUI should sit above existing command/domain modules.
- The TUI should call existing repo scanning, memory, and doctor logic through shared Rust modules.
- The TUI should not duplicate business logic.
- The interactive entrypoint should be a thin shell that dispatches into the right existing module.

### Command Routing Proposal

- `codra` with no subcommand launches TUI.
- `codra --help` prints help and exits.
- Explicit subcommands bypass the TUI.
- This keeps scripted and automation use cases stable.

## First Implementation PR Plan

### PR 1

Title: `feat(tui): add interactive Codra home screen`

Scope:

- Add the TUI shell and home screen.
- Wire keyboard navigation.
- Wire theme toggling.
- Add a shortcuts overlay.
- Keep current non-interactive commands working.

### PR 2

Add the `Understand Repo`, `Memory Context`, and `Doctor Check` screens.

### PR 3

Add `Plugins`, `Skills`, `Hooks`, and `MCP Info` screens.

### PR 4

Polish empty states, error states, and terminal-width fallback behavior.

## Open Questions

- Exact Finetuner visual details still need a direct pass over the video once it is accessible.
- Whether the home screen should be centered or left-aligned on wide terminals should be decided from a prototype.
- Whether the TUI should remember the last screen between launches is undecided.
