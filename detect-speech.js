const { createClient, LiveTranscriptionEvents } = require("@deepgram/sdk");
const dotenv = require("dotenv");
const record = require("node-record-lpcm16");
dotenv.config();

const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

const connection = deepgram.listen.live({
  model: "nova-3",
  language: "en-US",
  smart_format: true,
});

connection.on(LiveTranscriptionEvents.Open, () => {
  console.log("Connected to Deepgram");
  connection.on(LiveTranscriptionEvents.Close, () => {
    console.log("Disconnected from Deepgram");
  });
  connection.on(LiveTranscriptionEvents.Transcript, (transcript) => {
    console.log("Transcript: ");
    console.log(transcript);
  });
  connection.on(LiveTranscriptionEvents.Metadata, (metadata) => {
    console.log(metadata);
  });
  connection.on(LiveTranscriptionEvents.Error, (error) => {
    console.error(error);
  });
});

const recording = record.record({
  sampleRate: 16000,
  channel: 1,
  audioType: "wav",
});

recording.stream().on("data", (chunk) => {
  console.log("Sending chunk to Deepgram");
  connection.send(chunk);
});

recording.start();

console.log("Listening to Deepgram...");
