# ⚡ Quick Start Guide

Get up and running in 5 minutes!

## 1. Install SoX

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

## 2. Install Dependencies

```bash
pnpm install
```

## 3. Add API Keys

Create `.env.local`:

```bash
DEEPGRAM_API_KEY=your_deepgram_key
GROQ_API_KEY=your_groq_key
```

Get keys:
- Deepgram: https://console.deepgram.com
- Groq: https://console.groq.com

## 4. Run

```bash
pnpm dev
```

Open: http://localhost:3000

## 5. Use

1. Click "🎤 Start Translation"
2. Allow microphone access
3. Speak or play game audio
4. See real-time translations!

## That's it! 🎉

For detailed setup, see [SETUP.md](./SETUP.md)

---

## Troubleshooting

**No audio?**
- Check mic permissions
- Verify SoX: `sox --version`

**API errors?**
- Check `.env.local` file exists
- Verify API keys are correct

**Build errors?**
```bash
rm -rf .next node_modules
pnpm install
pnpm dev
```

