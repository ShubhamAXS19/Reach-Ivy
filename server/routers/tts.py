from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from models import TTSRequest
from services.tts import synthesize_speech

router = APIRouter()


@router.post("")
async def text_to_speech(request: TTSRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="text cannot be empty")
    try:
        audio_bytes = await synthesize_speech(request.text)
        if audio_bytes is None:
            # Browser TTS mode — return empty 204
            return Response(status_code=204)
        return Response(content=audio_bytes, media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))