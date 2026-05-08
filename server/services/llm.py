import re
import json
import google.generativeai as genai

from config import settings
from models import Message, EssayStructure

# Configure Gemini client
genai.configure(api_key=settings.GEMINI_API_KEY)

ESSAY_PROMPT = (
    '"How has your life experience contributed to your personal story — '
    "your character, values, perspectives, or skills — and what you want "
    'to pursue at this college?" (350 words)'
)

SYSTEM_PROMPT = f"""You are Ivy, a warm and expert college essay coach at HelloIvy.ai. \
You help high school students brainstorm and structure their personal statements \
through a friendly, voice-first conversation.

The essay prompt is: {ESSAY_PROMPT}

INTERVIEW STRUCTURE — conduct 4 stages, 2-3 questions each:
  Stage 1 — Life experiences: defining moments, challenges overcome, pivotal events
  Stage 2 — Values & character: core beliefs, how they treat others, what drives them
  Stage 3 — Skills & strengths: natural talents, developed abilities, what they're known for
  Stage 4 — College fit & goals: intended major, why this college, future vision

CONVERSATION GUIDELINES:
- Ask ONE clear, open-ended question at a time
- Be warm, curious, and encouraging — like a trusted mentor
- Briefly acknowledge their answer (1 sentence) before the next question
- Keep total response SHORT — 2-3 sentences max, then the question
- After 8-12 total user messages, generate the essay structure

ESSAY STRUCTURE OUTPUT:
When you have enough material, append this JSON block at the END of your message:

<ESSAY_STRUCTURE>
{{
  "ready": true,
  "hook":        {{ "title": "...", "words": 40,  "notes": "Specific opening scene or moment" }},
  "context":     {{ "title": "...", "words": 55,  "notes": "Background context to establish" }},
  "challenge":   {{ "title": "...", "words": 80,  "notes": "Core tension or defining experience" }},
  "growth":      {{ "title": "...", "words": 80,  "notes": "How they changed and what they learned" }},
  "values":      {{ "title": "...", "words": 45,  "notes": "Key values and character traits revealed" }},
  "college_fit": {{ "title": "...", "words": 50,  "notes": "Specific connection to college and goals" }}
}}
</ESSAY_STRUCTURE>

Start by warmly greeting the student, explaining in 2 sentences what you'll do \
together, then ask your first question about a memorable life experience."""


def parse_essay_structure(text: str) -> tuple[str, EssayStructure | None]:
    match = re.search(r"<ESSAY_STRUCTURE>(.*?)</ESSAY_STRUCTURE>", text, re.DOTALL)
    if not match:
        return text.strip(), None
    clean_message = text[: match.start()].strip()
    try:
        data = json.loads(match.group(1).strip())
        return clean_message, EssayStructure(**data)
    except Exception as e:
        print(f"Failed to parse essay structure: {e}")
        return clean_message, None


async def _gemini_chat(messages: list[Message]) -> str:
    """Call Gemini 2.0 Flash (free tier via Google AI Studio)."""
    if not settings.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not set in .env")

    model = genai.GenerativeModel(
        model_name="gemini-2.0-flash",
        system_instruction=SYSTEM_PROMPT,
    )

    # Convert to Gemini format — all messages except the last go into history
    gemini_history = []
    for m in messages[:-1]:
        gemini_history.append({
            "role": "user" if m.role == "user" else "model",
            "parts": [m.content],
        })

    chat = model.start_chat(history=gemini_history)
    response = chat.send_message(messages[-1].content)
    return response.text


async def _claude_chat(messages: list[Message]) -> str:
    """Optional fallback: Anthropic Claude Sonnet (only used if ANTHROPIC_API_KEY is set)."""
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            messages=[{"role": m.role, "content": m.content} for m in messages],
        )
        return response.content[0].text
    except ImportError:
        raise ValueError("anthropic package not installed")


async def get_chat_response(messages: list[Message]) -> tuple[str, EssayStructure | None]:
    """
    Primary: Gemini 2.0 Flash (free tier — Google AI Studio key required).
    Fallback: Claude Sonnet (only if ANTHROPIC_API_KEY is also set).
    """
    raw_text = None

    # ── Primary: Gemini (free) ──────────────────────────
    if settings.GEMINI_API_KEY:
        try:
            raw_text = await _gemini_chat(messages)
            print("✅ Used Gemini 2.0 Flash (free)")
        except Exception as e:
            print(f"⚠ Gemini failed ({e}), trying fallback...")

    # ── Fallback: Claude (optional, paid) ──────────────
    if raw_text is None and settings.ANTHROPIC_API_KEY:
        try:
            raw_text = await _claude_chat(messages)
            print("✅ Used Claude (fallback)")
        except Exception as e:
            print(f"⚠ Claude fallback also failed: {e}")

    if raw_text is None:
        raise ValueError(
            "No LLM available. Set GEMINI_API_KEY in .env "
            "(free at https://aistudio.google.com/app/apikey)"
        )

    return parse_essay_structure(raw_text)