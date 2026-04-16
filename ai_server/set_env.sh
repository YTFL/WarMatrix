#!/usr/bin/env bash
# set_env.sh — bash variant of the PowerShell set_env.ps1 helper
# Dot-source this file to apply recommended environment variables for constrained GPUs.

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

export MODEL_PATH="${MODEL_PATH:-$SCRIPT_DIR/wargaming_llm/wargame_final_outputs/checkpoint-125}"
export LOAD_IN_4BIT="${LOAD_IN_4BIT:-true}"
export USE_8BIT="${USE_8BIT:-false}"
export CPU_OFFLOAD="${CPU_OFFLOAD:-true}"
export MAX_GPU_MEMORY_GB="${MAX_GPU_MEMORY_GB:-4.0}"
export COMPUTE_DTYPE="${COMPUTE_DTYPE:-float16}"
export INFERENCE_USE_CACHE="${INFERENCE_USE_CACHE:-false}"
export EMPTY_CUDA_CACHE_AFTER_REQUEST="${EMPTY_CUDA_CACHE_AFTER_REQUEST:-true}"

cat <<EOF
[set_env] Environment variables applied to current session:
  MODEL_PATH=$MODEL_PATH
  LOAD_IN_4BIT=$LOAD_IN_4BIT
  USE_8BIT=$USE_8BIT
  MAX_GPU_MEMORY_GB=$MAX_GPU_MEMORY_GB
  COMPUTE_DTYPE=$COMPUTE_DTYPE
EOF
