# Codra Visual Context

Using screenshots of browser states, UI bugs, dashboards, and docs pages as visual context for debugging and understanding.

## Purpose

Codra can benefit from visual context when debugging UI issues, understanding dashboard layouts, or analyzing documentation that is primarily visual. Screenshots capture what the user sees — including layout, color, spacing, and visual states that text extraction cannot convey.

## When Visual Context Helps

- **UI bug reproduction** — capture the buggy state for analysis
- **Dashboard understanding** — read data from visual dashboards
- **Documentation with diagrams** — architecture diagrams, flowcharts, network topology
- **Error states** — visual error messages, validation states, toast notifications
- **Before/after comparison** — visual diffs during refactoring
- **Terminal output** — color-coded output, prompt structure, alignment

## How It Would Work

1. User captures a screenshot of the current state
2. Screenshot + optional text context sent to AI
3. AI analyzes the visual content
4. Returns structured analysis: visible elements, issues identified, suggestions
5. User can save analysis as project context for future debugging

## Privacy Rules

- Capture must be user-triggered
- Do not capture sensitive dashboards without approval
- Screenshots are ephemeral by default
- Save-to-memory stores derived notes, not raw images

## Status

This is a planned capability. No implementation yet. The Tera Visual Context layer provides the reference architecture for visual context integration.
