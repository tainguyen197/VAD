import { useEffect, useRef, useState } from "react";

const useAudio = ({
  autoPlay = true,
  sampleRate = 24000,
}: {
  autoPlay?: boolean;
  sampleRate?: number;
}) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioQueueRef = useRef<Blob[]>([]);
  const isProcessingRef = useRef<boolean>(false);

  const playAudio = async (audioData: Blob) => {
    const arrayBuffer = await audioData.arrayBuffer();
    const buffer = await audioContextRef.current?.decodeAudioData(arrayBuffer);
    const source = audioContextRef.current?.createBufferSource();

    if (!source || !buffer || !audioContextRef.current?.destination) return;

    source.buffer = buffer;
    source?.connect(audioContextRef.current?.destination);

    const startTime = Math.max(
      nextStartTimeRef.current,
      audioContextRef.current.currentTime
    );
    source.start(startTime);

    nextStartTimeRef.current = startTime + buffer.duration;
  };

  const processQueue = async () => {
    if (isProcessingRef.current || !autoPlay) return;

    isProcessingRef.current = true;

    while (audioQueueRef.current.length > 0) {
      const chunk = audioQueueRef.current.shift();
      if (chunk) {
        await playAudio(chunk);
      }
    }

    isProcessingRef.current = false;
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioContextRef.current = new AudioContext({ sampleRate });
      nextStartTimeRef.current = audioContextRef.current.currentTime;
    }

    return () => {
      audioContextRef.current?.close();
    };
  }, [sampleRate]);

  return {
    addAudioChunk: (audioData: Blob) => {
      audioQueueRef.current.push(audioData);
      processQueue();
    },
  };
};

export default useAudio;
