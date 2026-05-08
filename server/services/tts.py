import httpx
from openai import AsyncOpenAI
from config import settings


async def synthesize_speech(text: str) -> bytes | None:
    """
    Returns MP3 bytes, or None if TTS_PROVIDER=browser
    (frontend handles speech synthesis itself).
    """
    if settings.TTS_PROVIDER == "browser":
        return None
    if settings.TTS_PROVIDER == "elevenlabs":
        return await _elevenlabs_tts(text)
    return await _openai_tts(text)


async def _openai_tts(text: str) -> bytes:
    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    response = await client.audio.speech.create(
        model=settings.OPENAI_TTS_MODEL,
        voice=settings.OPENAI_TTS_VOICE,
        input=text,
        response_format="mp3",
    )
    return response.content


async def _elevenlabs_tts(text: str) -> bytes:
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{settings.ELEVENLABS_VOICE_ID}"
    headers = {"xi-api-key": settings.ELEVENLABS_API_KEY, "Content-Type": "application/json"}
    payload = {"text": text, "model_id": "eleven_monolingual_v1", "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}}
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(url, json=payload, headers=headers)
        resp.raise_for_status()
        return resp.content