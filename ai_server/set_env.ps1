<#
PowerShell helper to apply recommended environment variables for the AI server.
Dot-source this script to set variables in your current session (do not run normally).
Usage (PowerShell):
  . .\set_env.ps1

This script does NOT start the server; it only sets env vars for you to run later.
#>

# Recommended environment variables for RTX 5090
$env:MODEL_PATH = "..\ai_server\wargaming_llm\wargame_final_outputs\checkpoint-125"
$env:LOAD_IN_4BIT = "true"                # Enable 4-bit quantization
$env:USE_8BIT = "false"                   # No 8-bit quantization (RTX 5090 can handle more)
$env:CPU_OFFLOAD = "true"                 # Offload computations to CPU where needed
$env:MAX_GPU_MEMORY_GB = "24"             # Set GPU memory to 24GB (RTX 5090 has ample VRAM)
$env:COMPUTE_DTYPE = "float16"            # Use float16 for faster performance
$env:INFERENCE_USE_CACHE = "true"         # Enable KV cache for faster inference
$env:EMPTY_CUDA_CACHE_AFTER_REQUEST = "true"  # Clear CUDA cache after request to save memory

# LM Studio Configuration (Proxy Mode)
$env:USE_LM_STUDIO = "false"                  # Set to "true" to use external GGUF model
$env:LM_STUDIO_IP = "localhost"          # IP of the machine hosting LM Studio
$env:LM_STUDIO_PORT = "1234"                  # Default LM Studio port
$env:LM_STUDIO_API_KEY = ""                   # Optional Bearer token

Write-Host "Environment variables applied to current session."
Write-Host "To keep them, add these to your shell profile or dot-source this file before running the server."
Write-Host "Note: this script does not start the AI server."
