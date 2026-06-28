#!/bin/bash
set -euo pipefail

# Codra Code v0.2.4 Demo Video Generator
# Creates a polished terminal-style demo with Talocode branding

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUTPUT="${ROOT}/demo/codra-code-v0.2.4-demo.mp4"
TEMP_DIR="${ROOT}/demo/temp-v0.2.4"

mkdir -p "$TEMP_DIR"

# Talocode brand colors (hex for ffmpeg)
BG="0x0D1117"
SURFACE="0x161B22"
BORDER="0x30363D"
PRIMARY="0x58A6FF"
SECONDARY="0x3FB950"
ACCENT="0xF0F6FC"
DIM="0x8B949E"
BRAND="0x58C4DD"
WARNING="0xD29922"

# Font paths
FONT="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_REGULAR="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_MONO="/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"

cleanup() {
  rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

scene() {
  local id="$1"
  local duration="$2"
  local filters="$3"
  ffmpeg -y -f lavfi -i "color=c=$BG:s=1920x1080:d=$duration:r=30" \
    -vf "$filters" \
    -c:v libx264 -pix_fmt yuv420p "$TEMP_DIR/scene${id}.mp4"
}

add_audio() {
  local video="$1"
  local output="$2"
  local duration="$3"
  ffmpeg -y -f lavfi -i "sine=frequency=330:duration=$duration" -af "volume=0.012" -c:a aac "$TEMP_DIR/bg_audio.m4a"
  ffmpeg -y -i "$video" -i "$TEMP_DIR/bg_audio.m4a" -c:v copy -c:a aac -shortest "$output"
}

echo "=== Codra Code v0.2.4 Demo Video ==="
echo ""

# --- Scene 1: Opening Hook (6s) ---
echo "Scene 1: Opening Hook"
scene 1 6 \
"drawtext=text='Codra Code':fontsize=72:fontcolor=$BRAND:x=(w-text_w)/2:y=300:fontfile=$FONT, \
drawtext=text='v0.2.4':fontsize=48:fontcolor=$ACCENT:x=(w-text_w)/2:y=400:fontfile=$FONT, \
drawtext=text='Composer UI - Auth Sanitization - Slash Commands':fontsize=28:fontcolor=$DIM:x=(w-text_w)/2:y=480:fontfile=$FONT_REGULAR, \
drawtext=text='Local-first coding agent from Talocode':fontsize=22:fontcolor=$DIM:x=(w-text_w)/2:y=560:fontfile=$FONT_REGULAR"

# --- Scene 2: Composer UI (7s) ---
echo "Scene 2: Composer UI"
scene 2 7 \
"drawtext=text='New Composer UI':fontsize=42:fontcolor=$BRAND:x=360:y=120:fontfile=$FONT, \
drawtext=text='codra-code':fontsize=32:fontcolor=$BRAND:x=960-(text_w/2):y=260:fontfile=$FONT, \
drawtext=text='Local-first coding agent by Talocode':fontsize=18:fontcolor=$DIM:x=960-(text_w/2):y=310:fontfile=$FONT_REGULAR, \
drawtext=text='Ask Codra to build, fix, review, test, or understand...':fontsize=20:fontcolor=$DIM:x=960-(text_w/2):y=380:fontfile=$FONT_MONO:box=1:boxcolor=$SURFACE:boxborderw=20, \
drawtext=text='Build / ollama/llama3.1 / local / confirm-edits':fontsize=18:fontcolor=$DIM:x=960-(text_w/2):y=460:fontfile=$FONT_REGULAR, \
drawtext=text='/ commands - tab autocomplete - @ attach - ctrl+c exit':fontsize=16:fontcolor=$DIM:x=960-(text_w/2):y=520:fontfile=$FONT_REGULAR, \
drawtext=text='Centered layout with status bar and responsive design':fontsize=22:fontcolor=$SECONDARY:x=360:y=640:fontfile=$FONT_REGULAR"

# --- Scene 3: Auth and Hosted Gating (7s) ---
echo "Scene 3: Auth and Hosted Gating"
scene 3 7 \
"drawtext=text='Auth and Hosted Gating':fontsize=42:fontcolor=$BRAND:x=360:y=120:fontfile=$FONT, \
drawtext=text='Local Mode':fontsize=28:fontcolor=$SECONDARY:x=360:y=260:fontfile=$FONT, \
drawtext=text='Mock - Ollama':fontsize=22:fontcolor=$ACCENT:x=360:y=310:fontfile=$FONT_MONO, \
drawtext=text='No auth required':fontsize=18:fontcolor=$DIM:x=360:y=360:fontfile=$FONT_REGULAR, \
drawtext=text='Hosted Mode':fontsize=28:fontcolor=$PRIMARY:x=960:y=260:fontfile=$FONT, \
drawtext=text='OpenAI - Anthropic - Gemini':fontsize=22:fontcolor=$ACCENT:x=960:y=310:fontfile=$FONT_MONO, \
drawtext=text='Tera account required':fontsize=18:fontcolor=$DIM:x=960:y=360:fontfile=$FONT_REGULAR, \
drawtext=text='$ codra-code login':fontsize=22:fontcolor=$PRIMARY:x=360:y=480:fontfile=$FONT_MONO, \
drawtext=text='$ codra-code auth status':fontsize=22:fontcolor=$PRIMARY:x=360:y=530:fontfile=$FONT_MONO, \
drawtext=text='Safe token storage - Never prints secrets':fontsize=20:fontcolor=$SECONDARY:x=360:y=620:fontfile=$FONT_REGULAR"

# --- Scene 4: Slash Command Picker (7s) ---
echo "Scene 4: Slash Command Picker"
scene 4 7 \
"drawtext=text='Slash Command Picker':fontsize=42:fontcolor=$BRAND:x=360:y=120:fontfile=$FONT, \
drawtext=text='Press / to open interactive menu':fontsize=22:fontcolor=$DIM:x=360:y=200:fontfile=$FONT_REGULAR, \
drawtext=text='/status    /auth    /login    /model':fontsize=22:fontcolor=$SECONDARY:x=360:y=290:fontfile=$FONT_MONO, \
drawtext=text='/provider  /help    /doctor  /git':fontsize=22:fontcolor=$SECONDARY:x=360:y=340:fontfile=$FONT_MONO, \
drawtext=text='/skills    /plugins /mcp     /clear':fontsize=22:fontcolor=$SECONDARY:x=360:y=390:fontfile=$FONT_MONO, \
  drawtext=text='Groups\: Auth - System - Coding - Git':fontsize=20:fontcolor=$DIM:x=360:y=470:fontfile=$FONT_REGULAR, \
drawtext=text='Pick a command or type /cmd directly':fontsize=20:fontcolor=$ACCENT:x=360:y=540:fontfile=$FONT_REGULAR"

# --- Scene 5: Model and Provider Picker (7s) ---
echo "Scene 5: Model and Provider Picker"
scene 5 7 \
"drawtext=text='Model and Provider Picker':fontsize=42:fontcolor=$BRAND:x=360:y=120:fontfile=$FONT, \
  drawtext=text='Select Provider\:':fontsize=24:fontcolor=$PRIMARY:x=360:y=220:fontfile=$FONT_MONO, \
drawtext=text='ollama  - Local models (llama3.1, mistral)':fontsize=20:fontcolor=$SECONDARY:x=360:y=280:fontfile=$FONT_MONO, \
drawtext=text='openai  - GPT-4o mini, GPT-4o':fontsize=20:fontcolor=$ACCENT:x=360:y=330:fontfile=$FONT_MONO, \
drawtext=text='mock    - Test mode (no API calls)':fontsize=20:fontcolor=$DIM:x=360:y=380:fontfile=$FONT_MONO, \
drawtext=text='Persisted to ~/.codra/config.json':fontsize=20:fontcolor=$SECONDARY:x=360:y=480:fontfile=$FONT_MONO, \
drawtext=text='Interactive provider and model selector':fontsize=22:fontcolor=$ACCENT:x=360:y=560:fontfile=$FONT_REGULAR"

# --- Scene 6: Auth HTML Sanitization (7s) ---
echo "Scene 6: Auth HTML Sanitization"
scene 6 7 \
"drawtext=text='Auth HTML Sanitization':fontsize=42:fontcolor=$BRAND:x=360:y=120:fontfile=$FONT, \
  drawtext=text='Before (v0.2.3)\:':fontsize=22:fontcolor=$DIM:x=360:y=220:fontfile=$FONT_MONO, \
  drawtext=text='Error\: <!DOCTYPE html><html>...':fontsize=20:fontcolor=0xF85149:x=360:y=270:fontfile=$FONT_MONO, \
drawtext=text='(Raw HTML dump is confusing and insecure)':fontsize=16:fontcolor=$DIM:x=360:y=310:fontfile=$FONT_REGULAR, \
  drawtext=text='After (v0.2.4)\:':fontsize=22:fontcolor=$SECONDARY:x=360:y=390:fontfile=$FONT_MONO, \
  drawtext=text='Error\: Login failed\: Tera auth endpoint was not found.':fontsize=20:fontcolor=0xF85149:x=360:y=440:fontfile=$FONT_MONO, \
  drawtext=text='Local mode\: codra-code --mock /status':fontsize=16:fontcolor=$DIM:x=360:y=480:fontfile=$FONT_REGULAR, \
drawtext=text='Smart HTML detection - Clean errors - No secrets leaked':fontsize=20:fontcolor=$SECONDARY:x=360:y=580:fontfile=$FONT_REGULAR"

# --- Scene 7: Features Overview (7s) ---
echo "Scene 7: Features Overview"
scene 7 7 \
"drawtext=text='v0.2.4 Feature Summary':fontsize=42:fontcolor=$BRAND:x=360:y=120:fontfile=$FONT, \
drawtext=text='Composer UI - Interactive terminal with status bar':fontsize=22:fontcolor=$ACCENT:x=360:y=240:fontfile=$FONT_REGULAR, \
drawtext=text='Auth and Hosted Gating - Tera account for hosted':fontsize=22:fontcolor=$ACCENT:x=360:y=300:fontfile=$FONT_REGULAR, \
drawtext=text='Slash Command Picker - Interactive / menu':fontsize=22:fontcolor=$ACCENT:x=360:y=360:fontfile=$FONT_REGULAR, \
drawtext=text='Model and Provider Picker - Select and persist':fontsize=22:fontcolor=$ACCENT:x=360:y=420:fontfile=$FONT_REGULAR, \
drawtext=text='Auth HTML Sanitization - Clean error messages':fontsize=22:fontcolor=$SECONDARY:x=360:y=480:fontfile=$FONT_REGULAR, \
drawtext=text='Responsive Layout - Wide and narrow terminal':fontsize=22:fontcolor=$ACCENT:x=360:y=540:fontfile=$FONT_REGULAR, \
drawtext=text='Safe token storage - Secrets never printed':fontsize=22:fontcolor=$ACCENT:x=360:y=600:fontfile=$FONT_REGULAR"

# --- Scene 8: Install CTA (7s) ---
echo "Scene 8: Install CTA"
scene 8 7 \
"drawtext=text='Install Codra Code v0.2.4':fontsize=48:fontcolor=$ACCENT:x=(w-text_w)/2:y=260:fontfile=$FONT, \
drawtext=text='npm install -g @talocode/codra-code':fontsize=28:fontcolor=$SECONDARY:x=(w-text_w)/2:y=380:fontfile=$FONT_MONO, \
drawtext=text='github.com/talocode/codra':fontsize=32:fontcolor=$PRIMARY:x=(w-text_w)/2:y=480:fontfile=$FONT_REGULAR, \
drawtext=text='Local-first - Open-source - Built for real software work':fontsize=22:fontcolor=$DIM:x=(w-text_w)/2:y=560:fontfile=$FONT_REGULAR"

# --- Scene 9: Closing (6s) ---
echo "Scene 9: Closing"
scene 9 6 \
"drawtext=text='Codra Code v0.2.4':fontsize=56:fontcolor=$BRAND:x=(w-text_w)/2:y=320:fontfile=$FONT, \
drawtext=text='A local-first coding agent for real software work':fontsize=24:fontcolor=$DIM:x=(w-text_w)/2:y=430:fontfile=$FONT_REGULAR, \
drawtext=text='by Talocode':fontsize=22:fontcolor=$DIM:x=(w-text_w)/2:y=510:fontfile=$FONT_REGULAR, \
drawtext=text='github.com/talocode/codra':fontsize=26:fontcolor=$PRIMARY:x=(w-text_w)/2:y=590:fontfile=$FONT_REGULAR"

# --- Concatenate all scenes ---
echo "Concatenating scenes..."
> "$TEMP_DIR/concat.txt"
for i in $(seq 1 9); do
  echo "file 'scene${i}.mp4'" >> "$TEMP_DIR/concat.txt"
done

ffmpeg -y -f concat -safe 0 -i "$TEMP_DIR/concat.txt" -c copy "$TEMP_DIR/video_no_audio.mp4"

# Add subtle background audio
TOTAL_DURATION=60
add_audio "$TEMP_DIR/video_no_audio.mp4" "$OUTPUT" "$TOTAL_DURATION"

echo ""
echo "=== Demo Video Created ==="
echo "Output: $OUTPUT"
ls -lh "$OUTPUT"
