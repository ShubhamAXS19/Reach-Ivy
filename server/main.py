from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from config import settings
from routers import chat, stt, tts


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"🍀 HelloIvy API starting — TTS provider: {settings.TTS_PROVIDER}")
    yield
    print("HelloIvy API shutting down")


app = FastAPI(
    title="HelloIvy Essay Brainstormer API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://reach-ivy.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(stt.router,  prefix="/api/stt",  tags=["stt"])
app.include_router(tts.router,  prefix="/api/tts",  tags=["tts"])


@app.get("/health")
async def health():
    return {"status": "ok", "tts_provider": settings.TTS_PROVIDER}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)
