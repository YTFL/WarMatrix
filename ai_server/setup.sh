#!/usr/bin/env bash
# setup.sh — WarMatrix AI setup helper (bash)
# Usage: ./ai_server/setup.sh [--conda|--venv] [--model PATH] [--no-run]

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

USE_CONDA=false
USE_VENV=false
MODEL_PATH=""
NO_RUN=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --conda) USE_CONDA=true; shift ;;
    --venv) USE_VENV=true; shift ;;
    --model) MODEL_PATH="$2"; shift 2 ;;
    --no-run) NO_RUN=true; shift ;;
    -h|--help) echo "Usage: setup.sh [--conda|--venv] [--model PATH] [--no-run]"; exit 0 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

# Activation
if [ "$USE_VENV" = true ]; then
  if [ -f "$REPO_ROOT/.venv/bin/activate" ]; then
    echo "[setup] Activating .venv"
    # shellcheck disable=SC1090
    source "$REPO_ROOT/.venv/bin/activate"
  else
    echo "[setup] .venv not found at $REPO_ROOT/.venv/bin/activate"
    exit 1
  fi
else
  if command -v conda >/dev/null 2>&1; then
    echo "[setup] Activating conda env: wargame_unsloth"
    eval "$(conda shell.bash hook)"
    conda activate wargame_unsloth
  elif [ -f "$REPO_ROOT/.venv/bin/activate" ]; then
    echo "[setup] Conda not found — activating .venv"
    source "$REPO_ROOT/.venv/bin/activate"
  else
    echo "[setup] No conda or .venv found; aborting"
    exit 1
  fi
fi

# Source bash env helper if present
if [ -f "$SCRIPT_DIR/set_env.sh" ]; then
  echo "[setup] Sourcing $SCRIPT_DIR/set_env.sh"
  # shellcheck disable=SC1090
  source "$SCRIPT_DIR/set_env.sh"
else
  echo "[setup] No set_env.sh found (skipping)"
fi

# Override model path
if [ -n "$MODEL_PATH" ]; then
  export MODEL_PATH="$MODEL_PATH"
  echo "[setup] MODEL_PATH set to $MODEL_PATH"
fi

if [ "$NO_RUN" = true ]; then
  echo "[setup] NO_RUN set; exiting after activation"
  exit 0
fi

# Run the server
echo "[setup] Launching backend server"
python "$SCRIPT_DIR/backend_server.py"
