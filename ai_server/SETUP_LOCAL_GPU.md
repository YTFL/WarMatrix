# WarMatrix AI: High-Performance GPU Setup

This is the comprehensive guide for setting up the WarMatrix AI backend with maximum optimization using Conda, Unsloth, and hardware acceleration.

---

## 🎯 Optimization Goals

1.  **Low Latency**: Utilizing Unsloth for ultra-fast generation.
2.  **Precision**: Ensuring 16-bit or 4-bit (NF4) quantization based on hardware.
3.  **Reproducibility**: Using exact dependency versions.

---

## 🖥️ Choosing your Environment

### Option A: Conda (Recommended for GPU)
Conda provides superior management for CUDA-enabled packages.

```powershell
# Create environment
conda create -n wargame_unsloth python=3.12 -y
conda activate wargame_unsloth

# Install CUDA-enabled PyTorch (example for CUDA 12.1)
conda install pytorch torchvision torchaudio pytorch-cuda=12.1 -c pytorch -c nvidia -y
```

### Option B: Python Venv
Standard virtual environment if you prefer not to use Conda.

```powershell
& .\.venv\Scripts\Activate.ps1
```

---

## 📦 Dependency Stack

Install the core AI requirements and optimization libraries:

```bash
# Core requirements
pip install -r ai_server/requirements.txt

# Performance libraries
pip install bitsandbytes==0.49.2 peft==0.18.1 trl==0.24.0 safetensors==0.7.0 unsloth==2026.3.3
```

---

## 🧠 Model & Checkpoints

The backend requires a LoRA adapter checkpoint directory. 

### Critical File Check
- Ensure `adapter_config.json` is present.
- If using Git LFS, ensure you have pulled the actual files:
  ```bash
  git lfs install
  git lfs pull
  ```

### Configuration
Set the model path if it differs from the repo default:
```powershell
$env:MODEL_PATH = 'C:\path\to\checkpoint-125'
```

---

## ⚡ Hardware Tuning

Use the environment variable helper to apply safe defaults for constrained GPUs (~6GB VRAM):

```powershell
# Dot-source the helper
. .\ai_server\set_env.ps1
```

**Common Variables:**
- `MAX_GPU_MEMORY_GB`: Caps memory usage to prevent OOM.
- `LOAD_IN_4BIT`: Set to `true` for 4-bit quantization (reduces VRAM significantly).
- `COMPUTE_DTYPE`: Use `float16` (NVIDIA 10/20 series) or `bfloat16` (NVIDIA 30/40 series).

---

## 🚀 Execution & Health Check

1.  **Start the Engine:**
    ```powershell
    python ai_server/backend_server.py
    ```

2.  **Verify Status:**
    ```powershell
    curl.exe http://127.0.0.1:8000/health
    ```

---

## 🛠️ Troubleshooting

- **OutOfMemory (OOM)**: Lower `MAX_GPU_MEMORY_GB` or enable `LOAD_IN_4BIT=true`.
- **Bitsandbytes Errors**: Ensure your CUDA version matches the installed `torch` build.
- **Missing Adapter Config**: Verify the model path is correct and Git LFS has pulled real files.

---
*Maintained by WarMatrix Operational Command.*
