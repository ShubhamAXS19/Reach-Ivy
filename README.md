# 🍀 HelloIvy — AI Essay Brainstormer

> A voice-first AI coach that interviews high school students and generates a personalised college essay structure — end-to-end, without human intervention.

Built as a take-home assignment for **HelloIvy.ai** (Reach Education Pvt. Ltd.)

---

## Demo Flow

```
Student lands → Onboarding tour → Voice interview (8–12 questions) → Essay structure breakdown
```

---

## Tech Stack

| Layer     | Primary                         | Fallback / Alternative  |
| --------- | ------------------------------- | ----------------------- |
| LLM       | Google Gemini 2.0 Flash (free)  | Anthropic Claude Sonnet |
| STT       | Browser Web Speech API (free)   | OpenAI Whisper (paid)   |
| TTS       | Browser Speech Synthesis (free) | OpenAI TTS / ElevenLabs |
| Backend   | FastAPI (Python 3.10+)          | —                       |
| Frontend  | React 18 + Vite + Tailwind CSS  | —                       |
| Voice I/O | MediaRecorder API (browser)     | —                       |

---

## Project Structure

```
helloimy-essay-brainstormer/
│
├── .env.example
│
├── server/
│   ├── main.py                   ← App entry, CORS, router registration
│   ├── config.py                 ← Pydantic settings (reads .env)
│   ├── models.py                 ← Request/response schemas
│   ├── requirements.txt
│   ├── routers/
│   │   ├── chat.py               ← POST /api/chat
│   │   ├── stt.py                ← POST /api/stt
│   │   └── tts.py                ← POST /api/tts
│   └── services/
│       ├── llm.py                ← Gemini → Claude fallback + essay parser
│       ├── stt.py                ← Whisper transcription
│       └── tts.py                ← OpenAI / ElevenLabs synthesis
│
└── client/
    ├── index.html
    ├── vite.config.js            ← Proxies /api → :8000
    ├── tailwind.config.js
    ├── postcss.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx               ← Root, layout, state orchestration
        ├── index.css
        ├── api/client.js         ← sendChat, transcribeAudio, textToSpeech
        ├── hooks/
        │   ├── useConversation.js    ← Chat state, TTS playback
        │   └── useVoiceRecorder.js   ← Web Speech API + MediaRecorder fallback
        └── components/
            ├── Sidebar.jsx           ← Resizable sidebar: prompt + stages
            ├── ChatWindow.jsx        ← Message bubbles + typing indicator
            ├── VoiceButton.jsx       ← Mic button with all states
            ├── EssayOutput.jsx       ← 6-section essay structure breakdown
            └── OnboardingTour.jsx    ← 7-step interactive spotlight tour
```

---

## API Endpoints

| Method | Endpoint  | Description                                    |
| ------ | --------- | ---------------------------------------------- |
| GET    | /health   | Health check + active TTS provider             |
| POST   | /api/chat | Send conversation history → Ivy's next message |
| POST   | /api/stt  | Upload audio blob → Whisper transcript         |
| POST   | /api/tts  | Text → MP3 bytes (204 if TTS_PROVIDER=browser) |

Full interactive docs: http://localhost:8000/docs

---

## Quick Start

### Prerequisites

```bash
node --version    # v18+
python3 --version # v3.10+
```

### 1 — Configure environment

```bash
cp .env.example server/.env
# Edit server/.env and fill in your API keys
```

### 2 — Start backend

```bash
cd server
python3.10 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
./venv/bin/uvicorn main:app --reload --port 8000
```

You should see:

```
🍀 HelloIvy API starting — TTS provider: browser
INFO: Uvicorn running on http://127.0.0.1:8000
```

### 3 — Start frontend

```bash
cd client
npm install
npm run dev
# Open http://localhost:5173 in Chrome or Edge
```

---

## Environment Variables

