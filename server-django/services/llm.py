import re
import json
from groq import AsyncGroq

from config import settings
from models import Message, EssayStructure

ESSAY_PROMPT = "How has your life experience contributed to your personal story — your character, values, perspectives, or skills — and what you want to pursue at this college? (350 words)"

# COMPLETELY DYNAMIC SYSTEM PROMPT - No hardcoded questions
SYSTEM_PROMPT = """You are Ivy, a warm, patient college coach for 17-year-old students who may be undecided about their future.

YOUR PERSONALITY:
- Curious, encouraging, never judgmental
- You help students discover themselves, not force answers
- You normalize uncertainty: "It's completely fine if you're not sure yet"
- You make exploration feel exciting, not stressful

YOUR ONLY GOAL: Help the student discover what genuinely interests them.

HOW TO GENERATE QUESTIONS DYNAMICALLY:
Each question MUST be based on what they just said. Never use pre-written questions.

CONVERSATION STRUCTURE (5 phases, ~10 questions total):

PHASE 1 - Discover passion (2-3 questions):
- Start warm: "Hi! I'm Ivy. To help you explore possibilities, tell me - what's something you've done recently that made you lose track of time?"
- Then ask about a specific moment: "What did you enjoy most about that?"
- Then explore frustration: "What about that activity frustrates or challenges you?"

PHASE 2 - Explore values (2 questions):
- Connect to real world: "If you could change ONE thing about how that works in the real world, what would it be?"
- Explore their "why": "Why does that matter to you personally?"

PHASE 3 - Discover strengths (2 questions):
- Ask about natural abilities: "What comes easily to you that seems hard for others?"
- Ask about growth: "What's something you used to struggle with but have gotten better at?"

PHASE 4 - Connect to possibilities (2 questions):
- Explore domains: "Based on what you love and what you're good at, have you ever explored fields like [dynamic suggestion]?"
- Ask open-ended: "What questions do YOU have about different careers or college paths?"

PHASE 5 - Essay brainstorming (2 questions):
- "If you wrote a college essay about your passion, what specific story would you want to tell?"
- "What do you want people to understand about you that isn't on a resume?"

CRITICAL RULES:
1. NEVER use the exact same question twice across different students
2. ALWAYS reference something they said in your previous response
3. Keep responses under 40 words before the next question
4. After ~10 exchanges, generate the essay structure

ESSAY_STRUCTURE (generate based on THEIR unique story):
<ESSAY_STRUCTURE>
{
  "ready": true,
  "hook": {
    "title": "Opening scene — write a SPECIFIC one-line scene from their actual story (e.g. 'The night I rewrote the same function 11 times' or 'Standing at the hospital bed, clipboard in hand')",
    "notes": "Describe the exact moment in 2-3 sentences. Use their actual words where possible. This must be a scene an admissions officer can visualise — not a vague statement like 'I have always loved science'."
  },
  "context": {
    "title": "How I got here — specific to their background",
    "notes": "Reference the specific activity, experience or environment they mentioned. How did they discover this interest? Name the real thing (the club, the project, the person, the place)."
  },
  "challenge": {
    "title": "The tension or problem they personally faced",
    "notes": "Pull a specific obstacle or frustration they mentioned — not a generic challenge. What went wrong, what was hard, what did they have to push through? Use their own framing."
  },
  "growth": {
    "title": "What changed — a concrete shift",
    "notes": "What specific skill, mindset or realisation did they gain from this experience? Reference the actual thing they said they improved at or learned."
  },
  "values": {
    "title": "What this reveals about who they are",
    "notes": "Name 1-2 values that came through strongly in their answers (e.g. 'relentless curiosity', 'quiet determination'). These should feel earned by the story, not assigned."
  },
  "college_fit": {
    "title": "What they want to do next — specific",
    "notes": "Reference their actual goals, interests or questions about the future. What do they want to explore, build or contribute? Tie it back to the hook moment."
  }
}
</ESSAY_STRUCTURE>

REMEMBER: Every question must be unique to this student. Start with a warm, open-ended invitation. Be curious, not scripted."""

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
    """
    if not settings.GROQ_API_KEY:
        raise ValueError(
            "GROQ_API_KEY not set. Get a free key at https://console.groq.com"
        )

    client = AsyncGroq(api_key=settings.GROQ_API_KEY)
    
    # Count user messages to track progress
    user_messages = [m for m in messages if m.role == "user"]
    user_message_count = len(user_messages)
    
    # Add context about their previous answers
    context_hint = ""
    if user_message_count > 0:
        last_user_message = user_messages[-1].content[:150]
        context_hint = f"\n\n[Last student said: '{last_user_message}'. Generate your next question based ONLY on this.]"
    
    # For first message, no context needed
    if user_message_count == 0:
        context_hint = "\n\n[This is the first message. Introduce yourself warmly and ask what they enjoy doing.]"
    
    response = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT + context_hint},
            *[{"role": m.role, "content": m.content} for m in messages],
        ],
        max_tokens=800,
        temperature=0.8,
    )

    raw_text = response.choices[0].message.content
    print(f"✅ Used Groq / Llama 3.3 70B - Exchange: {user_message_count + 1}")
    return parse_essay_structure(raw_text)


def get_fallback_report(interests_text: str) -> dict:
    """Generate a fallback report based on keywords in their responses"""
    interests_lower = interests_text.lower()
    
    if any(word in interests_lower for word in ['code', 'program', 'computer', 'tech', 'software', 'ai', 'robot', 'build', 'engineer']):
        return {
            "recommended_domain": "Computer Science / Engineering",
            "domain_confidence": 0.75,
            "key_themes": ["technology", "problem-solving", "innovation", "logic", "creation"],
            "strengths": ["analytical", "detail-oriented", "creative problem-solver"],
            "suggested_majors": ["Computer Science: building things", "Engineering: creating solutions", "Data Science: finding patterns"],
            "problem_solving_style": "Systematic and logical approach",
            "career_pathways": ["Software Developer", "Engineer", "Tech Product Manager"],
            "exploration_suggestions": ["Try a coding challenge", "Build a small project", "Join a robotics club"],
            "summary_insight": f"You show strong interest in technology and building things. Your curiosity about {interests_text[:100]} suggests you'd thrive in a field that combines creativity with logical thinking."
        }
    elif any(word in interests_lower for word in ['help', 'people', 'care', 'community', 'volunteer', 'social', 'therapy']):
        return {
            "recommended_domain": "Social Sciences / Healthcare",
            "domain_confidence": 0.75,
            "key_themes": ["empathy", "community", "helping others", "social impact", "connection"],
            "strengths": ["empathetic", "communicative", "service-oriented"],
            "suggested_majors": ["Psychology: understanding behavior", "Sociology: studying communities", "Public Health: helping populations"],
            "problem_solving_style": "Human-centered and empathetic",
            "career_pathways": ["Counselor", "Social Worker", "Healthcare Administrator"],
            "exploration_suggestions": ["Volunteer locally", "Take a psychology course", "Shadow a professional"],
            "summary_insight": f"Your desire to help others and interest in {interests_text[:100]} points toward people-centered fields where you can make a direct impact."
        }
    elif any(word in interests_lower for word in ['art', 'draw', 'design', 'creative', 'music', 'write', 'film', 'paint']):
        return {
            "recommended_domain": "Arts & Design",
            "domain_confidence": 0.75,
            "key_themes": ["creativity", "expression", "beauty", "innovation", "storytelling"],
            "strengths": ["creative", "imaginative", "expressive"],
            "suggested_majors": ["Graphic Design: visual communication", "Digital Media: creative technology", "Fine Arts: traditional expression"],
            "problem_solving_style": "Creative and intuitive",
            "career_pathways": ["Graphic Designer", "UX/UI Designer", "Creative Director"],
            "exploration_suggestions": ["Build a portfolio", "Try design software", "Take an art class"],
            "summary_insight": f"Your creative interests and passion for {interests_text[:100]} suggest you'd excel in fields that value artistic expression and innovation."
        }
    elif any(word in interests_lower for word in ['science', 'experiment', 'research', 'biology', 'chemistry', 'physics', 'nature', 'lab']):
        return {
            "recommended_domain": "Natural Sciences",
            "domain_confidence": 0.75,
            "key_themes": ["curiosity", "discovery", "analysis", "nature", "experimentation"],
            "strengths": ["analytical", "curious", "methodical"],
            "suggested_majors": ["Biology: life sciences", "Chemistry: matter and reactions", "Environmental Science: earth systems"],
            "problem_solving_style": "Scientific and evidence-based",
            "career_pathways": ["Research Scientist", "Lab Technician", "Environmental Consultant"],
            "exploration_suggestions": ["Conduct an experiment", "Watch science documentaries", "Visit a science museum"],
            "summary_insight": f"Your curiosity about how things work and interest in {interests_text[:100]} aligns well with scientific exploration and discovery."
        }
    elif any(word in interests_lower for word in ['business', 'money', 'startup', 'entrepreneur', 'sell', 'market', 'finance']):
        return {
            "recommended_domain": "Business & Entrepreneurship",
            "domain_confidence": 0.75,
            "key_themes": ["leadership", "strategy", "innovation", "value creation", "growth"],
            "strengths": ["strategic", "ambitious", "resourceful"],
            "suggested_majors": ["Business Administration: management skills", "Marketing: understanding customers", "Finance: money and markets"],
            "problem_solving_style": "Strategic and opportunity-focused",
            "career_pathways": ["Entrepreneur", "Business Analyst", "Marketing Manager"],
            "exploration_suggestions": ["Start a small project", "Take a business course", "Join a entrepreneurship club"],
            "summary_insight": f"Your interest in {interests_text[:100]} shows business acumen. You have an entrepreneurial mindset that could thrive in business environments."
        }
    else:
        return {
            "recommended_domain": "Exploratory Studies",
            "domain_confidence": 0.5,
            "key_themes": ["exploration", "self-discovery", "curiosity", "growth", "potential"],
            "strengths": ["thoughtful", "open-minded", "motivated to explore"],
            "suggested_majors": ["Undecided: Take time to explore", "Liberal Arts: Broad foundation", "Interdisciplinary Studies: Combine interests"],
            "problem_solving_style": "Reflective and curious",
            "career_pathways": ["Explore multiple paths", "Career counseling", "Gap year exploration"],
            "exploration_suggestions": ["Take a career assessment test", "Talk to professionals in different fields", "Try online courses in subjects that interest you"],
            "summary_insight": f"You're exploring what excites you, and that's exactly the right approach. Your interest in {interests_text[:100] if interests_text else 'learning and growing'} shows you're on the right path to finding your direction."
        }


async def analyze_conversation_for_report(messages: list) -> dict:
    """
    Analyze the full conversation and generate a structured report.
    """
    if not settings.GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY not set")
    
    print(f"🔍 Generating report for {len(messages)} messages...")
    
    # Extract the student's revealed interests
    student_interests = []
    for msg in messages:
        if msg.get('role') == 'user' and len(msg.get('content', '')) > 5:
            student_interests.append(msg.get('content', ''))
    
    interests_text = "\n".join(student_interests[:8])
    print(f"📝 Student interests preview: {interests_text[:300]}...")
    
    conv_text = "\n".join([f"{msg.get('role', '').upper()}: {msg.get('content', '')}" for msg in messages])
    
    REPORT_ANALYSIS_PROMPT = f"""Analyze this conversation with a 17-year-old student. Return ONLY valid JSON.

