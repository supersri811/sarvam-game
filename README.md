# वर्णमाला – learn Hindi in a pixel world

A gamified Hindi-learning web app built for a Sarvam AI hackathon: a pixel-art world (bazaar, forest, desert, lair) with Hindi-speaking NPCs and a boss fight, plus a Classic mode with an Alphabet trainer and Duolingo-style practice. Answers are typed or picked; NPC lines and your replies can be played aloud with Sarvam text-to-speech.

- **World mode:** walk the Bazaar, Autumn Forest, Desert and the Rakshasa's Lair (arrows/WASD or d-pad, Space/A to talk). Collect 3 word-gems from Hindi conversations, then win the boss battle by answering Hindi questions. 4 hidden, overpowered perks (look for sparkles).
- **Classic mode** (📚 button): Alphabet trainer and Duolingo-style practice lessons (hearts, combos, XP).
- **Sarvam AI:** Bulbul v3 text-to-speech plays NPC lines and your replies (🔊). A Saaras speech-to-text endpoint (`/api/stt`) exists but is not used by the UI right now.
- Light/dark mode, progress saved in the browser. Sprites: [Kenney](https://kenney.nl) Tiny Town + Tiny Dungeon (CC0).

Planned: live-generated conversations with Sarvam-105B, voice answers.

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
