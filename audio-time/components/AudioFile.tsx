"use client";

import { audioFileToPCM } from "@/app/helpers/audioFileToPCM";
import { pcmToWav } from "@/app/helpers/pcmToWav";
import {
  useGeminiLiveAudio,
  useGeminiLiveWebSocket,
} from "@/contexts/GeminiLiveWebSocketContext";
import useAudio from "@/hooks/useAudio";

const AudioFile = () => {
  const { addAudioChunk } = useAudio({
    autoPlay: true,
    sampleRate: 24000,
  });

  const { sendAudio, sendSpeechStart, sendSpeechEnd } =
    useGeminiLiveWebSocket();
  useGeminiLiveAudio((audio: { mimeType: string; data: string }) => {
    console.log(`🔊 Received audio: ${audio.mimeType}`);

    // base64 to blob
    const blob = pcmToWav(audio.data, 24000, 1);

    addAudioChunk(blob);
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      const pcm = await audioFileToPCM(file);

      streamAudio(pcm, 3200, 100);
    }
  };

  const streamAudio = async (
    pcm: ArrayBuffer,
    chunkSize: number,
    delayMs: number
  ) => {
    const int16Array = new Int16Array(pcm);
    const totalSamples = int16Array.length;

    sendSpeechStart();

    for (let i = 0; i < totalSamples / 4; i += chunkSize) {
      console.log(`🔊 Sending audio chunk ${i}`);
      const chunkEnd = Math.min(i + chunkSize, totalSamples);
      const chunk = int16Array.slice(i, chunkEnd);

      const chunkBuffer = chunk.buffer.slice(
        chunk.byteOffset,
        chunk.byteOffset + chunk.byteLength
      );

      sendAudio(chunkBuffer);

      if (i + chunkSize < totalSamples) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    sendSpeechEnd();
  };

  return (
    <div>
      <input type="file" accept="audio/*" onChange={handleFileChange} />
    </div>
  );
};

export default AudioFile;
