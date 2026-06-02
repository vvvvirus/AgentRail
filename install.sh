#!/usr/bin/env bash
set -e

# Target config directory. Use --target <dir> or AGENTRAIL_TARGET env var.
# Default: try ~/.claude, ~/.codex, then prompt.
TARGET=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        --target) TARGET="$2"; shift 2 ;;
        --target=*) TARGET="${1#*=}"; shift ;;
        *) TARGET="$1"; shift ;;
    esac
done

if [ -z "$TARGET" ]; then
    TARGET="${AGENTRAIL_TARGET:-}"
fi

if [ -z "$TARGET" ]; then
    # Auto-detect: check common agent config dirs
    for dir in "${HOME}/.claude" "${HOME}/.codex" "${HOME}/.gemini" "${HOME}/.opencode"; do
        if [ -d "$dir" ]; then
            TARGET="$dir"
            break
        fi
    done
fi

if [ -z "$TARGET" ]; then
    echo "No agent config directory found. Specify one with:"
    echo "  ./install.sh --target ~/.claude    # Claude Code"
    echo "  ./install.sh --target ~/.codex     # OpenAI Codex"
    echo "  ./install.sh --target ~/.gemini    # Gemini CLI"
    exit 1
fi

echo "Installing AgentRail to $TARGET ..."

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Create directories
mkdir -p "$TARGET/skills"
mkdir -p "$TARGET/commands/rail"

# Copy skills
cp -r "$SCRIPT_DIR/skills/rail-do" "$TARGET/skills/"

# Copy commands
cp "$SCRIPT_DIR/commands/rail/"*.md "$TARGET/commands/rail/"

# Copy runtime
mkdir -p "$TARGET/agentrail"
cp -r "$SCRIPT_DIR/agentrail/src" "$TARGET/agentrail/"
cp "$SCRIPT_DIR/agentrail/cli.ts" "$TARGET/agentrail/"
cp "$SCRIPT_DIR/agentrail/package.json" "$TARGET/agentrail/"
cp "$SCRIPT_DIR/agentrail/tsconfig.json" "$TARGET/agentrail/"

# Install runtime dependencies
echo "Installing runtime dependencies..."
if (cd "$TARGET/agentrail" && npm install 2>/dev/null); then
    echo "  Runtime ready."
else
    echo "  Warning: npm install failed. npx tsx will auto-resolve on first use."
fi

echo ""
echo "Done. Restart your agent for commands to take effect."
echo ""
echo "Try: /railplan \"your first task\""
