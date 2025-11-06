# Gemini Live API Setup Guide

This guide explains how to set up and use the Gemini Live API for real-time English to Vietnamese translation in this project.

## Overview

The Gemini Live API implementation provides:

- **Real-time audio input**: Speak in English
- **Instant translation**: Get Vietnamese text translations
- **Audio output**: Hear Vietnamese audio responses
- **Low latency**: Sub-second response times

## Architecture

The implementation follows the same pattern as the Deepgram flow:

```
User speaks (English)
  → VAD detects speech
  → Audio chunks sent to Gemini Live WebSocket
  → Gemini processes and translates
  → Returns Vietnamese text + audio
  → Display text + play audio
```

## Setup Instructions

### 1. Get Your Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### 2. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_GENAI_API_KEY=your_api_key_here
```

Or add to your existing `.env.local` file.

### 3. Install Dependencies

Dependencies are already included in `package.json`:

- `@google/genai` - Google's Generative AI SDK
- `@ricky0123/vad-react` - Voice Activity Detection
- `next` - Next.js framework

If needed, run:

```bash
pnpm install
```

### 4. Run the Application

```bash
pnpm dev
```

Visit:

- **Gemini Live**: `http://localhost:3000/gemini`
- **Deepgram (original)**: `http://localhost:3000`

## How It Works

### File Structure

```
contexts/
  └── GeminiLiveWebSocketContext.tsx   # WebSocket connection management
hooks/
  ├── useGeminiApiKey.tsx              # API key management
  └── useProcessGeminiLive.tsx         # Message processing logic
app/
  ├── gemini-providers.tsx             # Provider wrapper
  ├── gemini-page.tsx                  # Main UI component
  └── gemini/
      ├── layout.tsx                   # Layout with provider
      └── page.tsx                     # Route entry point
```

### WebSocket Connection

The `GeminiLiveWebSocketContext` manages:

1. **Connection**: Opens WebSocket to Gemini Live API
2. **Setup**: Configures model, audio settings, and system instructions
3. **Audio Streaming**: Sends 16-bit PCM audio chunks
4. **Message Handling**: Processes responses (text + audio)

### Key Configuration

```typescript
// System instruction for translation
system_instruction: {
  parts: [
    {
      text: "You are a real-time translator. Listen to English audio and respond ONLY with the Vietnamese translation.",
    },
  ];
}

// Response modalities
response_modalities: ["AUDIO", "TEXT"];

// Voice configuration
voice_config: {
  prebuilt_voice_config: {
    voice_name: "Puck"; // Change to other voices as needed
  }
}
```

## Available Voices

Gemini Live API supports multiple voices:

- **Puck** - Default voice
- **Charon** - Alternative voice
- **Kore** - Alternative voice
- **Fenrir** - Alternative voice
- **Aoede** - Alternative voice

Change the voice in `contexts/GeminiLiveWebSocketContext.tsx`:

```typescript
voice_name: "Aoede"; // Change here
```

## Message Flow

### 1. Setup Message (sent on connection)

```json
{
  "setup": {
    "model": "models/gemini-2.0-flash-exp",
    "generation_config": { ... },
    "system_instruction": { ... }
  }
}
```

### 2. Audio Input Message (sent continuously)

```json
{
  "realtime_input": {
    "media_chunks": [
      {
        "mime_type": "audio/pcm",
        "data": "base64_encoded_audio"
      }
    ]
  }
}
```

### 3. Server Response (received)

```json
{
  "serverContent": {
    "modelTurn": {
      "parts": [
        { "text": "Vietnamese translation" },
        {
          "inlineData": {
            "mimeType": "audio/pcm",
            "data": "base64_encoded_audio"
          }
        }
      ]
    },
    "turnComplete": true
  }
}
```

## Audio Processing

### Input Audio

- **Format**: 16-bit PCM
- **Sample Rate**: 16000 Hz (matches VAD output)
- **Channels**: Mono
- **Encoding**: Base64

### Output Audio

- **Format**: 16-bit PCM
- **Sample Rate**: 24000 Hz (Gemini's default)
- **Channels**: Mono
- **Playback**: Web Audio API

## Customization

### Change Translation Direction

Edit the system instruction in `contexts/GeminiLiveWebSocketContext.tsx`:

```typescript
system_instruction: {
  parts: [
    {
      text: "You are a real-time translator. Listen to Vietnamese audio and respond ONLY with the English translation.",
    },
  ];
}
```

### Add Additional Processing

Modify `hooks/useProcessGeminiLive.tsx` to add:

- Text post-processing
- Audio effects
- Custom formatting
- Additional analytics

### Adjust VAD Sensitivity

In `app/gemini-page.tsx`:

```typescript
onFrameProcessed: (probabilities, frame) => {
  if (probabilities.isSpeech < 0.8) return; // Change threshold
  sendAudio(floatTo16BitPCM(frame));
};
```

## Comparison: Deepgram vs Gemini Live

| Feature          | Deepgram Flow        | Gemini Live Flow |
| ---------------- | -------------------- | ---------------- |
| **STT**          | Deepgram API         | Gemini Live API  |
| **Translation**  | Gemini AI (separate) | Gemini Live API  |
| **TTS**          | None                 | Gemini Live API  |
| **Latency**      | 2 API calls          | 1 API call       |
| **Audio Output** | No                   | Yes              |
| **Setup**        | 2 services           | 1 service        |

## Benefits of Gemini Live

1. **Unified Service**: STT + Translation + TTS in one API
2. **Lower Latency**: Single round-trip instead of two
3. **Audio Output**: Get spoken Vietnamese translation
4. **Simpler Setup**: One API key instead of two
5. **Cost Effective**: Fewer API calls

## Troubleshooting

### Connection Issues

If WebSocket fails to connect:

1. Check API key is set correctly
2. Verify API key has Gemini API access
3. Check browser console for errors

### No Audio Output

If Vietnamese audio doesn't play:

1. Check browser audio permissions
2. Verify AudioContext is initialized
3. Check browser console for audio errors

### Translation Quality

To improve translations:

1. Speak clearly and slowly
2. Adjust VAD sensitivity
3. Modify system instructions
4. Use a different Gemini model

## API Limits

- **Free Tier**: 60 requests per minute
- **Rate Limits**: Subject to Google's quotas
- **Concurrent Connections**: 1 per API key

Check [Google AI Studio](https://aistudio.google.com/) for your specific limits.

## Resources

- [Gemini Live API Documentation](https://ai.google.dev/gemini-api/docs/live)
- [Gemini Live API Guide](https://ai.google.dev/gemini-api/docs/live-guide)
- [WebSocket API Reference](https://ai.google.dev/api/live)
- [Google AI Studio](https://aistudio.google.com/)

## Support

For issues or questions:

1. Check the browser console for errors
2. Review the documentation above
3. Check Google AI Studio for API status
4. Verify environment variables are set

## Next Steps

- Add more languages
- Implement conversation history
- Add audio visualization
- Create custom voices
- Add error recovery
- Implement audio buffering
