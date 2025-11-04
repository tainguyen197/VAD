import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import Groq from "groq-sdk";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const record = require("node-record-lpcm16");

export interface Translation {
  english: string;
  vietnamese: string;
  timestamp: string;
}

// Simple VAD function
function isSpeech(audioBuffer: Buffer): boolean {
  const samples = new Int16Array(
    audioBuffer.buffer,
    audioBuffer.byteOffset,
    audioBuffer.length / 2
  );

  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    sum += samples[i] * samples[i];
  }

  const rms = Math.sqrt(sum / samples.length);
  const db = 20 * Math.log10(rms / 32768);
  return db > -40;
}

export async function startGameTranslator(
  onTranslation: (data: Translation) => void
): Promise<() => void> {
  // Get API keys from environment
  const deepgramKey = process.env.DEEPGRAM_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  if (!deepgramKey || !groqKey) {
    throw new Error("Missing API keys in environment variables");
  }

  const deepgram = createClient(deepgramKey);
  const groq = new Groq({ apiKey: groqKey });

  // Connect to Deepgram
  const connection = deepgram.listen.live({
    model: "nova-3",
    language: "en-US",
    smart_format: true,
  });

  // Handle transcription
  connection.on(LiveTranscriptionEvents.Transcript, async (data) => {
    const transcript = data.channel.alternatives[0].transcript;

    if (transcript && transcript.trim().length > 0) {
      console.log("English:", transcript);

      try {
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

        const translation = completion.choices[0].message.content?.trim() || "";

        onTranslation({
          english: transcript,
          vietnamese: translation,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Translation error:", error);
      }
    }
  });

  // Wait for connection
  await new Promise((resolve) => {
    connection.on(LiveTranscriptionEvents.Open, resolve);
  });

  // Start recording
  const recording = record.record({
    sampleRate: 16000,
    channels: 1,
    audioType: "wav",
  });

  recording.stream().on("data", (chunk: Buffer) => {
    if (isSpeech(chunk)) {
      // Send as ArrayBuffer for Deepgram
      connection.send(chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength));
    }
  });

  recording.start();
  console.log("✅ Translator started - listening for audio...");

  // Return cleanup function
  return () => {
    console.log("🛑 Stopping translator...");
    recording.stop();
    connection.finish();
  };
}