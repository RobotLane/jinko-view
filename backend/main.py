from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from jinko_core import JinkoLogic
import uvicorn

app = FastAPI(title="Jinko Titan API", version="21.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATA MODELS ---
class AuditRequest(BaseModel):
    text: str
    state: str
    brokerage: str
    rules: str
    is_owner: bool

class GeneratorRequest(BaseModel):
    address: str
    specs: str
    features: str
    tone: str

class AudioRequest(BaseModel):
    text: str
    voice_id: str

class UploadRequest(BaseModel):
    filename: str
    file_type: str

# --- ENDPOINTS ---
@app.get("/")
def health_check():
    return {"status": "Jinko Brain is Online", "version": "21.0"}

@app.post("/api/audit")
def run_audit(payload: AuditRequest):
    try:
        return JinkoLogic.audit_listing(payload.text, payload.state, payload.brokerage, payload.rules, payload.is_owner)
    except Exception as e:
        print(f"ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate")
def create_listing(payload: GeneratorRequest):
    try:
        return {"draft": JinkoLogic.generate_listing(payload.address, payload.specs, payload.features, payload.tone)}
    except Exception as e:
        print(f"ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/audio")
def create_audio(payload: AudioRequest):
    try:
        return {"audio_base64": JinkoLogic.generate_audio(payload.text, payload.voice_id)}
    except Exception as e:
        print(f"ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/upload-url")
def get_presigned_url(payload: UploadRequest):
    try:
        return JinkoLogic.get_upload_url(payload.filename, payload.file_type)
    except Exception as e:
        print(f"ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)