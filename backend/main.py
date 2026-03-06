import os

import uvicorn
from fastapi import FastAPI
from api.routes import router

app = FastAPI()
app.include_router(router)

@app.get("/")
def root():
    return {"message": "Wargame simulator backend running"}


if __name__ == "__main__":
    host = os.getenv("BACKEND_HOST", "0.0.0.0")
    port = int(os.getenv("BACKEND_PORT", "9000"))
    reload_enabled = os.getenv("BACKEND_RELOAD", "false").lower() in {"1", "true", "yes"}
    uvicorn.run("main:app", host=host, port=port, reload=reload_enabled)