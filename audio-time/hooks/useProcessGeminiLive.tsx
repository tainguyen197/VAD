"use client";

import { useCallback, useState } from "react";

interface GeminiTranscript {
  text: string;
  isFinal: boolean;
  timestamp: number;
}

interface GeminiAudioChunk {
  audioData: string; // base64 encoded
  timestamp: number;
}

const useProcessGeminiLive = () => {
  const [transcripts, setTranscripts] = useState<GeminiTranscript[]>([]);
  const [audioChunks, setAudioChunks] = useState<GeminiAudioChunk[]>([]);
  const [interimTranscript, setInterimTranscript] = useState<string>("");

  const processGeminiMessage = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (data: any) => {
      console.log("🌟 Processing Gemini message:", data);

      // Handle setup completion
      if (data.setupComplete) {
        console.log("✅ Setup complete");
        return;
      }

      // Handle server content (the AI's response)
      if (data.serverContent) {
        const parts = data.serverContent.modelTurn?.parts || [];

        parts.forEach((part: any) => {
          // Handle text response (Vietnamese translation)
          if (part.text) {
            const transcript: GeminiTranscript = {
              text: part.text,
              isFinal: data.serverContent.turnComplete || false,
              timestamp: Date.now(),
            };

            if (data.serverContent.turnComplete) {
              setTranscripts((prev) => [...prev, transcript]);
              setInterimTranscript("");
              console.log("🇻🇳 Vietnamese translation:", part.text);
            } else {
              setInterimTranscript(part.text);
            }
          }

          // Handle audio response (Vietnamese audio)
          if (
            part.inlineData &&
            part.inlineData.mimeType.includes("audio/pcm")
          ) {
            const audioChunk: GeminiAudioChunk = {
              audioData: part.inlineData.data,
              timestamp: Date.now(),
            };
            setAudioChunks((prev) => [...prev, audioChunk]);
            console.log("🔊 Received Vietnamese audio chunk");
          }
        });
      }

      // Handle tool calls if needed
      if (data.toolCall) {
        console.log("🔧 Tool call received:", data.toolCall);
      }

      // Handle errors
      if (data.error) {
        console.error("❌ Gemini error:", data.error);
      }
    },
    []
  );

  const clearTranscripts = useCallback(() => {
    setTranscripts([]);
    setInterimTranscript("");
  }, []);

  const clearAudioChunks = useCallback(() => {
    setAudioChunks([]);
  }, []);

  return {
    transcripts,
    audioChunks,
    interimTranscript,
    processGeminiMessage,
    clearTranscripts,
    clearAudioChunks,
  };
};

export { useProcessGeminiLive };
export type { GeminiTranscript, GeminiAudioChunk };
