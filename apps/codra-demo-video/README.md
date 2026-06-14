# Codra Demo Video

Standalone Remotion project for the Codra v0.1.4 launch video.

## What this contains

- `src/video.tsx`: the 45-60 second demo composition
- `src/root.tsx`: Remotion composition registration
- `dist/codra-demo-v0.1.4.mp4`: render output target

## Install

From the repo root:

```bash
pnpm install
```

## Preview

```bash
pnpm --dir apps/codra-demo-video preview
```

## Render

```bash
pnpm --dir apps/codra-demo-video render
```

The MP4 renders to:

```text
apps/codra-demo-video/dist/codra-demo-v0.1.4.mp4
```

## Notes

- 1920x1080
- 30 fps
- About 60 seconds total
- Terminal-first, dark-mode styling
