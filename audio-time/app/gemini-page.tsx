"use client";

import {
  useGeminiLiveAudio,
  useGeminiLiveWebSocket,
} from "@/contexts/GeminiLiveWebSocketContext";
import { floatTo16BitPCM, pcmToWav } from "@/app/helpers";
import { useMicVAD } from "@ricky0123/vad-react";
import useAudio from "@/hooks/useAudio";
import Waveform from "@/components/Waveform";
import { useEffect, useRef, useState } from "react";

const baseAssetPath =
  "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.27/dist/";
const onnxWASMBasePath =
  "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/";

export default function GeminiLivePage() {
  const { sendAudio, isConnected, error, sendSpeechStart, sendSpeechEnd } =
    useGeminiLiveWebSocket();

  const { addAudioChunk } = useAudio({
    autoPlay: true,
    sampleRate: 24000,
  });

  const [isReceiving, setIsReceiving] = useState(false);
  const responseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useGeminiLiveAudio((audio) => {
    const blob = pcmToWav(audio.data, 24000, 1);
    addAudioChunk(blob);

    setIsReceiving(true);
    if (responseTimeoutRef.current) {
      clearTimeout(responseTimeoutRef.current);
    }
    responseTimeoutRef.current = setTimeout(() => {
      setIsReceiving(false);
    }, 800);
  });

  const vad = useMicVAD({
    startOnLoad: false,
    baseAssetPath,
    onnxWASMBasePath,
    onSpeechEnd: () => {
      console.log("User stopped talking");
      sendSpeechEnd();
    },
    onFrameProcessed: (probabilities, frame) => {
      if (probabilities.isSpeech < 0.8) return;

      sendAudio(floatTo16BitPCM(frame));
    },
    onSpeechRealStart: () => {
      sendSpeechStart();
      console.log("User started talking");
    },
  });

  useEffect(() => {
    return () => {
      if (responseTimeoutRef.current) {
        clearTimeout(responseTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold text-black dark:text-white">
              Gemini Live Translation
            </h1>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-800">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected
                    ? "bg-green-500 dark:bg-green-400"
                    : "bg-gray-300 dark:bg-gray-700"
                }`}
              />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
          </div>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-2">
              {error}
            </p>
          )}
        </header>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <button
            onClick={() => vad.start()}
            disabled={vad.listening || !isConnected}
            className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-50 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 border-black dark:border-white disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:border-gray-200 dark:disabled:border-gray-800 disabled:text-gray-400 dark:disabled:text-gray-600"
          >
            Start Speaking
          </button>

          <button
            onClick={() => vad.pause()}
            disabled={!vad.listening}
            className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-50 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900"
          >
            Pause
          </button>

          <button
            onClick={() => {}}
            className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900"
          >
            Clear
          </button>
        </div>

        {/* Status Indicators */}
        <div className="space-y-4 mb-8">
          {/* User Speaking */}
          {vad.listening && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30">
              <Waveform
                active
                colorClassName="bg-green-500 dark:bg-green-400"
              />
              <span className="text-sm font-medium text-green-700 dark:text-green-400">
                Listening…
              </span>
            </div>
          )}

          {/* AI Response */}
          <div className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
            <Waveform
              active={isReceiving}
              colorClassName="bg-indigo-500 dark:bg-indigo-400"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {isReceiving ? "Gemini is speaking…" : "Waiting for response"}
            </span>
          </div>
        </div>

        {/* Translations */}
        <div className="border border-gray-200 dark:border-gray-800 rounded-lg min-h-[400px]">
          <div className="border-b border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-black dark:text-white">
              Translations
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              🎤 English → 🇻🇳 Vietnamese
            </p>
          </div>

          <div className="p-6">
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 rounded-full border border-gray-200 dark:border-gray-800 flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-gray-400 dark:text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </div>
              <p className="text-base text-gray-600 dark:text-gray-400 mb-1">
                No translations yet
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Click &quot;Start Speaking&quot; to begin
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