Student's responses:
{interests_text[:1000]}

Return JSON:
{{
  "recommended_domain": "specific field",
  "domain_confidence": 0.85,
  "key_themes": ["theme1", "theme2", "theme3", "theme4", "theme5"],
  "strengths": ["strength1", "strength2", "strength3", "strength4"],
  "suggested_majors": ["Major 1: reason", "Major 2: reason", "Major 3: reason"],
  "problem_solving_style": "description",
  "career_pathways": ["career1", "career2"],
  "exploration_suggestions": ["suggestion1", "suggestion2", "suggestion3"],
  "summary_insight": "2-sentence summary"
}}"""
    
    client = AsyncGroq(api_key=settings.GROQ_API_KEY)
    
    try:
        print("📤 Calling Groq API for report analysis...")
        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a college counselor. Return ONLY valid JSON."},
                {"role": "user", "content": REPORT_ANALYSIS_PROMPT}
            ],
            max_tokens=800,
            temperature=0.7,
        )
        
        raw_text = response.choices[0].message.content
        print(f"📥 Raw Groq response: {raw_text[:300]}...")
        
        raw_text = raw_text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        if raw_text.startswith("```"):
            raw_text = raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]
        raw_text = raw_text.strip()
        
        try:
            result = json.loads(raw_text)
            print(f"✅ Report analysis complete: {result.get('recommended_domain', 'Unknown')}")
            return result
        except json.JSONDecodeError as e:
            print(f"❌ Failed to parse JSON: {e}")
            return get_fallback_report(interests_text)
            
    except Exception as e:
        print(f"❌ Groq API error: {e}")
        return get_fallback_report(interests_text)