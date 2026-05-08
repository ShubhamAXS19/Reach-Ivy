from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # LLM + STT — Groq free tier (https://console.groq.com)
    GROQ_API_KEY: str = ""

    # TTS — "edge" = Microsoft Edge Neural TTS (free, natural quality, no key needed)
    #        "browser" = browser SpeechSynthesis (free, robotic)
    #        "openai" or "elevenlabs" = paid
    TTS_PROVIDER: str = "edge"

    # Optional — only needed if TTS_PROVIDER=openai
    OPENAI_API_KEY: str = ""
    OPENAI_TTS_VOICE: str = "nova"
    OPENAI_TTS_MODEL: str = "tts-1"

    # Optional — only needed if TTS_PROVIDER=elevenlabs
    ELEVENLABS_API_KEY: str = ""
    ELEVENLABS_VOICE_ID: str = "EXAVITQu4vr4xnSDxMaL"

    PORT: int = 8000
    CORS_ORIGINS: str = "http://localhost:5173"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}

    def get_cors_origins(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]


settings = Settings()