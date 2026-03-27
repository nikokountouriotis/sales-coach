# Sales Coach â NEPQ Call Review Platform

A web app that scores sales call transcripts against your NEPQ rubric using AI, stores every review in a database, and shows you what to improve over time.

## Quick Start (Run Locally)

### 1. Install Node.js
If you don't have Node.js, download it from https://nodejs.org (version 18+).

### 2. Get an Anthropic API Key
Go to https://console.anthropic.com â API Keys â Create Key.

### 3. Set up the app

```bash
cd sales-coach-app

# Install dependencies
npm install

# Create your .env file
cp .env.example .env
```

Then open `.env` and paste your API key:
```
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
PORT=3000
```

### 4. Run it

```bash
npm start
```

Open http://localhost:3000 in your browser. That's it!

## How It Works

1. **Submit Call** â Paste a transcript, enter rep name + prospect name + date
2. **AI Scores It** â Claude analyzes the call against the full NEPQ rubric (9 stages, 7 techniques, upstream diagnosis)
3. **Review** â Get a detailed breakdown with hits, misses, word tracks, rewrites, and an action plan
4. **Dashboard** â See score trends, weakest areas, and stage/technique averages across all calls

## Sharing with Friends

Since this runs on your computer, your friends need to be on the same network. Two easy ways to share:

### Option A: Share on your local network
When you start the server, your friends on the same WiFi can access it at `http://YOUR_IP:3000`. Find your IP with:
- Mac: `ipconfig getifaddr en0`
- Windows: `ipconfig` â look for IPv4 Address

### Option B: Deploy to the internet (Render.com â free tier)
1. Push this folder to a GitHub repo
2. Go to https://render.com â New Web Service â connect your repo
3. Set the build command to `npm install`
4. Set the start command to `npm start`
5. Add your `ANTHROPIC_API_KEY` as an environment variable
6. Deploy â you'll get a public URL anyone can use

> Note: The free tier on Render uses an ephemeral filesystem, so the SQLite database resets on redeploy. For persistent storage, upgrade to a paid plan or switch to a hosted database.

## Cost

Each call review uses ~2,000-4,000 input tokens and ~4,000-8,000 output tokens from the Anthropic API. At current Claude Sonnet pricing, that's roughly $0.02-0.05 per review.
