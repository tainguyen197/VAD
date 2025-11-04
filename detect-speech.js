const { createClient, LiveTranscriptionEvents } = require("@deepgram/sdk");
const dotenv = require("dotenv");
const Groq = require("groq-sdk");

const record = require("node-record-lpcm16");
const { NonRealTimeVAD } = require("@ricky0123/vad-node");
dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

// Simple energy-based Voice Activity Detection
function isSpeech(audioBuffer) {
  const samples = new Int16Array(
    audioBuffer.buffer,
    audioBuffer.byteOffset,
    audioBuffer.length / 2
  );

  // Calculate RMS (Root Mean Square) energy
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    sum += samples[i] * samples[i];
  }

  const rms = Math.sqrt(sum / samples.length);
  const db = 20 * Math.log10(rms / 32768);

  // Threshold: -40dB is typical for speech
  // Adjust this value based on your environment
  const SPEECH_THRESHOLD = -40;

  return db > SPEECH_THRESHOLD;
}

const connection = deepgram.listen.live({
  model: "nova-3",
  language: "en-US",
  smart_format: true,
});

connection.on(LiveTranscriptionEvents.Open, async () => {
  console.log("Connected to Deepgram");

  const recording = record.record({
    sampleRate: 16000,
    channel: 1,
    audioType: "wav",
  });

  recording.start();

  recording.stream().on("data", (chunk) => {
    console.log("Sending chunk to Deepgram");
    connection.send(chunk);
  });
  connection.on(LiveTranscriptionEvents.Close, () => {
    console.log("Disconnected from Deepgram");
  });

  let lastLogTime = 0;

  recording.stream().on("data", async (audioChunk) => {
    if (isSpeech(audioChunk)) {
      const now = Date.now();
      if (now - lastLogTime > 1000) {
        console.log("🎤 Speech detected! Sending to Deepgram...");
        lastLogTime = now;
      }
      connection.send(audioChunk);
    }
  });

  recording.stream().on("error", (error) => {
    console.error("❌ Recording error:", error);
  });

  recording.start();
  console.log("🎙️ Recording started...");

  // Start recording AFTER connection is open
  // const recording = record.record({
  //   sampleRate: 16000,
  //   channel: 1,
  //   audioType: "wav",
  // });

  // recording.stream().on("data", (chunk) => {
  //   connection.send(chunk);
  // });

  // recording.stream().on("error", (error) => {
  //   console.error("Recording error:", error);
  // });

  // recording.start();
  // console.log("Recording started...");
});

console.log("Listening to Deepgram...");
