# WarMatrix AI — Complete Setup (DIMBASS)

This file provides a complete, machine-specific and portable guide to set up and run the WarMatrix AI backend (`ai_server/backend_server.py`). It consolidates everything: environment activation, dependency installation, the model checkpoint, environment variables, run and verification commands, troubleshooting, and reproducibility steps.

---

## Quick facts detected on this host

- Conda binary (detected): `C:\Users\FIDO\miniconda3\Scripts\conda.exe`
- Conda env path: `C:\Users\FIDO\miniconda3\envs\wargame_unsloth`
- Project local virtualenv: `C:\Users\FIDO\GitHub\WarMatrix\.venv`
- Backend entry: `ai_server/backend_server.py`
- Default model fallback path used by the server: `C:\Users\FIDO\wargaming_llm\wargame_final_outputs\checkpoint-125`

Python versions detected:
- `wargame_unsloth` conda env: Python 3.12.12
- repo `.venv`: Python 3.13.x (local virtualenv)

Key packages found in the `wargame_unsloth` conda environment (representative):
- `torch 2.5.1+cu121`, `torchvision 0.20.1+cu121`, `torchaudio 2.5.1+cu121`
- `transformers 5.2.0`
- `unsloth 2026.3.3`, `unsloth-zoo 2026.3.1`
- `bitsandbytes 0.49.2`
- `peft 0.18.1`, `trl 0.24.0`, `accelerate 1.13.0`
- `safetensors 0.7.0`, `sentencepiece 0.2.1`

These facts are for reference; the instructions below are written so you can reproduce the full environment on any machine.

---

## Goals

1. Create or use an environment that can run the Unsloth adapter for the Qwen model in 16-bit/4-bit mode.
2. Provide exact activation and run commands that work on Windows PowerShell and on Unix shells.
3. Provide reproducibility (exporting an environment YAML) and troubleshooting guidance.

---

## Prerequisites

- NVIDIA GPU with current drivers (recommended for inference/training). For 4/8-bit quantized runs, 6GB+ is a realistic minimum — increase if you want higher throughput.
- On Windows: PowerShell (or Anaconda Prompt). On Linux/macOS: bash/zsh.
- Git and Git LFS (if model checkpoints are stored with LFS pointers).
- Either Miniconda/Anaconda (recommended for GPU builds) or a Python virtualenv (`.venv`) for CPU/quick testing.
- Sufficient disk space for model artifacts (depending on the model/adapter; assume 10–50GB depending on what you download).

---

## Recommended workflows

You can run the backend in two main ways:

- A: Using the GPU-enabled Conda environment `wargame_unsloth` (recommended for inference and training). This reproduces what exists on this host.
- B: Using the repository `.venv` (lighter, good for CPU-only testing).

Pick one. Do NOT activate both at the same time.

---

## A — Using Conda: create / reproduce `wargame_unsloth`

### 1) Create the conda environment (if not present)

PowerShell (Anaconda Prompt recommended):

```powershell
# Create env with a compatible Python version (3.12 used on the host)
conda create -n wargame_unsloth python=3.12 -y
conda activate wargame_unsloth
```

If `conda` is not on PATH, call the conda binary directly (detected path on this host):

```powershell
& 'C:\Users\FIDO\miniconda3\Scripts\conda.exe' create -n wargame_unsloth python=3.12 -y
& 'C:\Users\FIDO\miniconda3\Scripts\conda.exe' activate wargame_unsloth
```

### 2) Install CUDA-enabled PyTorch (match CUDA to your system)

This host uses CUDA 12.1. If your GPU/drivers use a different CUDA, change `pytorch-cuda=12.1` accordingly.

PowerShell / bash:

```bash
conda install pytorch torchvision torchaudio pytorch-cuda=12.1 -c pytorch -c nvidia -y
```

### 3) Install backend requirements

```bash
pip install -r ai_server/requirements.txt
```

Install other packages that the code uses (versions from the detected environment):

```bash
pip install bitsandbytes==0.49.2 peft==0.18.1 trl==0.24.0 safetensors==0.7.0 sentencepiece==0.2.1 unsloth==2026.3.3 unsloth-zoo==2026.3.1
```

Notes:
- `bitsandbytes` requires a matching CUDA/driver installation and can fail at import if CUDA is incompatible.
- If you prefer `git+https://...` for cutting-edge unsloth builds, you can `pip install 'unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git'`.

### 4) Verify critical imports

Start Python and run:

```python
import torch
import transformers
import bitsandbytes
import unsloth
print(torch.__version__)
```

Resolve any import errors before proceeding.

---

## B — Using the repo `.venv` (alternate)

If you prefer not to use Conda, activate the project venv (this host uses `.venv`):

PowerShell:

```powershell
& 'C:\Users\FIDO\GitHub\WarMatrix\.venv\Scripts\Activate.ps1'
```

Then install requirements:

```bash
pip install -r ai_server/requirements.txt
# add other packages as needed
pip install bitsandbytes peft trl unsloth safetensors
```

Note: Running the model on `.venv` without Conda still requires a compatible PyTorch build (CUDA) if you want GPU acceleration.

---

## Downloading / placing the model (adapter checkpoint)

The backend expects a LoRA/adapter checkpoint directory that contains `adapter_config.json`. The server sets a default search path; on this host an example path is:

```
C:\Users\FIDO\wargaming_llm\wargame_final_outputs\checkpoint-125
```

You must ensure:
- The adapter folder contains `adapter_config.json` and the adapter weights (safetensors or pytorch.bin files).
- `adapter_config.json` is actual JSON, not a Git LFS pointer.

If the model repo uses Git LFS, in the model repository root run:

```bash
git lfs install
git lfs pull
```

Example: download from Hugging Face (replace `REPO_ID` with the actual repo):

