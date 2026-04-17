### 3.2.1 LM Studio Setup (Dev Mode)

If you want to use LM Studio instead of loading the model locally (useful for VRAM-constrained systems):

1. **Enable Developer Mode in LM Studio:**
   - Open LM Studio
   - Go to **Settings** → **Developer Mode** (toggle ON)

2. **Load and Start a Model:**
   - In Developer Mode, select a GGUF model from your library
   - Click **Load Model**
   - Wait for it to load, then click **Start Server**
   - The server will run on `localhost:1234` by default

3. **Configure Environment Variables:**
   - Open PowerShell in your workspace
   - Activate your virtualenv: `. .\.venv\Scripts\Activate.ps1`
   - Set the LM Studio environment variables:
     ```powershell
     $env:USE_LM_STUDIO = 'true'
     $env:LM_STUDIO_IP = '192.168.1.15'  # Use 'localhost' if local
     $env:LM_STUDIO_PORT = '1234'
     $env:LM_STUDIO_API_KEY = 'your-token-if-required'  # Leave empty if no auth
     ```

4. **Verify Connection:**
   - Run the AI server: `python .\ai_server\backend_server.py`
   - Test the health endpoint: `curl http://localhost:8000/health`
   - Check that the response confirms LM Studio connection

5. **Troubleshooting:**
   - If connection fails, verify LM Studio is running and accessible at the specified IP/port
   - Check firewall settings if connecting across machines on your network
   - Verify the model is fully loaded (check LM Studio UI for status)

