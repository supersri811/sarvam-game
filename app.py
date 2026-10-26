import base64
import os
from pathlib import Path

from fastapi import FastAPI, File, UploadFile
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sarvamai import SarvamAI
from sarvamai.core.api_error import ApiError

ROOT = Path(__file__).parent

# Load .env locally; on a host (Render etc.) the key comes from real env vars.
env_file = ROOT / ".env"
if env_file.exists():
    for line in env_file.read_text().splitlines():
        key, sep, value = line.partition("=")
        if sep and key.strip() and not key.startswith("#"):
            os.environ.setdefault(key.strip(), value.strip())

client = SarvamAI(api_subscription_key=os.environ.get("SARVAM_API_KEY", ""))
app = FastAPI()

# The same letters get requested again and again; cache so we pay once.
tts_cache: dict[tuple, bytes] = {}


class TtsRequest(BaseModel):
    text: str
    language_code: str = "hi-IN"
    pace: float = 1.0


def api_error(e: ApiError) -> JSONResponse:
    message = "Sarvam has no credits left." if e.status_code == 402 else f"Sarvam error {e.status_code}"
    return JSONResponse({"error": message}, status_code=e.status_code or 500)


def other_error(e: Exception) -> JSONResponse:
    # e.g. network down or timeout; log the details, send a readable message
    print(f"Sarvam call failed: {type(e).__name__}: {e}")
    return JSONResponse({"error": f"Server problem ({type(e).__name__}). Try again."}, status_code=502)


@app.post("/api/tts")
def tts(req: TtsRequest):
    text = req.text.strip()[:300]  # lessons are short; this also caps cost
    cache_key = (text, req.language_code, req.pace)
    if cache_key not in tts_cache:
        try:
            result = client.text_to_speech.convert(
                text=text,
                language_code=req.language_code,
                speaker="ritu",
                model="bulbul:v3",
                pace=req.pace,
                output_audio_codec="wav",
            )
        except ApiError as e:
            return api_error(e)
        except Exception as e:
            return other_error(e)
        tts_cache[cache_key] = base64.b64decode(result.audios[0])
    return Response(tts_cache[cache_key], media_type="audio/wav")


@app.post("/api/stt")
async def stt(audio: UploadFile = File(...)):
    data = await audio.read()
    try:
        result = client.speech_to_text.transcribe(
            file=(audio.filename or "speech.webm", data, audio.content_type or "audio/webm"),
            model="saaras:v4",
            mode="transcribe",
            language_code="hi-IN",
        )
    except ApiError as e:
        return api_error(e)
    except Exception as e:
        return other_error(e)
    return {"transcript": result.transcript}


@app.get("/")
def index():
    return FileResponse(ROOT / "static" / "index.html")


app.mount("/static", StaticFiles(directory=ROOT / "static"), name="static")
