# 🚀 Complete Setup Guide

## Full Flow Overview

```
┌─────────────────────────────────────────────┐
│          Browser (Client)                   │
│  ┌──────────────────────────────────────┐   │
│  │  1. Click "Start Translation"        │   │
│  │  2. Opens SSE connection             │   │
│  │  3. Receives real-time translations  │   │
│  │  4. Displays in UI                   │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
                      ↕ SSE (Server-Sent Events)
┌─────────────────────────────────────────────┐
│      Next.js API Route (/api/stream)        │
│  ┌──────────────────────────────────────┐   │
│  │  1. Create ReadableStream            │   │
│  │  2. Start GameTranslator             │   │
│  │  3. Stream translations to client    │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────┐
│      Translation Logic (translate/route)    │
│  ┌──────────────────────────────────────┐   │
│  │  1. Start microphone recording       │   │
│  │  2. Apply VAD (filter silence)       │   │
│  │  3. Send speech → Deepgram STT       │   │
│  │  4. Get transcript → Groq translate  │   │
│  │  5. Call onTranslation callback      │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

## Prerequisites

1. **Node.js 18+** installed
2. **pnpm** package manager (or npm/yarn)
3. **SoX** audio library
4. **API Keys** from Deepgram and Groq

## Step 1: Install SoX

SoX is required for audio recording.

### macOS
```bash
brew install sox
```

### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install sox
```

### Windows
```bash
choco install sox
```

Verify installation:
```bash
sox --version
```

## Step 2: Get API Keys

### Deepgram API Key
1. Go to https://console.deepgram.com
2. Sign up for free account
3. Get API key from dashboard
4. Free tier includes $200 credit

### Groq API Key
1. Go to https://console.groq.com
2. Sign up for free account
3. Get API key from dashboard
4. Free tier: 30 requests/minute

## Step 3: Install Dependencies

```bash
cd game-translator
pnpm install
```

This installs:
- Next.js 14
- Deepgram SDK
- Groq SDK
- node-record-lpcm16
- TypeScript
- Tailwind CSS

## Step 4: Configure Environment

Create `.env.local` file in the project root:

```bash
DEEPGRAM_API_KEY=your_actual_deepgram_key_here
GROQ_API_KEY=your_actual_groq_key_here
```

**Important:** 
- Don't commit `.env.local` to git
- Use your actual API keys (remove "your_actual_")
- No quotes needed around values

## Step 5: Run Development Server

```bash
pnpm dev
```

The app will start at: http://localhost:3000

## Step 6: Test the Application

1. Open http://localhost:3000 in browser
2. Click "🎤 Start Translation" button
3. Allow microphone access when prompted
4. Speak into microphone or play game audio
5. Watch translations appear in real-time!

## Project Structure Explained

```
game-translator/
├── app/
│   ├── api/
│   │   ├── translate/
│   │   │   └── route.ts          # Core translation logic
│   │   │       - startGameTranslator() function
│   │   │       - VAD (Voice Activity Detection)
│   │   │       - Deepgram & Groq integration
│   │   │
│   │   └── stream/
│   │       └── route.ts          # SSE endpoint
│   │           - Creates ReadableStream
│   │           - Manages client connections
│   │
│   ├── page.tsx                  # Main UI component
│   │   - Start/Stop buttons
│   │   - Translation display
│   │   - EventSource for SSE
│   │
│   └── layout.tsx                # Root layout
│
├── types/
│   └── node-record-lpcm16.d.ts  # TypeScript declarations
│
├── .env.local                    # API keys (create this)
└── package.json                  # Dependencies
```

## How It Works

### 1. User Clicks "Start Translation"

```typescript
// page.tsx
const startTranslator = () => {
  eventSourceRef.current = new EventSource("/api/stream");
  
  eventSourceRef.current.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.english && data.vietnamese) {
      setTranslations(prev => [data, ...prev]);
    }
  };
};
```

### 2. Server Creates SSE Stream

```typescript
// api/stream/route.ts
export async function GET() {
  const stream = new ReadableStream({
    async start(controller) {
      // Send connection confirmation
      controller.enqueue(encoder.encode(`data: {"status":"connected"}\n\n`));
      
      // Start translator
      stopTranslator = await startGameTranslator((translation) => {
        // Stream each translation to client
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(translation)}\n\n`));
      });
    }
  });
  
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

