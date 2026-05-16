from pydantic import BaseModel
from typing import List, Literal, Optional


class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: List[Message]


class EssaySection(BaseModel):
    title: str
    words: int=0
    notes: str


class EssayStructure(BaseModel):
    ready: bool
    hook: EssaySection
    context: EssaySection
    challenge: EssaySection
    growth: EssaySection
    values: EssaySection
    college_fit: EssaySection


class ChatResponse(BaseModel):
    message: str
    essay_structure: Optional[EssayStructure] = None


class TTSRequest(BaseModel):
    text: str


class STTResponse(BaseModel):
    transcript: str
