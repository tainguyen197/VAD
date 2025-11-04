# 🎮 Game Translator

Real-time game audio translator from English to Vietnamese using AI.

## Features

- 🎤 **Voice Activity Detection (VAD)** - Only processes speech, ignoring silence
- 🌐 **Real-time Streaming** - Instant translations via Server-Sent Events (SSE)
- 🤖 **AI-Powered** - Uses Deepgram for speech-to-text and Groq for translation
- 🎨 **Beautiful UI** - Clean, modern interface with dark mode
- 💾 **Translation History** - Keeps last 50 translations

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **AI Services**: 
  - Deepgram (Speech-to-Text)
  - Groq (LLaMA 3.1 for translation)
- **Audio**: node-record-lpcm16, SoX

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Install SoX (Audio Recording)

**macOS:**
```bash
brew install sox
```

**Linux:**
```bash
sudo apt-get install sox
```

**Windows:**
```bash
choco install sox
```

### 3. Environment Variables

Create `.env.local` file:

```bash
DEEPGRAM_API_KEY=your_deepgram_api_key
GROQ_API_KEY=your_groq_api_key
```

**Get API Keys:**
- Deepgram: https://console.deepgram.com
- Groq: https://console.groq.com

### 4. Run Development Server

```bash
pnpm dev
```

Visit: http://localhost:3000

## Usage

1. Click **"🎤 Start Translation"**
2. Allow microphone access when prompted
3. Play game audio or speak into your microphone
4. Watch real-time translations appear!
5. Click **"🛑 Stop Translation"** when done

## How It Works

```
Game Audio
    ↓
Microphone Input (node-record-lpcm16)
    ↓
Voice Activity Detection (VAD)
    ↓
Deepgram (Speech-to-Text) → English transcript
    ↓
Groq (LLaMA 3.1) → Vietnamese translation
    ↓
Server-Sent Events (SSE)
    ↓
Browser UI (Real-time display)
```

## Project Structure

```
game-translator/
├── app/
│   ├── api/
│   │   ├── translate/route.ts    # Translation logic & VAD
│   │   └── stream/route.ts       # SSE endpoint
│   ├── page.tsx                  # Main UI
│   └── layout.tsx                # Layout wrapper
├── types/
│   └── node-record-lpcm16.d.ts  # TypeScript declarations
├── .env.local                    # API keys (gitignored)
└── package.json
```

## Customization

### Adjust VAD Sensitivity

In `app/api/translate/route.ts`:

```typescript
// More sensitive (detects quieter speech)
return db > -45;

// Less sensitive (only loud speech)
return db > -35;
```

### Change Translation Model

In `app/api/translate/route.ts`:

```typescript
model: "llama-3.1-70b-versatile",  // Current (best quality)
// or
model: "llama-3.1-8b-instant",     // Faster, less accurate
```

### Game-Specific Translations

Add game context to the system prompt:

```typescript
content: `Translate dialogue from "Final Fantasy 7 Rebirth" to Vietnamese.
Preserve game style, character names, and special terms.
Only return the translation.`
```

## Troubleshooting

### No audio detected

- Check microphone permissions
- Verify SoX is installed: `sox --version`
- Adjust VAD threshold (see Customization above)

### API errors

- Check API keys in `.env.local`
- Verify API key validity on provider websites
- Check API rate limits

### TypeScript errors

```bash
pnpm run build
```

## License

MIT

## Credits

- Deepgram for speech recognition
- Groq for ultra-fast AI inference
- Next.js team for the amazing framework
