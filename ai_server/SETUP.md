# WarMatrix AI Setup — DIMBASS

Purpose

This file consolidates the exact environment activation, dependency, model, and run steps tailored to the system in this workspace (Miniconda `wargame_unsloth` and local `.venv`). Use this as the canonical setup doc for running `ai_server/backend_server.py`.

**System facts (detected on this machine)**

- Conda binary: `C:\Users\FIDO\miniconda3\Scripts\conda.exe`
- Conda env path: `C:\Users\FIDO\miniconda3\envs\wargame_unsloth`
- Local Python venv: `C:\Users\FIDO\GitHub\WarMatrix\.venv`
- Project root: `C:\Users\FIDO\GitHub\WarMatrix`
- Recommended model location (default used by server): `C:\Users\FIDO\wargaming_llm\wargame_final_outputs\checkpoint-125`

**Quick summary of important packages (installed in `wargame_unsloth` on this host)**

- `python 3.12.12`
- `torch 2.5.1+cu121`, `torchvision 0.20.1+cu121`, `torchaudio 2.5.1+cu121`
- `transformers 5.2.0`
- `unsloth 2026.3.3`, `unsloth-zoo 2026.3.1`
- `bitsandbytes 0.49.2`
- `peft 0.18.1`, `trl 0.24.0`, `accelerate 1.13.0`
- `safetensors 0.7.0`, `sentencepiece 0.2.1`

If you need the exact, full package list, export the conda environment (see "Export exact env" below).

**Which environment should you use?**

- Use the Conda environment `wargame_unsloth` when you want the full GPU-enabled stack (recommended for training/inference with Unsloth and CUDA). This is the environment detected on this machine.
- Use the repository `.venv` if you prefer an isolated local virtualenv (suitable for running the server on CPU or when you have packages installed there). The repository already contains a `.venv` that is used frequently by this project.

**Exact activation commands (use the one that matches how you work)**

- Option A — Anaconda Prompt (recommended for Conda workflows)

```powershell
# Open Anaconda Prompt then run:
conda activate wargame_unsloth
```

- Option B — PowerShell when `conda` is not on PATH (exact command for this host)

```powershell
& 'C:\Users\FIDO\miniconda3\shell\condabin\conda-hook.ps1' ; conda activate wargame_unsloth
```

- Option C — Use the local repository virtualenv (`.venv`)

```powershell
& 'C:\Users\FIDO\GitHub\WarMatrix\.venv\Scripts\Activate.ps1'
```

Notes:
- Only one environment should be active when running Python. Prefer Conda for GPU work.
- If you open Anaconda Prompt, `conda activate wargame_unsloth` is the simplest route.

**Install / verify required dependencies**

If the environment does not already include required packages, reproduce the core stack with these commands (adjust CUDA version to match your GPU):

```powershell
# Activate the conda env first (if using conda)
& 'C:\Users\FIDO\miniconda3\shell\condabin\conda-hook.ps1' ; conda activate wargame_unsloth

# Install CUDA-enabled PyTorch (example uses CUDA 12.1 used on this host)
conda install pytorch torchvision torchaudio pytorch-cuda=12.1 -c pytorch -c nvidia -y

# Install backend pip requirements
pip install -r ai_server\requirements.txt

# Additional packages (versions matching detected env)
pip install bitsandbytes==0.49.2 unsloth==2026.3.3 unsloth-zoo==2026.3.1 peft==0.18.1 trl==0.24.0 safetensors==0.7.0
```

If you use the repository `.venv`, run the same `pip install -r ai_server\requirements.txt` after activating `.venv`.

**Download / place the model (unsloth 16-bit Qwen 2.5B / 4B-parameter adapter)**

The backend expects a LoRA/adapter checkpoint containing `adapter_config.json`. By default the server falls back to a relative path; on this host the common location is:

```
C:\Users\FIDO\wargaming_llm\wargame_final_outputs\checkpoint-125
```

If your model is elsewhere, set `MODEL_PATH` before starting the server.

```powershell
$env:MODEL_PATH = 'C:\path\to\your\checkpoint-125'
```

Important:
- `adapter_config.json` must be real JSON. If the file starts with "version https://git-lfs.github.com/spec/v1" it's a Git LFS pointer — run the following in the model repo root to fetch real files:

```powershell
git lfs install
git lfs pull
```

**Apply safe environment variables for constrained GPUs**

We provide `ai_server\set_env.ps1` to apply recommended defaults for ~6GB GPUs. Dot-source it in PowerShell so variables are set in your session:

```powershell
# Dot-source helper (applies variables to current session)
. .\ai_server\set_env.ps1

# Or set manually (example values):
$env:MAX_GPU_MEMORY_GB = '4.0'
$env:LOAD_IN_4BIT = 'true'
$env:USE_8BIT = 'false'
$env:COMPUTE_DTYPE = 'float16'
$env:MODEL_PATH = 'C:\path\to\checkpoint-125'
```

`set_env.ps1` on this repo already sets safe defaults; use it unless you need custom values.

**Run the backend server (exact commands)**

```powershell
# Option 1 — using the repo .venv
& 'C:\Users\FIDO\GitHub\WarMatrix\.venv\Scripts\Activate.ps1'
. .\ai_server\set_env.ps1
python ai_server\backend_server.py

# Option 2 — using Conda env
& 'C:\Users\FIDO\miniconda3\shell\condabin\conda-hook.ps1' ; conda activate wargame_unsloth
. .\ai_server\set_env.ps1
python ai_server\backend_server.py
```

The server binds to `127.0.0.1:8000` by default.

**Verify server health**

```powershell
curl.exe http://127.0.0.1:8000/health
```

The `GET /health` response includes a `model_path` field showing the resolved model location.

**Export exact conda env (recommended to reproduce)**

Run this from PowerShell (uses the detected conda binary on this host):

```powershell
& 'C:\Users\FIDO\miniconda3\Scripts\conda.exe' env export -n wargame_unsloth --no-builds > wargame_unsloth_env.yml
```

Commit `wargame_unsloth_env.yml` to the repo to allow exact reproduction elsewhere.

**Troubleshooting notes**

- Out-of-memory: reduce `$env:MAX_GPU_MEMORY_GB`, set `USE_8BIT=true`, or increase GPU memory.
- If `adapter_config.json` is a Git LFS pointer run `git lfs install` and `git lfs pull`.
- `bitsandbytes` and CUDA compatibility: ensure your CUDA toolkit and drivers match the installed `torch` build (this host uses CUDA 12.1).
- If `transformers` import fails due to a conflicting package (e.g., `torchao`), try uninstalling or aligning that package.

**Next recommended actions**

- Export and commit the conda environment YAML (command above) so others can reproduce the exact package set.
- Place the model checkpoint (with `adapter_config.json`) at the default path or set `MODEL_PATH` to the real folder.
- Start the server from the environment you plan to use (Conda for GPU; `.venv` for CPU/testing).

**Files referenced**

- `ai_server/ENV_README.md` — environment-variable quick usage and notes
- `ai_server/set_env.ps1` — helper to apply safe defaults
- `ai_server/requirements.txt` — pip-level backend requirements

----

If you want, I can now export the detected `wargame_unsloth` environment to `ai_server/wargame_unsloth_env.yml` and add it to the repo. Say "export and add" and I will do that next.
