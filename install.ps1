$ErrorActionPreference = "Stop"

$ClaudeDir = "$env:USERPROFILE\.claude"

if (-not (Test-Path $ClaudeDir)) {
    Write-Error "Error: $ClaudeDir not found. Is Claude Code installed?"
    exit 1
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Installing Claude Task Workflow..."

# Create directories
New-Item -ItemType Directory -Force -Path "$ClaudeDir\skills" | Out-Null
New-Item -ItemType Directory -Force -Path "$ClaudeDir\commands\task" | Out-Null

# Copy skills (-Recurse copies entire directories; -Force overwrites existing)
Copy-Item -Recurse -Force "$ScriptDir\skills\task-do" "$ClaudeDir\skills\"

# Copy commands
Copy-Item -Force "$ScriptDir\commands\task\*.md" "$ClaudeDir\commands\task\"

# Copy runtime directory (entire task-workflow/ tree excluding node_modules)
New-Item -ItemType Directory -Force -Path "$ClaudeDir\task-workflow" | Out-Null
Copy-Item -Force "$ScriptDir\task-workflow\workflow-runtime.ts" "$ClaudeDir\task-workflow\"
Copy-Item -Force "$ScriptDir\task-workflow\package.json" "$ClaudeDir\task-workflow\"
Copy-Item -Force "$ScriptDir\task-workflow\tsconfig.json" "$ClaudeDir\task-workflow\"

# Install runtime dependencies
Write-Host "Installing runtime dependencies..."
Push-Location "$ClaudeDir\task-workflow"
try {
    npm install 2>&1 | Out-Null
    Write-Host "  Runtime ready."
} catch {
    Write-Host "  Warning: npm install failed. npx tsx will auto-resolve on first use."
}
Pop-Location

Write-Host ""
Write-Host "Done. Restart Claude Code for commands to take effect."
Write-Host ""
Write-Host 'Try: /task:plan "your first task"'
