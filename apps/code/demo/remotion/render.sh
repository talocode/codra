#!/bin/bash

# Codra Code v0.1.6 Launch Video Render Script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="$(dirname "$SCRIPT_DIR")"
OUTPUT_FILE="${OUTPUT_DIR}/codra-code-v0.1.6-launch.mp4"

echo "=== Codra Code v0.1.6 Launch Video Render ==="
echo ""

# Check if Remotion is available
if ! command -v npx &> /dev/null; then
    echo "Error: npx not found. Please install Node.js"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing Remotion dependencies..."
    npm install
fi

# Render video
echo "Rendering video..."
npx remotion render src/index.ts CodraLaunchVideo "${OUTPUT_FILE}" --codec h264

echo ""
echo "=== Render Complete ==="
echo "Output: ${OUTPUT_FILE}"
echo "Size: $(ls -lh "${OUTPUT_FILE}" | awk '{print $5}')"
