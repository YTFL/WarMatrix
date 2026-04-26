# WarMatrix AI: Quick Start Guide

This document provides focused instructions for setting up the AI backend server using a standard Python virtual environment.

## 📋 Prerequisites

- **Python 3.12**
- **NVIDIA GPU** with updated drivers.
- **PowerShell** (Standard shell for these instructions).

## 1. Environment Activation

Activate the repository virtual environment:

```powershell
# From the project root
& .\.venv\Scripts\Activate.ps1
```

## 2. Install Dependencies

Install the specific requirements for the AI server:

```powershell
# Install backend requirements
pip install -r ai_server\requirements.txt

# (Optional) Verify PyTorch has CUDA access
python -c "import torch; print(f'CUDA available: {torch.cuda.is_available()}')"
```

## 3. Model Preparation

The system is optimized for the **Unsloth 16-bit Qwen 2.5B (4B parameter)** model.

By default, the server looks for checkpoints in:
`ai_server\wargaming_llm\wargame_final_outputs\checkpoint-125`

If your model is located elsewhere, set the `MODEL_PATH`:
```powershell
$env:MODEL_PATH = 'C:\path\to\your\checkpoint-125'
```

## 4. Launch AI Server

For systems with lower VRAM (e.g., 6GB), apply the safe environment variables first:

```powershell
# Apply safe VRAM defaults
. .\ai_server\set_env.ps1

# Start the server
python ai_server\backend_server.py
```

## 5. Verification

Check the health status of the tactical engine:

```powershell
curl.exe http://127.0.0.1:8000/health
```

The response should confirm the `model_path` being utilized.

---
*Refer to [SETUP_LOCAL_GPU.md](./SETUP_LOCAL_GPU.md) for advanced configuration and troubleshooting.*
