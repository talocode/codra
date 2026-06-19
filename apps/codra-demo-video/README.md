# Codra Demo Video

Standalone Remotion project for the Codra v0.1.5 release video.

## What this contains

- `src/video.tsx`: the 35-60 second demo composition
- `src/root.tsx`: Remotion composition registration
- `dist/codra-v0.1.5-demo.mp4`: render output target

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
pnpm --dir apps/codra-demo-video demo:render
```

The MP4 renders to:

```text
apps/codra-demo-video/dist/codra-v0.1.5-demo.mp4
```

## Notes

- 1920x1080
- 6 fps (render-friendly)
- About 54 seconds total
- Terminal-first, dark-mode styling
- No voice required