```env
# Minimum config — zero cost
GEMINI_API_KEY=AIza...           # free at aistudio.google.com
TTS_PROVIDER=browser             # uses browser speech synthesis, no key needed
CORS_ORIGINS=http://localhost:5173

# Optional upgrades
ANTHROPIC_API_KEY=sk-ant-...     # Claude fallback if Gemini fails
OPENAI_API_KEY=sk-...            # Whisper STT + OpenAI TTS
TTS_PROVIDER=openai              # switch from browser to OpenAI TTS
ELEVENLABS_API_KEY=              # ElevenLabs TTS (best quality)
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL
OPENAI_TTS_VOICE=nova
OPENAI_TTS_MODEL=tts-1
PORT=8000
```

---

## Voice Pipeline

```
User clicks mic
    ↓
Browser Web Speech API transcribes in real time
    ↓  (fallback: MediaRecorder → POST /api/stt → Whisper)
POST /api/chat  →  Gemini 2.0 Flash  →  Ivy's reply
                        ↓ (fallback if Gemini fails)
                   Claude Sonnet
    ↓
POST /api/tts  →  Browser Speech Synthesis plays audio
                        ↓ (if TTS_PROVIDER=openai or elevenlabs)
                   MP3 bytes streamed to browser
    ↓
Loop until essay_structure JSON is returned
    ↓
EssayOutput renders 6-section 350-word breakdown
```

---

## Interview Stages

| Stage | Focus               | Sample questions                             |
| ----- | ------------------- | -------------------------------------------- |
| 1     | Life experiences    | Defining moments, challenges, pivotal events |
| 2     | Values & character  | Core beliefs, what drives them               |
| 3     | Skills & strengths  | Natural talents, developed abilities         |
| 4     | College fit & goals | Intended major, why this college             |

After 8–12 questions, Ivy generates the essay structure.

---

## Essay Output — 350 Word Budget

| Section     | Words | Purpose                              |
| ----------- | ----- | ------------------------------------ |
| Hook        | ~40   | Opening scene or moment              |
| Context     | ~55   | Background to establish              |
| Challenge   | ~80   | Core tension or defining experience  |
| Growth      | ~80   | How they changed, what they learned  |
| Values      | ~45   | Character traits revealed            |
| College Fit | ~50   | Connection to college + future goals |

---

## UI Features

- **Dark slate theme** — easy on the eyes for long sessions
- **Resizable sidebar** — drag the right edge; snaps to icon strip below 120px
- **Onboarding tour** — 7-step spotlight tour on first load, re-accessible via "? Help"
- **Voice + text** — mix freely throughout the conversation
- **Live transcript** — words appear in real time as you speak
- **Stage tracker** — progress bar in sidebar shows active interview stage
- **TTS playback** — Ivy speaks every response; click mic to interrupt

---

## Common Errors

| Error                           | Fix                                                |
| ------------------------------- | -------------------------------------------------- |
| `No module named 'anthropic'`   | Run `./venv/bin/uvicorn` not `uvicorn`             |
| `ValidationError: CORS_ORIGINS` | Add `extra: ignore` to `config.py` model_config    |
| `Microphone denied`             | Use Chrome/Edge, allow mic in browser settings     |
| `401 Gemini`                    | Check `GEMINI_API_KEY` in `server/.env`            |
| `SyntaxError: export default`   | Use `module.exports` in postcss + tailwind configs |

---

## Recording the Demo

1. Start backend → start frontend
2. Open Loom or OBS — record screen + mic
3. Walk through: terminal → browser → onboarding tour → full voice conversation → essay output
4. Keep terminal visible — live API logs prove real calls are being made

---

## Evaluation Criteria

| Criteria          | Implementation                                                                                                   |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- |
| Creativity        | Gemini → Claude fallback; browser-native STT/TTS with paid upgrade path; resizable sidebar; spotlight onboarding |
| Research          | Reviewed Unifrog, Sups.ai, Ambitio Pro, Kollegio; 4-stage interview modelled on real counselling frameworks      |
| Voice demo        | End-to-end voice pipeline, no human intervention                                                                 |
| Working prototype | Full-stack: FastAPI + React, all API calls real                                                                  |
| Tech stack        | Documented in sidebar, README, and flowchart                                                                     |
| Product flow      | See `helloimy-flowchart.drawio`                                                                                  |

---

_Built by Shubham · HelloIvy.ai take-home · 2025_
