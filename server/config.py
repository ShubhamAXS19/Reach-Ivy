from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # LLM — Groq free tier (https://console.groq.com)
    GROQ_API_KEY: str = ""

    # Legacy — no longer used
    GEMINI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    OPENAI_API_KEY: str = ""

    # TTS — "edge" uses Microsoft Edge Neural TTS (free, natural-sounding)
    #        "browser" uses browser SpeechSynthesis (free, robotic)
    #        "openai" or "elevenlabs" require paid API keys
    TTS_PROVIDER: str = "edge"
    OPENAI_TTS_VOICE: str = "nova"
    OPENAI_TTS_MODEL: str = "tts-1"
    ELEVENLABS_API_KEY: str = ""
    ELEVENLABS_VOICE_ID: str = "EXAVITQu4vr4xnSDxMaL"

    PORT: int = 8000
    CORS_ORIGINS: str = "http://localhost:5173"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}

    def get_cors_origins(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]


settings = Settings()