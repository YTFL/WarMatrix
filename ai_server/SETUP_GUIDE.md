# WarMatrix AI — Setup Guide (overview)

This file explains how the various setup documents in `ai_server/` relate, and gives a short, actionable workflow you can follow to get the backend running and reproducible on any machine.

Files covered

- `ai_server/SETUP_AI.md` — quick, focused instructions for activating the local `.venv` or creating a Conda env and running the backend.
- `ai_server/SETUP_DIMBASS.md` — machine-specific facts detected on this host plus exact commands discovered while inspecting the system.
- `ai_server/SETUP_COMPLETE.md` — the comprehensive, portable guide covering all platforms and advanced troubleshooting.
- `ai_server/wargame_unsloth_env.yml` — exported Conda environment for exact reproduction (commit included).
- `ai_server/set_env.ps1` — PowerShell helper that applies safe defaults for constrained GPUs (dot-source this before running the server).

Recommended quick workflow (pick one)

1. Reproduce the Conda environment (recommended for GPU):

```powershell
conda env create -f ai_server/wargame_unsloth_env.yml
conda activate wargame_unsloth
```

2. Place the model adapter/checkpoint in a local folder and ensure `adapter_config.json` is present. Example default path used by the server:

```
C:\Users\FIDO\wargaming_llm\wargame_final_outputs\checkpoint-125
```

If your adapter folder is elsewhere, set `MODEL_PATH` in PowerShell before running the server:

```powershell
$env:MODEL_PATH = 'C:\path\to\checkpoint-125'
```

3. Apply safe environment variables (dot-source helper):

```powershell
. .\ai_server\set_env.ps1
```

4. Run the backend server:

```powershell
python ai_server\backend_server.py
```

5. Verify:

```powershell
curl.exe http://127.0.0.1:8000/health
```

Why there are multiple setup docs

- `SETUP_AI.md` is a short, practical quickstart tailored to the repo.
- `SETUP_DIMBASS.md` records the exact state detected on this host (paths, conda binary location, package versions) — useful when you want the *exact same* environment reproduced elsewhere.
- `SETUP_COMPLETE.md` is the canonical, portable guide that explains platform differences and contains advanced troubleshooting and reproducibility steps.

When to use which

- New machine, want a quick start: use `SETUP_AI.md`.
- Reproduce exactly what the author uses: use `SETUP_DIMBASS.md` + `wargame_unsloth_env.yml`.
- If you hit problems or need GPU tuning: consult `SETUP_COMPLETE.md`.

Reproducibility checklist (to include in PRs or contributor docs)

- [ ] `wargame_unsloth_env.yml` is included in the repo (it is committed at `ai_server/wargame_unsloth_env.yml`).
- [ ] Model adapter/checkpoint is provided or a link to the artifact is present (Git LFS may be required to fetch real files).
- [ ] `ai_server/set_env.ps1` is used for safe defaults on Windows (or a bash equivalent is provided for Unix).
- [ ] Health endpoint returns valid JSON and the `model_path` in it points to the intended checkpoint folder.

If you want automation

I can add:
- `ai_server/setup.ps1` — activator for Windows: activates Conda or `.venv`, dot-sources `set_env.ps1` and launches the server.
- `ai_server/setup.sh` — bash equivalent for Linux/macOS.

Tell me which automation you'd like and I will add it and commit it to the repository.