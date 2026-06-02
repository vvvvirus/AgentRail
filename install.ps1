param(
    [string]$Target = ""
)

$ErrorActionPreference = "Stop"

# Accept positional argument as target (e.g., ".\install.ps1 ~\.claude")
if (-not $Target -and $args.Count -gt 0 -and -not $args[0].StartsWith("-")) {
    $Target = $args[0]
}

if (-not $Target) {
    $Target = $env:AGENTRAIL_TARGET
}

if (-not $Target) {
    # Auto-detect: check common agent config dirs
    $commonDirs = @(
        "$env:USERPROFILE\.claude",
        "$env:USERPROFILE\.codex",
        "$env:USERPROFILE\.gemini",
        "$env:USERPROFILE\.opencode"
    )
    foreach ($dir in $commonDirs) {
        if (Test-Path $dir) {
            $Target = $dir
            break
        }
    }
}

if (-not $Target) {
    Write-Error @"
No agent config directory found. Specify one with:
  .\install.ps1 -Target "$env:USERPROFILE\.claude"   # Claude Code
  .\install.ps1 -Target "$env:USERPROFILE\.codex"    # OpenAI Codex
  .\install.ps1 -Target "$env:USERPROFILE\.gemini"   # Gemini CLI
"@
    exit 1
}

Write-Host "Installing AgentRail to $Target ..."

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Create directories
New-Item -ItemType Directory -Force -Path "$Target\skills" | Out-Null
New-Item -ItemType Directory -Force -Path "$Target\commands\rail" | Out-Null

# Copy skills
Copy-Item -Recurse -Force "$ScriptDir\skills\rail-do" "$Target\skills\"

# Copy commands
Copy-Item -Force "$ScriptDir\commands\rail\*.md" "$Target\commands\rail\"

# Copy runtime
New-Item -ItemType Directory -Force -Path "$Target\agentrail" | Out-Null
Copy-Item -Recurse -Force "$ScriptDir\agentrail\src" "$Target\agentrail\"
Copy-Item -Force "$ScriptDir\agentrail\cli.ts" "$Target\agentrail\"
Copy-Item -Force "$ScriptDir\agentrail\package.json" "$Target\agentrail\"
Copy-Item -Force "$ScriptDir\agentrail\tsconfig.json" "$Target\agentrail\"

# Install runtime dependencies
Write-Host "Installing runtime dependencies..."
Push-Location "$Target\agentrail"
try {
    npm install 2>&1 | Out-Null
    Write-Host "  Runtime ready."
} catch {
    Write-Host "  Warning: npm install failed. npx tsx will auto-resolve on first use."
}
Pop-Location

Write-Host ""
Write-Host "Done. Restart your agent for commands to take effect."
Write-Host ""
Write-Host 'Try: /railplan "your first task"'
