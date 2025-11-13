"use client";

import { audioFileToPCM } from "@/app/helpers/audioFileToPCM";
import { pcmToWav } from "@/app/helpers/pcmToWav";
import {
  useGeminiLiveAudio,
  useGeminiLiveWebSocket,
} from "@/contexts/GeminiLiveWebSocketContext";
import { useEffect, useRef, useState } from "react";

const AudioFile = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  const [audioChunks, setAudioChunks] = useState<
    { audioData: Blob; timestamp: number }[]
  >([]);

  const { sendAudio, sendSpeechStart, sendSpeechEnd } =
    useGeminiLiveWebSocket();
  useGeminiLiveAudio((audio: { mimeType: string; data: string }) => {
    console.log(`🔊 Received audio: ${audio.mimeType}`);

    // base64 to blob
    const blob = pcmToWav(audio.data, 24000, 1);

    setAudioChunks((prev) => [
      ...prev,
      { audioData: blob, timestamp: Date.now() },
    ]);
  });

  const playAudio = async (audioData: Blob) => {
    console.log(
      "🔊 Playing audio at time:",
      nextStartTimeRef.current,
      audioData
    );
    const arrayBuffer = await audioData.arrayBuffer();

    const buffer = await audioContextRef.current?.decodeAudioData(arrayBuffer);

    const source = audioContextRef.current?.createBufferSource();

    if (!source || !buffer || !audioContextRef.current?.destination) return;

    source.buffer = buffer;
    source?.connect(audioContextRef.current?.destination);
    source?.start(nextStartTimeRef.current);

    nextStartTimeRef.current += buffer.duration;
  };

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

  useEffect(() => {
    if (audioChunks.length === 0) return;

    //get first chunk
    const firstChunk = audioChunks[0];
    playAudio(firstChunk.audioData);

    // remove first chunk
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAudioChunks((prev) => prev.slice(1));
  }, [audioChunks]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Create AudioContext with appropriate sample rate
      audioContextRef.current = new AudioContext({
        sampleRate: 24000, // Match Gemini's output
      });
      nextStartTimeRef.current = 0;
    }
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  return (
    <div>
      <input type="file" accept="audio/*" onChange={handleFileChange} />
    </div>
  );
};

export default AudioFile;
