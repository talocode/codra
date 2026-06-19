#!/bin/bash
# Codra Code v0.1.2 Demo Script
# Run this script to see Codra Code in action

echo "=========================================="
echo "  Codra Code v0.1.2 Demo"
echo "  A local-first coding agent"
echo "=========================================="
echo ""

echo "1. Version check:"
codra-code --version
echo ""

echo "2. System health check:"
codra-code --mock "/doctor"
echo ""

echo "3. Status:"
codra-code --mock "/status"
echo ""

echo "4. Skills:"
codra-code --mock "/skills"
echo ""

echo "5. Plugins:"
codra-code --mock "/plugins"
echo ""

echo "6. Plugin execution:"
codra-code --mock "/plugin run git-status"
echo ""

echo "7. Git summary:"
codra-code --mock "/git"
echo ""

echo "8. Agent response:"
codra-code --mock "hello codra"
echo ""

echo "=========================================="
echo "  Provider Support:"
echo "  - Mock: Test mode (no API calls)"
echo "  - OpenAI: Compatible with OpenAI APIs"
echo "  - Ollama: Local model support"
echo ""
echo "  Key Features:"
echo "  - Real file editing with confirmation"
echo "  - Git integration"
echo "  - Plugin execution"
echo "  - Skills in prompts"
echo "  - Session persistence"
echo "  - File watching"
echo "=========================================="
