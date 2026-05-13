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

| Layer     | Primary                          | Fallback / Alternative  |
| --------- | -------------------------------- | ----------------------- |
| LLM       | Groq / Llama 3.3 70B (free)      | —                       |
| STT       | Browser Web Speech API (free)    | Groq Whisper (free)     |
| TTS       | Microsoft Edge Neural TTS (free) | OpenAI TTS / ElevenLabs |
| Backend   | FastAPI (Python 3.10+)           | Django (parallel)       |
| Frontend  | Next.js 16 + Tailwind CSS v4     | —                       |
| Voice I/O | MediaRecorder API (browser)      | —                       |

---

## Project Structure

```
helloimy/
│
├── .env.example
│
├── server/                           ← FastAPI backend (original)
│   ├── main.py                       ← App entry, CORS, router registration
│   ├── config.py                     ← Pydantic settings (reads .env)
│   ├── models.py                     ← Request/response schemas
│   ├── requirements.txt
│   ├── routers/
│   │   ├── chat.py                   ← POST /api/chat
│   │   ├── stt.py                    ← POST /api/stt
│   │   └── tts.py                    ← POST /api/tts
│   └── services/
│       ├── llm.py                    ← Groq / Llama + essay parser
│       ├── stt.py                    ← Whisper transcription
│       └── tts.py                    ← Edge TTS / OpenAI / ElevenLabs
│
├── server-django/                    ← Django backend (parallel)
│   ├── manage.py
│   ├── config.py                     ← Shared config (same as FastAPI)
│   ├── models.py                     ← Pydantic schemas (shared)
│   ├── requirements.txt
│   ├── core/
│   │   ├── settings.py               ← Django settings
│   │   ├── urls.py                   ← Root URL conf
│   │   └── asgi.py                   ← ASGI entry point
│   ├── api/
│   │   ├── views.py                  ← chat, stt, tts views
│   │   └── urls.py                   ← API URL patterns
│   └── services/                     ← Same services as FastAPI (copied)
│       ├── llm.py
│       ├── stt.py
│       └── tts.py
│
├── client/                           ← Original React + Vite frontend
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── App.jsx
│       ├── api/client.js
│       ├── hooks/
│       │   ├── useConversation.js
│       │   └── useVoiceRecorder.js
│       └── components/
│           ├── Sidebar.jsx
│           ├── ChatWindow.jsx
│           ├── VoiceButton.jsx
│           ├── EssayOutput.jsx
│           ├── LandingModal.jsx
│           └── OnboardingTour.jsx
│
└── client-next/                      ← Next.js 16 frontend (primary)
    ├── next.config.js                ← API proxy → backend
    ├── app/
    │   ├── layout.jsx
    │   ├── page.jsx                  ← Root page (App.jsx equivalent)
    │   └── globals.css               ← Tailwind v4 + CSS theme variables
    ├── components/
    │   ├── Sidebar.jsx
    │   ├── ChatWindow.jsx
    │   ├── VoiceButton.jsx
    │   ├── EssayOutput.jsx
    │   ├── LandingModal.jsx
    │   └── OnboardingTour.jsx
    ├── hooks/
    │   ├── useConversation.js
    │   └── useVoiceRecorder.js
    └── api/
        └── client.js
```

---

## API Endpoints

| Method | Endpoint  | Description                                    |
| ------ | --------- | ---------------------------------------------- |
| GET    | /health   | Health check + active TTS provider             |
| POST   | /api/chat | Send conversation history → Ivy's next message |
| POST   | /api/stt  | Upload audio blob → Whisper transcript         |
| POST   | /api/tts  | Text → MP3 bytes (204 if TTS_PROVIDER=browser) |

Both FastAPI (`localhost:8000`) and Django (`localhost:8001`) expose identical endpoints.
FastAPI interactive docs: http://localhost:8000/docs

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
cp .env.example server-django/.env
# Edit both .env files and fill in your API keys
# Add DJANGO_SECRET_KEY to server-django/.env
```

### 2a — Start FastAPI backend (port 8000)

```bash
cd server
python3.10 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2b — Start Django backend (port 8001)

