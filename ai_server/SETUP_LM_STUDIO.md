# WarMatrix AI: LM Studio Setup (Dev Mode)

This method allows you to use LM Studio as the LLM provider instead of loading a model locally. This is highly recommended for systems with constrained VRAM or when you want to run the model on a different machine in your network.

## 1. Prepare LM Studio

1. **Enable Developer Mode:**
   - Open LM Studio.
   - Go to **Settings** → **Developer Mode** (toggle ON).

2. **Load and Start a Model:**
   - In Developer Mode, select a GGUF model from your library (e.g., Qwen 2.5 7B GGUF).
   - Click **Load Model**.
   - Wait for it to load, then click **Start Server**.
   - The server will run on `localhost:1234` by default.

## 2. Configure WarMatrix

1. **Open PowerShell** in your workspace root.

2. **Activate your environment:**
   ```powershell
   & .\.venv\Scripts\Activate.ps1
   ```

3. **Set the LM Studio environment variables:**
   ```powershell
   $env:USE_LM_STUDIO = 'true'
   $env:LM_STUDIO_IP = 'localhost'    # Change to IP address if running on another machine
   $env:LM_STUDIO_PORT = '1234'
   $env:LM_STUDIO_API_KEY = ''        # Leave empty if no auth is configured
   ```

## 3. Verify Connection

1. **Run the WarMatrix AI server:**
   ```powershell
   python .\ai_server\backend_server.py
   ```

2. **Test the health endpoint:**
   ```powershell
   curl http://localhost:8000/health
   ```
   Checking the response should confirm the `use_lm_studio` status is `true`.

## 4. Troubleshooting
- **Connection Failed:** Ensure LM Studio is running and the "Start Server" button has been clicked.
- **Network Issues:** If LM Studio is on another machine, ensure there are no firewalls blocking port `1234`.
- **Model Loading:** Verify the model is fully loaded in LM Studio before starting the WarMatrix backend.
