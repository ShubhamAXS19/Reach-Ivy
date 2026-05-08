from fastapi import APIRouter, UploadFile, File, HTTPException
from models import STTResponse
from services.stt import transcribe_audio

router = APIRouter()

ALLOWED_TYPES = {"audio/webm", "audio/mp4", "audio/wav", "audio/ogg", "audio/mpeg"}


@router.post("", response_model=STTResponse)
async def speech_to_text(audio: UploadFile = File(...)):
    """
    Accepts an audio file (webm/wav/mp4) recorded by MediaRecorder in the browser.
    Returns the Whisper transcript.
    """
    if audio.content_type and audio.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported audio type: {audio.content_type}",
        )
    try:
        audio_bytes = await audio.read()
        transcript = await transcribe_audio(audio_bytes, filename=audio.filename or "audio.webm")
        return STTResponse(transcript=transcript)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
