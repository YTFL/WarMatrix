<#
setup.ps1 — WarMatrix AI setup helper (PowerShell)

Usage examples:
  # Activate Conda env (preferred) and run server
  .\ai_server\setup.ps1 -UseConda

  # Activate local .venv and run server
  .\ai_server\setup.ps1 -UseVenv

  # Activate conda, set model path, but don't run
  .\ai_server\setup.ps1 -UseConda -ModelPath 'C:\models\checkpoint-125' -NoRun
#>

param(
    [switch]$UseConda,
    [switch]$UseVenv,
    [string]$ModelPath = "",
    [switch]$NoRun
)

function Log($m) { Write-Host "[setup] $m" }

# Script/Repo layout
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$RepoRoot  = Resolve-Path (Join-Path $ScriptDir '..') | Select-Object -ExpandProperty Path

# Activation
if ($UseVenv) {
    $venvActivate = Join-Path $RepoRoot '.venv\Scripts\Activate.ps1'
    if (Test-Path $venvActivate) {
        Log "Activating .venv at $venvActivate"
        & $venvActivate
    } else {
        Write-Error ".venv activation script not found at $venvActivate"
        exit 1
    }
} else {
    $condaActivated = $false
    $candidateHooks = @(
        Join-Path $env:USERPROFILE 'miniconda3\shell\condabin\conda-hook.ps1',
        Join-Path $env:USERPROFILE 'anaconda3\shell\condabin\conda-hook.ps1',
        'C:\ProgramData\miniconda3\shell\condabin\conda-hook.ps1',
        'C:\ProgramData\anaconda3\shell\condabin\conda-hook.ps1'
    )
    foreach ($hook in $candidateHooks) {
        if (Test-Path $hook) {
            Log "Sourcing conda hook: $hook"
            & $hook
            Log "Activating Conda environment: wargame_unsloth"
            conda activate wargame_unsloth
            $condaActivated = $true
            break
        }
    }

    if (-not $condaActivated) {
        $cmd = Get-Command conda -ErrorAction SilentlyContinue
        if ($cmd) {
            Log "Using conda from PATH"
            conda activate wargame_unsloth
            $condaActivated = $true
        }
    }

    if (-not $condaActivated) {
        # fallback to repo venv
        $venvActivate = Join-Path $RepoRoot '.venv\Scripts\Activate.ps1'
        if (Test-Path $venvActivate) {
            Log "Conda not found — activating .venv at $venvActivate"
            & $venvActivate
        } else {
            Write-Error "Neither Conda nor .venv activation scripts found. Install Conda or create .venv."
            exit 1
        }
    }
}

# Apply env helper if present
$setEnv = Join-Path $ScriptDir 'set_env.ps1'
if (Test-Path $setEnv) {
    Log "Applying environment variables from $setEnv"
    . $setEnv
} else {
    Log "No set_env.ps1 found at $setEnv (skipping)"
}

# Override model path if provided
if ($ModelPath -and $ModelPath.Trim()) {
    $env:MODEL_PATH = $ModelPath
    Log "MODEL_PATH set to: $ModelPath"
}

if ($NoRun) {
    Log "-NoRun specified; exiting after activation and env setup."
    exit 0
}

# Run backend
$backend = Join-Path $ScriptDir 'backend_server.py'
if (-not (Test-Path $backend)) {
    Write-Error "backend_server.py not found at $backend"
    exit 1
}

Log "Starting backend server..."
python $backend
