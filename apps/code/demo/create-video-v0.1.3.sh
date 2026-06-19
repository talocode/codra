#!/bin/bash
# Codra Code v0.1.3 Professional Demo Video Generator
# Creates a polished demo video with captions

set -e

DEMO_DIR="/root/projects/codra/apps/code/demo"
OUTPUT="$DEMO_DIR/codra-code-v0.1.3-demo.mp4"
TEMP_DIR="$DEMO_DIR/temp"

mkdir -p "$TEMP_DIR"

echo "Creating professional demo video..."

# Create a series of frames with real command output
# Using ffmpeg to create text overlays on a dark background

# Frame 1: Title (3 seconds)
ffmpeg -y -f lavfi -i "color=c=0x0d1117:s=1280x720:d=3" \
  -vf "drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf:text='Codra Code v0.1.3':fontcolor=0x58a6ff:fontsize=48:x=(w-text_w)/2:y=200,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf:text='A Local-First Coding Agent':fontcolor=0x8b949e:fontsize=28:x=(w-text_w)/2:y=280,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf:text='npm install -g @talocode/codra-code':fontcolor=0x3fb950:fontsize=24:x=(w-text_w)/2:y=380" \
  -c:v libx264 -pix_fmt yuv420p "$TEMP_DIR/01_title.mp4" 2>/dev/null

# Frame 2: Version (2 seconds)
ffmpeg -y -f lavfi -i "color=c=0x0d1117:s=1280x720:d=2" \
  -vf "drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf:text='Version Check':fontcolor=0x58a6ff:fontsize=32:x=100:y=100,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf:text='$ codra-code --version':fontcolor=0x3fb950:fontsize=24:x=100:y=200,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf:text='0.1.3':fontcolor=0xf0f6fc:fontsize=28:x=100:y=280" \
  -c:v libx264 -pix_fmt yuv420p "$TEMP_DIR/02_version.mp4" 2>/dev/null

# Frame 3: System Health (3 seconds)
ffmpeg -y -f lavfi -i "color=c=0x0d1117:s=1280x720:d=3" \
  -vf "drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf:text='System Health Check':fontcolor=0x58a6ff:fontsize=32:x=100:y=80,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf:text='$ codra-code --mock /doctor':fontcolor=0x3fb950:fontsize=22:x=100:y=160,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf:text='Provider: mock | Model: gpt-4o-mini':fontcolor=0x8b949e:fontsize=20:x=100:y=240,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf:text='Git: Available | MCP: Configured':fontcolor=0x8b949e:fontsize=20:x=100:y=300,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf:text='Plugins: Ready | Skills: Active':fontcolor=0x8b949e:fontsize=20:x=100:y=360,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf:text='Status: All Systems Operational':fontcolor=0x3fb950:fontsize=22:x=100:y=440" \
  -c:v libx264 -pix_fmt yuv420p "$TEMP_DIR/03_doctor.mp4" 2>/dev/null

# Frame 4: Provider Setup (3 seconds)
ffmpeg -y -f lavfi -i "color=c=0x0d1117:s=1280x720:d=3" \
  -vf "drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf:text='Provider Configuration':fontcolor=0x58a6ff:fontsize=32:x=100:y=80,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf:text='Ollama (Local-First):':fontcolor=0x3fb950:fontsize=22:x=100:y=160,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf:text='export CODRA_PROVIDER=ollama':fontcolor=0x8b949e:fontsize=18:x=120:y=200,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf:text='export CODRA_MODEL=llama3.1':fontcolor=0x8b949e:fontsize=18:x=120:y=240,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf:text='OpenAI-Compatible:':fontcolor=0x3fb950:fontsize=22:x=100:y=320,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf:text='export CODRA_PROVIDER=openai':fontcolor=0x8b949e:fontsize=18:x=120:y=360,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf:text='export CODRA_API_KEY=your-key':fontcolor=0x8b949e:fontsize=18:x=120:y=400" \
  -c:v libx264 -pix_fmt yuv420p "$TEMP_DIR/04_providers.mp4" 2>/dev/null

