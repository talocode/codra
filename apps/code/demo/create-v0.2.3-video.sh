#!/bin/bash
set -euo pipefail

# Codra Code v0.2.3 Demo Video Generator
# Creates a terminal-style demo with Talocode branding

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUTPUT="${ROOT}/docs/release/codra-code-v0.2.3-demo.mp4"
TEMP_DIR="${ROOT}/demo/temp-v0.2.3"

mkdir -p "$TEMP_DIR"

# Talocode color scheme
BG="0x1C1C1C"
PRIMARY="0x58C4DD"
SECONDARY="0x83C167"
ACCENT="0xFFFF00"
TEXT="0xFFFFFF"
DIM="0x888888"
GREEN="0x3FB950"
BLUE="0x58A6FF"

FONT="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_REGULAR="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_MONO="/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"

scene() {
  local id="$1"
  local duration="$2"
  shift 2
  ffmpeg -y -f lavfi -i "color=c=$BG:s=1920x1080:d=$duration" \
    -vf "$*" \
    -c:v libx264 -pix_fmt yuv420p "$TEMP_DIR/scene${id}.mp4" 
}

echo "Scene 1: Hook"
scene 1 8 \
  "drawtext=text='Codra Code v0.2.3':fontsize=72:fontcolor=$PRIMARY:x=(w-text_w)/2:y=320:fontfile=$FONT,\
  drawtext=text='Auth, Slash Commands & Model Picker':fontsize=36:fontcolor=$TEXT:x=(w-text_w)/2:y=440:fontfile=$FONT_REGULAR,\
  drawtext=text='Local-first coding agent CLI from Talocode':fontsize=28:fontcolor=$DIM:x=(w-text_w)/2:y=520:fontfile=$FONT_REGULAR"

echo "Scene 2: Install"
scene 2 7 \
  "drawtext=text='Install globally with npm':fontsize=42:fontcolor=$PRIMARY:x=360:y=260:fontfile=$FONT,\
  drawtext=text='npm install -g @talocode/codra-code@0.2.3':fontsize=32:fontcolor=$TEXT:x=360:y=380:fontfile=$FONT_MONO,\
  drawtext=text='✓ @talocode/codra-code@0.2.3 installed':fontsize=24:fontcolor=$SECONDARY:x=360:y=480:fontfile=$FONT_REGULAR"

echo "Scene 3: Help"
scene 3 7 \
  "drawtext=text='Check available commands':fontsize=42:fontcolor=$PRIMARY:x=360:y=260:fontfile=$FONT,\
  drawtext=text='codra-code --help':fontsize=32:fontcolor=$TEXT:x=360:y=380:fontfile=$FONT_MONO,\
  drawtext=text='Commands - auth model status help':fontsize=24:fontcolor=$DIM:x=360:y=480:fontfile=$FONT_REGULAR"

echo "Scene 4: Auth Status"
scene 4 6 \
  "drawtext=text='Check authentication status':fontsize=42:fontcolor=$PRIMARY:x=360:y=260:fontfile=$FONT,\
  drawtext=text='codra-code auth status':fontsize=32:fontcolor=$TEXT:x=360:y=380:fontfile=$FONT_MONO,\
  drawtext=text='Auth - Not signed in - Mode - Local':fontsize=24:fontcolor=$DIM:x=360:y=480:fontfile=$FONT_REGULAR"

echo "Scene 5: Local Mode"
scene 5 7 \
  "drawtext=text='Local mode works without sign-in':fontsize=42:fontcolor=$PRIMARY:x=360:y=260:fontfile=$FONT,\
  drawtext=text='codra-code --mock status':fontsize=32:fontcolor=$TEXT:x=360:y=380:fontfile=$FONT_MONO,\
  drawtext=text='Provider - mock - Mode - Local - Ready':fontsize=24:fontcolor=$SECONDARY:x=360:y=480:fontfile=$FONT_REGULAR"

echo "Scene 6: Model Picker"
scene 6 7 \
  "drawtext=text='Switch models with slash commands':fontsize=42:fontcolor=$PRIMARY:x=360:y=260:fontfile=$FONT,\
  drawtext=text='codra-code --mock model':fontsize=32:fontcolor=$TEXT:x=360:y=380:fontfile=$FONT_MONO,\
  drawtext=text='model - Select provider and model':fontsize=24:fontcolor=$DIM:x=360:y=480:fontfile=$FONT_REGULAR"

echo "Scene 7: Architecture"
scene 7 10 \
  "drawtext=text='Hosted vs Local':fontsize=42:fontcolor=$ACCENT:x=360:y=220:fontfile=$FONT,\
  drawtext=text='Hosted usage requires Tera Talocode account':fontsize=28:fontcolor=$TEXT:x=360:y=340:fontfile=$FONT_REGULAR,\
  drawtext=text='Local mode remains open without auth':fontsize=28:fontcolor=$SECONDARY:x=360:y=400:fontfile=$FONT_REGULAR,\
  drawtext=text='Local-first always':fontsize=24:fontcolor=$DIM:x=360:y=480:fontfile=$FONT_REGULAR"

echo "Scene 8: CTA"
scene 8 8 \
  "drawtext=text='Codra Code v0.2.3':fontsize=72:fontcolor=$PRIMARY:x=(w-text_w)/2:y=300:fontfile=$FONT,\
  drawtext=text='npm install -g @talocode/codra-code@0.2.3':fontsize=30:fontcolor=$TEXT:x=(w-text_w)/2:y=430:fontfile=$FONT_MONO,\
  drawtext=text='github.com/talocode/codra':fontsize=34:fontcolor=$BLUE:x=(w-text_w)/2:y=520:fontfile=$FONT_REGULAR,\
  drawtext=text='Local-first CLI - hosted API optional':fontsize=24:fontcolor=$DIM:x=(w-text_w)/2:y=590:fontfile=$FONT_REGULAR"

cat > "$TEMP_DIR/concat.txt" << EOF
file 'scene1.mp4'
file 'scene2.mp4'
file 'scene3.mp4'
file 'scene4.mp4'
file 'scene5.mp4'
file 'scene6.mp4'
file 'scene7.mp4'
file 'scene8.mp4'
EOF

ffmpeg -y -f concat -safe 0 -i "$TEMP_DIR/concat.txt" -c copy "$TEMP_DIR/video_no_audio.mp4"

# Add subtle background audio
ffmpeg -y -f lavfi -i "sine=frequency=330:duration=50" -af "volume=0.015" -c:a aac "$TEMP_DIR/bg_audio.m4a"

ffmpeg -y -i "$TEMP_DIR/video_no_audio.mp4" -i "$TEMP_DIR/bg_audio.m4a" \
  -c:v copy -c:a aac -shortest "$OUTPUT"

rm -rf "$TEMP_DIR"

echo "Demo video created: $OUTPUT"
ls -lh "$OUTPUT"
