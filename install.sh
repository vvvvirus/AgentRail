#!/usr/bin/env bash
set -e

CLAUDE_DIR="${HOME}/.claude"

if [ ! -d "$CLAUDE_DIR" ]; then
    echo "Error: $CLAUDE_DIR not found. Is Claude Code installed?"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Installing Claude Task Workflow..."

# Create directories
mkdir -p "$CLAUDE_DIR/skills"
mkdir -p "$CLAUDE_DIR/commands/task"

# Copy skills (-r copies entire directories)
cp -r "$SCRIPT_DIR/skills/task-do" "$CLAUDE_DIR/skills/"

# Copy commands
cp "$SCRIPT_DIR/commands/task/"*.md "$CLAUDE_DIR/commands/task/"

# Copy runtime directory
mkdir -p "$CLAUDE_DIR/task-workflow"
cp "$SCRIPT_DIR/task-workflow/workflow-runtime.ts" "$CLAUDE_DIR/task-workflow/"
cp "$SCRIPT_DIR/task-workflow/package.json" "$CLAUDE_DIR/task-workflow/"
cp "$SCRIPT_DIR/task-workflow/tsconfig.json" "$CLAUDE_DIR/task-workflow/"

# Install runtime dependencies
echo "Installing runtime dependencies..."
if (cd "$CLAUDE_DIR/task-workflow" && npm install 2>/dev/null); then
    echo "  Runtime ready."
else
    echo "  Warning: npm install failed. npx tsx will auto-resolve on first use."
fi

echo ""
echo "Done. Restart Claude Code for commands to take effect."
echo ""
echo "Try: /task:plan \"your first task\""
