# WarMatrix AI Environment Setup

This document provides instructions on how to set up and run the AI backend server for WarMatrix.

## Prerequisites

1. **Python Virtual Environment**: You must use PowerShell and have the `.venv` correctly set up.
2. **Model Requirements**: The backend requires the **unsloth 16-bit model of the Qwen 2.5b (4B parameter)** model.

## 1. Open PowerShell

Launch a standard PowerShell window or use the integrated VS Code terminal.

## 2. Environment Setup & Activation

Activate the required virtual environment inside the WarMatrix repository by running the following command:

```powershell
& c:\Users\FIDO\GitHub\WarMatrix\.venv\Scripts\Activate.ps1
```

*(Alternatively, if your terminal is already inside the repository, `& .\.venv\Scripts\Activate.ps1` works too).*

### Install Required Dependencies

Ensure you have the backend requirements installed. If you haven't installed them yet, you can run:

```powershell
pip install -r ai_server\requirements.txt
```

*Note: Make sure your NVIDIA drivers are up to date and your PyTorch version matches your CUDA environment.*

## 3. Download the Model

Ensure you have the correct model downloaded. The system requires the:

**unsloth 16bit model of qwen 2.5b 4B parameter model**

By default, the backend server will look for the fine-tuned LoRA checkpoints in:
`ai_server\wargaming_llm\wargame_final_outputs\checkpoint-125`

If your model is located elsewhere, you can set the `MODEL_PATH` environment variable before starting the server.

## 4. Run the Backend Server

Once the `.venv` is active and the model is available, start the backend server by executing:

```powershell
python ai_server\backend_server.py
```

### Optional: Configuring Environment Variables

If you are running on constrained VRAM (e.g., 6GB GPU), you can apply safer variables. We provide a script for this:

```powershell
. .\ai_server\set_env.ps1
```

Or you can set them manually in PowerShell before running the server:

```powershell
$env:MAX_GPU_MEMORY_GB = '4.5'
$env:LOAD_IN_4BIT = 'true'
$env:COMPUTE_DTYPE = 'float16'
```

*(See `ai_server/ENV_README.md` for more details on environment variable configurations).*

## 5. Verifying the Server

The server should start on `127.0.0.1:8000`. You can verify it is running and correctly resolving the model path by hitting the health endpoint:

```powershell
curl.exe http://127.0.0.1:8000/health
```

The JSON response will show the `model_path` the server is using.