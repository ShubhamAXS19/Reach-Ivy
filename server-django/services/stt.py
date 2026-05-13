import io
from groq import AsyncGroq
from config import settings


async def transcribe_audio(audio_bytes: bytes, filename: str = "audio.webm") -> str:
    """
    Transcribe audio using Groq Whisper (whisper-large-v3-turbo).
    Free tier: 7,200 minutes/day — no credit card needed.
    https://console.groq.com
    """
    if not settings.GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY not set. Get a free key at https://console.groq.com")

    client = AsyncGroq(api_key=settings.GROQ_API_KEY)
    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = filename  # Groq infers format from extension (.webm / .wav / .mp4)

    transcript = await client.audio.transcriptions.create(
        model="whisper-large-v3-turbo",  # faster + cheaper than v3, same accuracy
        file=audio_file,
        language="en",
        response_format="text",
    )

    # Groq returns a plain string in text mode (not an object like OpenAI)
    return transcript.strip() if isinstance(transcript, str) else transcript.text.strip()