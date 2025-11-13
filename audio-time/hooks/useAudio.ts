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

  const [audioChunks, setAudioChunks] = useState<
    { audioData: Blob; timestamp: number }[]
  >([]);

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

  useEffect(() => {
    if (audioChunks.length === 0 || !autoPlay) return;

    //get first chunk
    const firstChunk = audioChunks[0];
    playAudio(firstChunk.audioData);

    // remove first chunk
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAudioChunks((prev) => prev.slice(1));
  }, [audioChunks, autoPlay]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      audioContextRef.current = new AudioContext({
        sampleRate,
      });
      nextStartTimeRef.current = 0;
    }

    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  return {
    addAudioChunk: (audioData: Blob) => {
      setAudioChunks((prev) => [...prev, { audioData, timestamp: Date.now() }]);
    },
  };
};

export default useAudio;
