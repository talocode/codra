#!/bin/bash
# Codra Code v0.1.1 Demo Script
# Run this script to see Codra Code in action

echo "=========================================="
echo "  Codra Code v0.1.1 Demo"
echo "  A local-first coding agent interface"
echo "=========================================="
echo ""

echo "1. Version check:"
codra-code --version
echo ""

echo "2. Mock mode - Status:"
codra-code --mock "/status"
echo ""

echo "3. Mock mode - Skills:"
codra-code --mock "/skills"
echo ""

echo "4. Mock mode - Plugins:"
codra-code --mock "/plugins"
echo ""

echo "5. Mock mode - MCP:"
codra-code --mock "/mcp"
echo ""

echo "6. Mock mode - Agent response:"
codra-code --mock "hello codra"
echo ""

echo "7. Provider support:"
echo "   - Mock: Default mode, simulated responses"
echo "   - OpenAI: Compatible with OpenAI and similar APIs"
echo "   - Ollama: Local model support"
echo ""

echo "=========================================="
echo "  Demo complete!"
echo "=========================================="
