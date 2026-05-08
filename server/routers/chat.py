from fastapi import APIRouter, HTTPException
from models import ChatRequest, ChatResponse
from services.llm import get_chat_response

router = APIRouter()


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Accepts conversation history, returns Ivy's next message.
    If enough context has been gathered, also returns essay_structure.
    """
    if not request.messages:
        raise HTTPException(status_code=400, detail="messages array cannot be empty")

    try:
        message, essay_structure = await get_chat_response(request.messages)
        return ChatResponse(message=message, essay_structure=essay_structure)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
