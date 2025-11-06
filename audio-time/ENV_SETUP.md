# Environment Variables Setup

## Required Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

### For Deepgram (Original Flow)

```env
DEEPGRAM_API_KEY=your_deepgram_api_key_here
```

Get your Deepgram API key from: https://console.deepgram.com/

### For Gemini Live API (New Flow)

```env
NEXT_PUBLIC_GENAI_API_KEY=your_gemini_api_key_here
```

Get your Gemini API key from: https://aistudio.google.com/app/apikey

### For Gemini Translation (Used in both flows)

```env
NEXT_PUBLIC_GENAI_API_KEY=your_gemini_api_key_here
```

**Note**: `NEXT_PUBLIC_GENAI_API_KEY` and `NEXT_PUBLIC_GENAI_API_KEY` can be the same key.

## Example .env.local File

```env
# Deepgram for speech-to-text
DEEPGRAM_API_KEY=abc123...

# Gemini for translation and Live API
NEXT_PUBLIC_GENAI_API_KEY=xyz789...
NEXT_PUBLIC_GENAI_API_KEY=xyz789...
```

## Security Note

- Never commit `.env.local` to version control
- `.env.local` is already in `.gitignore`
- Use `NEXT_PUBLIC_` prefix only for client-side environment variables
- Server-only variables should NOT have the `NEXT_PUBLIC_` prefix
