import re
import json
from groq import AsyncGroq

from config import settings
from models import Message, EssayStructure

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


async def get_chat_response(messages: list[Message]) -> tuple[str, EssayStructure | None]:
    """
    Uses Groq (free tier) with Llama 3.3 70B.
    Sign up at https://console.groq.com — no credit card needed.
    Free tier: 14,400 requests/day, available globally including India.
    """
    if not settings.GROQ_API_KEY:
        raise ValueError(
            "GROQ_API_KEY not set. Get a free key at https://console.groq.com"
        )

    client = AsyncGroq(api_key=settings.GROQ_API_KEY)

    response = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            *[{"role": m.role, "content": m.content} for m in messages],
        ],
        max_tokens=1024,
        temperature=0.7,
    )

    raw_text = response.choices[0].message.content
    print("✅ Used Groq / Llama 3.3 70B (free)")
    return parse_essay_structure(raw_text)