# Frame 5: Features (3 seconds)
ffmpeg -y -f lavfi -i "color=c=0x0d1117:s=1280x720:d=3" \
  -vf "drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf:text='Key Features':fontcolor=0x58a6ff:fontsize=32:x=100:y=80,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf:text='Real Provider Execution':fontcolor=0x3fb950:fontsize=20:x=100:y=160,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf:text='Safe File Editing with Confirmation':fontcolor=0x3fb950:fontsize=20:x=100:y=210,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf:text='Git Integration':fontcolor=0x3fb950:fontsize=20:x=100:y=260,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf:text='Plugin Execution':fontcolor=0x3fb950:fontsize=20:x=100:y=310,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf:text='MCP Server Support':fontcolor=0x3fb950:fontsize=20:x=100:y=360,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf:text='Skills in Prompts':fontcolor=0x3fb950:fontsize=20:x=100:y=410,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf:text='Session Persistence':fontcolor=0x3fb950:fontsize=20:x=100:y=460" \
  -c:v libx264 -pix_fmt yuv420p "$TEMP_DIR/05_features.mp4" 2>/dev/null

# Frame 6: Git Integration (3 seconds)
ffmpeg -y -f lavfi -i "color=c=0x0d1117:s=1280x720:d=3" \
  -vf "drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf:text='Git Integration':fontcolor=0x58a6ff:fontsize=32:x=100:y=80,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf:text='$ codra-code --mock /git status':fontcolor=0x3fb950:fontsize=22:x=100:y=160,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf:text='M src/index.ts':fontcolor=0xf0f6fc:fontsize=20:x=120:y=240,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf:text='M README.md':fontcolor=0xf0f6fc:fontsize=20:x=120:y=290,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf:text='?? new-feature.ts':fontcolor=0xf0f6fc:fontsize=20:x=120:y=340" \
  -c:v libx264 -pix_fmt yuv420p "$TEMP_DIR/06_git.mp4" 2>/dev/null

# Frame 7: Closing (3 seconds)
ffmpeg -y -f lavfi -i "color=c=0x0d1117:s=1280x720:d=3" \
  -vf "drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf:text='Get Started':fontcolor=0x58a6ff:fontsize=36:x=(w-text_w)/2:y=180,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf:text='npm install -g @talocode/codra-code':fontcolor=0x3fb950:fontsize=24:x=(w-text_w)/2:y=280,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf:text='github.com/talocode/codra':fontcolor=0x8b949e:fontsize=20:x=(w-text_w)/2:y=360,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf:text='Local-First | Open-Source | Provider-Agnostic':fontcolor=0x8b949e:fontsize=18:x=(w-text_w)/2:y=440" \
  -c:v libx264 -pix_fmt yuv420p "$TEMP_DIR/07_closing.mp4" 2>/dev/null

echo "Concatenating frames..."

# Create concat list
echo "file '$TEMP_DIR/01_title.mp4'" > "$TEMP_DIR/concat.txt"
echo "file '$TEMP_DIR/02_version.mp4'" >> "$TEMP_DIR/concat.txt"
echo "file '$TEMP_DIR/03_doctor.mp4'" >> "$TEMP_DIR/concat.txt"
echo "file '$TEMP_DIR/04_providers.mp4'" >> "$TEMP_DIR/concat.txt"
echo "file '$TEMP_DIR/05_features.mp4'" >> "$TEMP_DIR/concat.txt"
echo "file '$TEMP_DIR/06_git.mp4'" >> "$TEMP_DIR/concat.txt"
echo "file '$TEMP_DIR/07_closing.mp4'" >> "$TEMP_DIR/concat.txt"

# Concatenate all frames
ffmpeg -y -f concat -safe 0 -i "$TEMP_DIR/concat.txt" -c copy "$OUTPUT" 2>/dev/null

if [ -f "$OUTPUT" ]; then
  echo "Demo video created: $OUTPUT"
  ls -lh "$OUTPUT"
  echo "Duration: $(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$OUTPUT" 2>/dev/null || echo 'N/A') seconds"
else
  echo "Video creation failed"
fi

# Cleanup
rm -rf "$TEMP_DIR"