```bash
cd server-django
source venv/bin/activate
uvicorn core.asgi:application --host 0.0.0.0 --port 8001 --reload
```

### 3 — Start Next.js frontend

```bash
cd client-next
npm install
npm run dev
# Open http://localhost:3000 in Chrome or Edge
```

To switch between backends, update one line in `client-next/next.config.js`:

```js
// FastAPI (default)
destination: "http://localhost:8000/api/:path*";

// Django
destination: "http://localhost:8001/api/:path*";
```

---

## Environment Variables

```env
# LLM + STT — Groq free tier (https://console.groq.com)
GROQ_API_KEY=gsk_...

# TTS provider
TTS_PROVIDER=edge              # edge = Microsoft Edge Neural TTS (free, natural quality)
                               # browser = browser SpeechSynthesis (free, robotic)
                               # openai or elevenlabs = paid

# Optional paid TTS
OPENAI_API_KEY=sk-...
OPENAI_TTS_VOICE=nova
OPENAI_TTS_MODEL=tts-1
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL

# Server
PORT=8000
CORS_ORIGINS=http://localhost:3000

# Django only
DJANGO_SECRET_KEY=your-long-random-secret-key-here
```

---

## Voice Pipeline

```
User clicks mic
    ↓
Browser Web Speech API transcribes in real time
    ↓  (fallback: MediaRecorder → POST /api/stt → Groq Whisper)
POST /api/chat  →  Groq / Llama 3.3 70B  →  Ivy's reply
    ↓
POST /api/tts  →  Edge TTS plays audio
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

- **Dark / light mode** — toggle in topbar and landing screen
- **Dark slate theme** — easy on the eyes for long sessions
- **Resizable sidebar** — drag the right edge; snaps to icon strip below 120px
- **Onboarding tour** — 7-step spotlight tour on first load, re-accessible via "? Help"
- **Voice + text** — mix freely throughout the conversation
- **Live transcript** — words appear in real time as you speak
- **Stage tracker** — progress bar in sidebar shows active interview stage
- **TTS playback** — Ivy speaks every response; click mic to interrupt

---

## Common Errors

| Error                                | Fix                                                                        |
| ------------------------------------ | -------------------------------------------------------------------------- |
| `No module named 'django'`           | Run `./venv/bin/uvicorn` not system `uvicorn`                              |
| `No module named 'api.urls'`         | Check filename is `urls.py` not `url.py`                                   |
| `No module named 'models'`           | Copy `server/models.py` to `server-django/models.py`                       |
| `Cannot apply unknown utility class` | Tailwind v4 — use `@theme` in `globals.css`, delete `tailwind.config.js`   |
| `CORS error from Next.js`            | Set `baseURL: '/api'` in `api/client.js`, use rewrites in `next.config.js` |
| `Microphone denied`                  | Use Chrome/Edge, allow mic in browser settings                             |
| `401 Groq`                           | Check `GROQ_API_KEY` in `.env`                                             |

---

## Recording the Demo

1. Start backend → start frontend
2. Open Loom or OBS — record screen + mic
3. Walk through: terminal → browser → onboarding tour → full voice conversation → essay output
4. Keep terminal visible — live API logs prove real calls are being made

---

## Evaluation Criteria

| Criteria          | Implementation                                                                                                     |
| ----------------- | ------------------------------------------------------------------------------------------------------------------ |
| Creativity        | Dual backend (FastAPI + Django); Next.js migration; dark/light mode; browser-native STT/TTS with paid upgrade path |
| Research          | Reviewed Unifrog, Sups.ai, Ambitio Pro, Kollegio; 4-stage interview modelled on real counselling frameworks        |
| Voice demo        | End-to-end voice pipeline, no human intervention                                                                   |
| Working prototype | Full-stack: FastAPI + Django + Next.js, all API calls real                                                         |
| Tech stack        | Documented in sidebar, README, and flowchart                                                                       |
| Product flow      | See `helloimy-flowchart.drawio`                                                                                    |

---

_Built by Shubham · HelloIvy.ai take-home · 2025_