### 3. Audio Recording & VAD

```typescript
// api/translate/route.ts
const recording = record.record({
  sampleRate: 16000,
  channels: 1,
  audioType: "wav",
});

recording.stream().on("data", (chunk: Buffer) => {
  // Only send if speech detected (VAD)
  if (isSpeech(chunk)) {
    connection.send(chunk.buffer.slice(...));
  }
});
```

### 4. Speech-to-Text (Deepgram)

```typescript
const connection = deepgram.listen.live({
  model: "nova-3",
  language: "en-US",
  smart_format: true,
});

connection.on(LiveTranscriptionEvents.Transcript, async (data) => {
  const transcript = data.channel.alternatives[0].transcript;
  // Process transcript...
});
```

### 5. Translation (Groq)

```typescript
const completion = await groq.chat.completions.create({
  messages: [
    {
      role: "system",
      content: "Translate English to Vietnamese. Only return the translation.",
    },
    {
      role: "user",
      content: transcript,
    },
  ],
  model: "llama-3.1-70b-versatile",
  temperature: 0.5,
});
```

### 6. Stream to Client

```typescript
onTranslation({
  english: transcript,
  vietnamese: translation,
  timestamp: new Date().toISOString(),
});
```

## Customization

### Adjust VAD Sensitivity

In `app/api/translate/route.ts`, line ~30:

```typescript
function isSpeech(audioBuffer: Buffer): boolean {
  // ... calculation ...
  
  // Default: -40 dB
  return db > -40;
  
  // More sensitive (picks up quieter sounds):
  return db > -45;
  
  // Less sensitive (only loud sounds):
  return db > -35;
}
```

### Change Translation Model

In `app/api/translate/route.ts`, line ~65:

```typescript
model: "llama-3.1-70b-versatile",  // Best quality
// OR
model: "llama-3.1-8b-instant",     // Faster
```

### Game-Specific Translations

In `app/api/translate/route.ts`, line ~58:

```typescript
content: `You are translating dialogue from "Final Fantasy 7 Rebirth".
Translate to Vietnamese while:
- Preserving character names (Cloud, Tifa, Aerith)
- Keeping special terms (Materia, SOLDIER, Shinra)
- Maintaining dramatic JRPG style

Only return the Vietnamese translation.`
```

## Troubleshooting

### Error: "Cannot find module 'node-record-lpcm16'"

```bash
pnpm install node-record-lpcm16
```

### Error: "spawn sox ENOENT"

SoX is not installed. See Step 1.

### No audio detected

1. Check microphone permissions in System Preferences
2. Test microphone: `rec -d` (SoX command)
3. Adjust VAD threshold (see Customization)

### API errors

1. Verify API keys in `.env.local`
2. Check keys are valid on provider sites
3. Check rate limits (Groq: 30 req/min free tier)

### TypeScript errors

```bash
pnpm run build
```

Fix any errors shown, then restart dev server.

## Production Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project on Vercel
3. Add environment variables in Vercel dashboard:
   - `DEEPGRAM_API_KEY`
   - `GROQ_API_KEY`
4. Deploy

**Note:** Audio recording (node-record-lpcm16) requires a server environment. 
This won't work on serverless platforms without modifications.

### Docker

```dockerfile
FROM node:18
RUN apt-get update && apt-get install -y sox
WORKDIR /app
COPY . .
RUN pnpm install
RUN pnpm build
CMD ["pnpm", "start"]
```

## Performance Tips

1. **VAD reduces costs** - Only sends speech, not silence
2. **Use faster model for real-time** - `llama-3.1-8b-instant`
3. **Limit translation history** - Currently keeps 50 translations
4. **Close connection when done** - Click "Stop Translation"

## Next Steps

- [ ] Add text-to-speech for Vietnamese output
- [ ] Support multiple languages
- [ ] Add game selection UI
- [ ] Record translation sessions
- [ ] Export translations to file

## Support

- Deepgram Docs: https://developers.deepgram.com
- Groq Docs: https://console.groq.com/docs
- Next.js Docs: https://nextjs.org/docs

## License

MIT

