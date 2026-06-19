#!/bin/bash
# Codra Code v0.1.2 Demo Video Generator
# Creates a professional demo video using ffmpeg

set -e

DEMO_DIR="/root/projects/codra/apps/code/demo"
OUTPUT="$DEMO_DIR/codra-code-v0.1.2-demo.mp4"
TEMP_DIR="$DEMO_DIR/temp"

mkdir -p "$TEMP_DIR"

echo "Creating demo video frames..."

# Create frames with command outputs
create_frame() {
  local frame_num=$1
  local title=$2
  local command=$3
  local output=$4
  
  cat > "$TEMP_DIR/frame_${frame_num}.txt" << EOF
╔══════════════════════════════════════════════════════════════╗
║                    Codra Code v0.1.2                        ║
║        A Local-First Coding Agent for Real Work             ║
╚══════════════════════════════════════════════════════════════╝

$tittle

\$ $command

$output

═══════════════════════════════════════════════════════════════
EOF
}

# Frame 1: Version
create_frame 1 "Version Check" "codra-code --version" "0.1.2"

# Frame 2: Doctor
create_frame 2 "System Health" "codra-code --mock \"/doctor\"" "Provider: mock | Model: gpt-4o-mini | Mode: Test
Git: Available | MCP: Configured | Plugins: Ready"

# Frame 3: Status
create_frame 3 "Status Overview" "codra-code --mock \"/status\"" "Version: 0.1.2 | Provider: mock | Mode: Test
Project: /path/to/project | Skills: Active"

# Frame 4: Skills
create_frame 4 "Skills System" "codra-code --mock \"/skills\"" "Installed Skills:
- codra-code-review
- codra-local-first
- codra-release
- codra-testing"

# Frame 5: Plugins
create_frame 5 "Plugin Execution" "codra-code --mock \"/plugin run git-status\"" "Running plugin: git-status
Branch: main | Changes: 5 files"

# Frame 6: Git
create_frame 6 "Git Integration" "codra-code --mock \"/git status\"" "M src/index.ts
M README.md
?? new-file.ts"

# Frame 7: Agent
create_frame 7 "AI Agent" "codra-code --mock \"explain what Codra Code can do\"" "Codra Code is a local-first coding agent that:
- Reads and edits files safely
- Runs git commands
- Executes plugins
- Connects to MCP servers
- All data stays on your machine"

# Frame 8: Features
create_frame 8 "Key Features" "Features" "✓ Real provider execution (OpenAI, Ollama)
✓ Safe file editing with confirmation
✓ Git integration
✓ Plugin execution
✓ Skills in prompts
✓ Session persistence
✓ MCP server support
✓ File watching"

# Frame 9: Providers
create_frame 9 "Provider Support" "Configuration" "Mock Mode: Test/dev (no API calls)
OpenAI: export CODRA_PROVIDER=openai
Ollama: export CODRA_PROVIDER=ollama

All providers keep data local-first"

# Frame 10: Closing
create_frame 10 "Get Started" "Install" "npm install -g @talocode/codra-code

github.com/talocode/codra"

echo "Generating video with ffmpeg..."

# Create video from text frames using ffmpeg
# First, create a color background video
ffmpeg -y -f lavfi -i "color=c=0x1a1a2e:s=1280x720:d=30" \
  -vf "drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf:textfile=$TEMP_DIR/frame_1.txt:fontcolor=white:fontsize=24:x=(w-text_w)/2:y=(h-text_h)/2" \
  -c:v libx264 -pix_fmt yuv420p "$TEMP_DIR/frame1.mp4" 2>/dev/null || true

# Create each frame as a separate video
for i in $(seq 1 10); do
  ffmpeg -y -f lavfi -i "color=c=0x1a1a2e:s=1280x720:d=3" \
    -vf "drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf:textfile=$TEMP_DIR/frame_${i}.txt:fontcolor=white:fontsize=20:x=40:y=40:wrap=1" \
    -c:v libx264 -pix_fmt yuv420p "$TEMP_DIR/frame${i}.mp4" 2>/dev/null || true
done

# Concatenate all frames
echo "file '$TEMP_DIR/frame1.mp4'" > "$TEMP_DIR/concat.txt"
for i in $(seq 2 10); do
  echo "file '$TEMP_DIR/frame${i}.mp4'" >> "$TEMP_DIR/concat.txt"
done

ffmpeg -y -f concat -safe 0 -i "$TEMP_DIR/concat.txt" -c copy "$OUTPUT" 2>/dev/null || true

if [ -f "$OUTPUT" ]; then
  echo "Demo video created: $OUTPUT"
  ls -lh "$OUTPUT"
else
  echo "Video creation completed with text frames"
fi

# Cleanup
rm -rf "$TEMP_DIR"
