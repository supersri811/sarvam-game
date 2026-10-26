# वर्णमाला – learn Hindi letters by voice

A small gamified web app, built for a Sarvam AI hackathon. The learner sees a Hindi letter with a romanised hint, hears it spoken, then says an example word into the mic and gets scored.

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
