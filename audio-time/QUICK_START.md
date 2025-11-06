# Quick Start: Gemini Live Translation

## 🚀 Get Started in 3 Steps

### 1. Get API Key

Visit [Google AI Studio](https://aistudio.google.com/app/apikey) and create an API key.

### 2. Set Environment Variable

Create `.env.local` in project root:

```env
NEXT_PUBLIC_GENAI_API_KEY=your_api_key_here
```

### 3. Run & Test

```bash
pnpm dev
```

Visit: **http://localhost:3000/gemini**

## 🎤 How to Use

1. Click **"Start Speaking (English)"**
2. Speak in English
3. See Vietnamese translation appear in real-time
4. Hear Vietnamese audio response

## 📁 Project Structure

```
contexts/
  └── GeminiLiveWebSocketContext.tsx   ← WebSocket connection
hooks/
  ├── useGeminiApiKey.tsx              ← API key hook
  └── useProcessGeminiLive.tsx         ← Message processor
app/
  └── gemini/
      └── page.tsx                     ← Main page (/gemini route)
```

## 🔄 Flow Comparison

### Old Flow (Deepgram)

```
Audio → Deepgram (STT) → Text → Gemini (Translate) → Vietnamese Text
```

### New Flow (Gemini Live)

```
Audio → Gemini Live → Vietnamese Text + Audio
```

## ⚙️ Key Features

- ✅ Real-time English to Vietnamese translation
- ✅ Audio input (English speech)
- ✅ Text output (Vietnamese translation)
- ✅ Audio output (Vietnamese speech)
- ✅ Low latency (~600ms first response)
- ✅ Voice Activity Detection (VAD)

## 🛠️ Customization

### Change Translation Direction

Edit `contexts/GeminiLiveWebSocketContext.tsx`:

```typescript
text: "Listen to Vietnamese and respond with English translation";
```

### Change Voice

Edit `contexts/GeminiLiveWebSocketContext.tsx`:

```typescript
voice_name: "Aoede"; // Options: Puck, Charon, Kore, Fenrir, Aoede
```

### Adjust Speech Detection

Edit `app/gemini-page.tsx`:

```typescript
if (probabilities.isSpeech < 0.8) return; // Change threshold (0.0 to 1.0)
```

## 📚 Documentation

- **Full Setup**: See `GEMINI_LIVE_SETUP.md`
- **Environment**: See `ENV_SETUP.md`
- **Gemini Docs**: https://ai.google.dev/gemini-api/docs/live

## 🐛 Troubleshooting

**No Connection?**

- Check API key in `.env.local`
- Verify `NEXT_PUBLIC_GENAI_API_KEY` is set

**No Audio?**

- Allow microphone permissions
- Check browser console for errors

**Poor Translation?**

- Speak clearly and at moderate pace
- Reduce background noise
- Check internet connection

## 🎯 Next Steps

- Try different voices
- Add more languages
- Implement conversation history
- Add audio visualization

## 📞 Routes

- `/` - Original Deepgram flow
- `/gemini` - New Gemini Live flow

Both flows are independent and can run side-by-side!
