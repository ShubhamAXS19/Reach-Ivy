import io
from openai import AsyncOpenAI
from config import settings


async def transcribe_audio(audio_bytes: bytes, filename: str = "audio.webm") -> str:
    """Transcribe audio using OpenAI Whisper."""
    if not settings.OPENAI_API_KEY:
        raise ValueError("OPENAI_API_KEY not set — use browser voice input instead")

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = filename

    transcript = await client.audio.transcriptions.create(
        model="whisper-1",
        file=audio_file,
        language="en",
        response_format="text",
    )
    return transcript.strip()