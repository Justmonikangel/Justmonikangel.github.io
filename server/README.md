# Sedona Release Server

Node.js + Express backend for a guided **Sedona Method** (Lester Levenson) release
session, with optional **ElevenLabs** text-to-speech.

The frontend lives elsewhere — this server only exposes a JSON + audio HTTP API.

## What is the Sedona Method?

A simple emotional-release process created by Lester Levenson and popularized by
Hale Dwoskin. Given a feeling, you ask yourself three questions:

1. **Could** you let it go?
2. **Would** you?
3. **When?**

Repeat until the feeling softens or releases.

## Quick start

```bash
cd server
cp .env.example .env       # then fill in ELEVENLABS_API_KEY
npm install
npm run dev                # http://localhost:3000
```

Health check:

```bash
curl http://localhost:3000/api/health
```

## API

### Sessions

| Method | Path                       | Notes                                       |
| ------ | -------------------------- | ------------------------------------------- |
| POST   | `/api/sessions`            | Create a new session, returns opening line. |
| GET    | `/api/sessions/:id`        | Get current state, prompt, history.         |
| POST   | `/api/sessions/:id/turn`   | Body `{ "input": "..." }` advances flow.    |
| POST   | `/api/sessions/:id/reset`  | Reset back to the welcome step.             |
| DELETE | `/api/sessions/:id`        | Delete a session.                           |

Session response shape:

```json
{
  "id": "…",
  "state": {
    "step": "q1_could",
    "currentEmotion": "焦虑",
    "releaseCount": 0,
    "terminal": false
  },
  "prompt": {
    "step": "q1_could",
    "next": "q2_would",
    "say": { "zh": "…", "en": "…" },
    "inputHint": { "zh": "…", "en": "…" }
  },
  "history": [ … ]
}
```

Flow steps:

```
welcome → emotion → welcome_emotion → q1_could → q2_would → q3_when → check
                                          ↑                              │
                                          └─── (still there) ────────────┘
                                                                          │
                                                                          ▼
                                                                        done
```

### Flow script

`GET /api/flow/script?emotion=焦虑` returns every step's copy with the
emotion interpolated — handy for a frontend to preload.

### Text-to-speech (ElevenLabs)

`GET /api/tts/status` — `{ configured, defaultVoiceId, modelId }`

`POST /api/tts` — Body:

```json
{
  "text": "你能让这个感觉离开吗？",
  "voiceId": "optional voice id",
  "modelId": "optional, defaults to eleven_multilingual_v2",
  "stability": 0.45,
  "similarity": 0.75,
  "style": 0.2,
  "speakerBoost": true
}
```

Returns `audio/mpeg`. Pipe it to an `<audio>` element on the client.

`GET /api/voices` — proxies ElevenLabs' voice list.

## About a "Lester Levenson" voice

ElevenLabs voice cloning lets you create a custom voice from audio samples. If
you want the guide to sound like Lester (or any specific person), you must
upload samples you have permission to use, create the voice in your ElevenLabs
account, and put the resulting voice id in `ELEVENLABS_DEFAULT_VOICE_ID` (or
pass it per-request as `voiceId`). Cloning a real person's voice without
authorization may violate ElevenLabs' terms and applicable laws — this server
does not do any cloning itself.

If you don't set a voice id, a warm ElevenLabs preset is used.

## Notes

- Sessions are kept in memory and expire after `SESSION_TTL_MINUTES`. For
  production, swap `services/sessionStore.js` for Redis.
- Per-IP rate limits: 60 req/min on `/api`, 20 req/min on `/api/tts`.
- This server is independent of the Jekyll site in the repo root.
