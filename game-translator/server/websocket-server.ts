import { WebSocketServer, WebSocket } from "ws";
import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import Groq from "groq-sdk";
import dotenv from "dotenv";
const PORT = 8080;

dotenv.config();

const wss = new WebSocketServer({ port: PORT });

console.log(`🚀 WebSocket server running on ws://localhost:${PORT}`);

wss.on("connection", (ws: WebSocket) => {
  console.log("✅ Client connected");

  const deepgramKey = process.env.DEEPGRAM_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  if (!deepgramKey || !groqKey) {
    ws.send(JSON.stringify({ error: "Missing API keys" }));
    ws.close();
    return;
  }

  const deepgram = createClient(deepgramKey);
  const groq = new Groq({ apiKey: groqKey });

  // Create live transcription connection
  const connection = deepgram.listen.live({
    model: "nova-3",
    language: "en-US",
    smart_format: true,
    interim_results: false, // Only send final results
  });

  // Handle Deepgram transcription
  connection.on(LiveTranscriptionEvents.Transcript, async (data) => {
    const transcript = data.channel?.alternatives[0]?.transcript;

    if (transcript && transcript.trim().length > 0) {
      console.log(`🎤 English: ${transcript}`);

      try {
        // Translate with Groq
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
        console.log(`🇻🇳 Vietnamese: ${translation}`);

        // Send translation back to client
        ws.send(
          JSON.stringify({
            english: transcript,
            vietnamese: translation,
            timestamp: new Date().toISOString(),
          })
        );
      } catch (error) {
        console.error("Translation error:", error);
      }
    }
  });

  connection.on(LiveTranscriptionEvents.Open, () => {
    console.log("🔗 Deepgram connection opened");
    ws.send(JSON.stringify({ status: "connected" }));
  });

  connection.on(LiveTranscriptionEvents.Error, (error) => {
    console.error("Deepgram error:", error);
  });

  // Handle incoming audio from client
  ws.on("message", (data: Buffer) => {
    // Forward audio chunks to Deepgram
    connection.send(data as unknown as ArrayBuffer | SharedArrayBuffer | Blob);
  });

  ws.on("close", () => {
    console.log("🔌 Client disconnected");
    connection.finish();
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
    connection.finish();
  });
});