```python
from huggingface_hub import snapshot_download
snapshot_download(repo_id='unsloth/REPO_ID', local_dir='C:/path/to/checkpoint-125')
```

Or clone then LFS pull:

```bash
git clone https://huggingface.co/unsloth/REPO_ID C:\path\to\checkpoint-125
cd C:\path\to\checkpoint-125
git lfs install
git lfs pull
```

Finally, set `MODEL_PATH` to that folder (or rely on the server default).

---

## Environment variables — quick reference

We include `ai_server/set_env.ps1` for PowerShell. Dot-source it to apply recommended defaults for constrained GPUs:

PowerShell:

```powershell
. .\ai_server\set_env.ps1
```

Manual equivalents:

PowerShell:

```powershell
$env:MODEL_PATH = 'C:\path\to\checkpoint-125'
$env:LOAD_IN_4BIT = 'true'
$env:USE_8BIT = 'false'
$env:MAX_GPU_MEMORY_GB = '4.0'
$env:COMPUTE_DTYPE = 'float16'
$env:EMPTY_CUDA_CACHE_AFTER_REQUEST = 'true'
```

Bash:

```bash
export MODEL_PATH=/path/to/checkpoint-125
export LOAD_IN_4BIT=true
export USE_8BIT=false
export MAX_GPU_MEMORY_GB=4.0
export COMPUTE_DTYPE=float16
export EMPTY_CUDA_CACHE_AFTER_REQUEST=true
```

Parameter notes:
- `LOAD_IN_4BIT=true` attempts 4-bit NF4 quantisation. If unsupported, set `USE_8BIT=true` and `LOAD_IN_4BIT=false`.
- `MAX_GPU_MEMORY_GB` caps the per-device allocator to reduce OOM.
- `COMPUTE_DTYPE` should be `float16` or `bfloat16` depending on your hardware.

---

## Running the backend server

1) Activate the environment you chose (Conda or `.venv`).
2) Apply env vars (dot-source `set_env.ps1` or set them manually).
3) Run the server:

PowerShell (Conda):

```powershell
& 'C:\Users\FIDO\miniconda3\shell\condabin\conda-hook.ps1' ; conda activate wargame_unsloth
. .\ai_server\set_env.ps1
python ai_server\backend_server.py
```

PowerShell (`.venv`):

```powershell
& 'C:\Users\FIDO\GitHub\WarMatrix\.venv\Scripts\Activate.ps1'
. .\ai_server\set_env.ps1
python ai_server\backend_server.py
```

Bash (Linux/Mac):

```bash
conda activate wargame_unsloth
source ai_server/set_env.sh  # if you create a bash helper, or export vars manually
python ai_server/backend_server.py
```

The server listens on `127.0.0.1:8000` by default.

---

## Verify server health

Use `curl` or an HTTP client to check the health endpoint:

```bash
curl.exe http://127.0.0.1:8000/health
# or (Unix)
curl http://127.0.0.1:8000/health
```

Expected: a JSON payload containing `model_path` (resolved path), `status`, and other runtime info.

---

## Export / reproduce the exact conda environment

To capture and share the exact package list (recommended for reproducibility):

PowerShell (uses detected conda binary path):

```powershell
& 'C:\Users\FIDO\miniconda3\Scripts\conda.exe' env export -n wargame_unsloth --no-builds > ai_server/wargame_unsloth_env.yml
```

Then on another machine you can recreate it with:

```bash
conda env create -f ai_server/wargame_unsloth_env.yml
conda activate wargame_unsloth
```

Note: `--no-builds` reduces platform-specific build constraints; for perfect reproducibility include builds but expect portability issues between OS/CUDA versions.

---

## Troubleshooting

- Model folder missing `adapter_config.json` error:
  - Check file contents; if it starts with `version https://git-lfs.github.com/spec/v1` run `git lfs pull` in the model repo.

- OutOfMemory on GPU:
  - Lower `MAX_GPU_MEMORY_GB`.
  - Use `LOAD_IN_4BIT=true` (or `USE_8BIT=true` if 4-bit fails).
  - Reduce `DEFAULT_MAX_NEW_TOKENS` in env or per-request.

- `bitsandbytes` import or CUDA errors:
  - Verify CUDA drivers and toolkit match the `torch` binary (here `cu121`).
  - On Windows, `bitsandbytes` can be sensitive to PATH and Visual C++ runtime versions.

- Transformers or PEFT errors after package changes:
  - Use the exported YAML to match package versions.
  - Create a fresh conda env and install the exact versions.

- No GPU available / CPU only:
  - Run with CPU by ensuring `torch` CPU build is installed or running in `.venv` with CPU-only torch.
  - Expect much slower generation.

---

## Advanced: Docker (optional)

A GPU Docker setup is possible (NVIDIA Container Toolkit). Example outline (not a full Dockerfile):

- Base image: `nvidia/cuda:12.1.1-runtime-ubuntu22.04` or similar
- Install system deps, Python, pip
- Copy repo, install pip requirements
- `ENTRYPOINT ["python","ai_server/backend_server.py"]`

See the official NVIDIA docs for `docker run --gpus` usage.

---

## Security & operational notes

- The server binds to `127.0.0.1` by default. If you change this to 0.0.0.0, ensure you put it behind proper authentication/reverse-proxy.
- Monitor `nvidia-smi` for memory usage during runs and tune `MAX_GPU_MEMORY_GB` accordingly.

---

## Where this doc and helpers live

- Environment variable helpers: `ai_server/set_env.ps1` (PowerShell)
- Backend server: `ai_server/backend_server.py`
- Pip requirements: `ai_server/requirements.txt`
- Model checkpoint expected location: default fallback within the repo `wargaming_llm/wargame_final_outputs/checkpoint-125`