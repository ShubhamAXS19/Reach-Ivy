import io
import edge_tts

from config import settings


# Edge TTS voice options (all free, no API key needed):
# Female: en-US-JennyNeural, en-US-AriaNeural, en-US-MichelleNeural
# Male:   en-US-GuyNeural, en-US-ChristopherNeural
EDGE_TTS_VOICE = "en-US-JennyNeural"


async def synthesize_speech(text: str) -> bytes | None:
    """
    Returns MP3 bytes using the configured TTS provider.
    TTS_PROVIDER=browser  → returns None (frontend handles it, robotic quality)
    TTS_PROVIDER=edge     → uses Microsoft Edge Neural TTS (free, natural quality)
    TTS_PROVIDER=openai   → uses OpenAI TTS (paid)
    TTS_PROVIDER=elevenlabs → uses ElevenLabs (paid)
    """
    if settings.TTS_PROVIDER == "browser":
        return None
    if settings.TTS_PROVIDER == "edge":
        return await _edge_tts(text)
    if settings.TTS_PROVIDER == "elevenlabs":
        return await _elevenlabs_tts(text)
    return await _openai_tts(text)


async def _edge_tts(text: str) -> bytes:
    """Microsoft Edge Neural TTS — free, no API key, natural-sounding voice."""
    communicate = edge_tts.Communicate(text, EDGE_TTS_VOICE)
    buf = io.BytesIO()
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            buf.write(chunk["data"])
    buf.seek(0)
    return buf.read()


async def _openai_tts(text: str) -> bytes:
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    response = await client.audio.speech.create(
        model=settings.OPENAI_TTS_MODEL,
        voice=settings.OPENAI_TTS_VOICE,
        input=text,
        response_format="mp3",
    )
    return response.content


async def _elevenlabs_tts(text: str) -> bytes:
    import httpx
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{settings.ELEVENLABS_VOICE_ID}"
    headers = {"xi-api-key": settings.ELEVENLABS_API_KEY, "Content-Type": "application/json"}
    payload = {
        "text": text,
        "model_id": "eleven_monolingual_v1",
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
    }
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(url, json=payload, headers=headers)
        resp.raise_for_status()
        return resp.content