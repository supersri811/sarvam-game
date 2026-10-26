# वर्णमाला – learn Hindi letters by voice

A gamified Hindi-learning web app built for a Sarvam AI hackathon: a pixel-art world (bazaar, forest, desert, lair) with Hindi-speaking NPCs and a boss fight, plus a Classic mode with an Alphabet trainer and Duolingo-style practice. Answers are typed or picked; NPC lines and your replies can be played aloud with Sarvam text-to-speech.

- **Text-to-speech:** Sarvam Bulbul v3 (`/api/tts`)
- **Speech-to-text:** Sarvam Saaras v4 (`/api/stt`)
- **Game layer:** XP, levels, day streak and progress, saved in the browser

Planned: mixed exercises, then a live-generated story mode with Sarvam-105B.

## Run locally

```
pip install -r requirements.txt
```

Create a `.env` file (never commit it) with your key:

```
SARVAM_API_KEY=your_key_here
```

```
python -m uvicorn app:app --port 8000
```

Open http://localhost:8000. The microphone needs `localhost` or HTTPS.

## Deploy (Render)

New Web Service from this repo:
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app:app --host 0.0.0.0 --port $PORT`
- Environment variable: `SARVAM_API_KEY` (set in Render's dashboard, not in the repo)

Test the live link on a second device before sharing.
