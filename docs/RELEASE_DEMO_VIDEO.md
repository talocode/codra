# Release Demo Video Workflow

Codra release videos are short Remotion clips that show the release feature in a terminal-first, dark theme style.

## Naming convention

Use:

- `codra-vX.Y.Z-demo.mp4`
- `signallane-vX.Y.Z-demo.mp4`
- `tradia-vX.Y.Z-demo.mp4`

For Codra v0.1.5 the target file is:

```text
apps/codra-demo-video/dist/codra-v0.1.5-demo.mp4
```

## Edit the demo

The current demo source lives in:

```text
apps/codra-demo-video/src/video.tsx
apps/codra-demo-video/src/root.tsx
```

Use the simple building blocks:

- `TerminalWindow`
- `TypingCommand`
- `FileTree`
- `Caption`
- `ReleaseCard`
- `TalocodeFooter`

## Render the MP4

From the repo root:

```bash
pnpm --dir apps/codra-demo-video demo:render
```

That command renders the composition to the release asset path.

## Upload to GitHub Release

After rendering:

```bash
gh release upload codra-v0.1.5 apps/codra-demo-video/dist/codra-v0.1.5-demo.mp4 --clobber
```

## Keep it small

- Do not commit large MP4 files unless explicitly necessary.
- Commit only the Remotion source and docs.
- Upload the rendered MP4 as a GitHub Release asset instead.
