"use client";

import {
  useGeminiLiveMessages,
  useGeminiLiveWebSocket,
} from "@/contexts/GeminiLiveWebSocketContext";
import { floatTo16BitPCM } from "@/app/helpers";
import { useMicVAD } from "@ricky0123/vad-react";
import { useProcessGeminiLive } from "@/hooks";
import { useState, useRef, useEffect } from "react";
import { VisibilityFade } from "@/components";

const baseAssetPath =
  "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.27/dist/";
const onnxWASMBasePath =
  "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/";

export default function GeminiLivePage() {
  const { sendAudio, isConnected, error } = useGeminiLiveWebSocket();
  const {
    transcripts,
    audioChunks,
    interimTranscript,
    processGeminiMessage,
    clearTranscripts,
  } = useProcessGeminiLive();

  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize AudioContext for playing Vietnamese audio
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioContextRef.current = new AudioContext({
        sampleRate: 24000, // Gemini's audio sample rate
      });
    }
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  // Play Vietnamese audio when chunks arrive
  useEffect(() => {
    if (audioChunks.length === 0 || !audioContextRef.current) return;

    const playAudio = async () => {
      const latestChunk = audioChunks[audioChunks.length - 1];
      setIsPlaying(true);

      try {
        // Decode base64 audio data
        const binaryString = atob(latestChunk.audioData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Convert to AudioBuffer
        const audioBuffer = audioContextRef.current!.createBuffer(
          1, // mono
          bytes.length / 2, // 16-bit PCM
          24000 // sample rate
        );

        const channelData = audioBuffer.getChannelData(0);
        for (let i = 0; i < channelData.length; i++) {
          const int16 = ((bytes[i * 2] | (bytes[i * 2 + 1] << 8)) << 16) >> 16;
          channelData[i] = int16 / 32768;
        }

        // Play the audio
        const source = audioContextRef.current!.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current!.destination);
        source.onended = () => setIsPlaying(false);
        source.start();
      } catch (err) {
        console.error("Error playing audio:", err);
        setIsPlaying(false);
      }
    };

    playAudio();
  }, [audioChunks]);

  useGeminiLiveMessages((data) => {
    processGeminiMessage(data);
  });

  const vad = useMicVAD({
    startOnLoad: false,
    baseAssetPath,
    onnxWASMBasePath,
    onSpeechEnd: () => {
      console.log("User stopped talking");
    },
    onFrameProcessed: (probabilities, frame) => {
      if (probabilities.isSpeech < 0.8) return;
      sendAudio(floatTo16BitPCM(frame));
    },
  });

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 shrink-0">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-white">
                Gemini Live Translation
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">
                English to Vietnamese real-time translation powered by Gemini
                Live API
              </p>
            </div>

            <div className="flex items-center gap-3">
              {error && (
                <div className="text-xs text-red-400 bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20">
                  {error}
                </div>
              )}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-900 border border-gray-800">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? "bg-emerald-500" : "bg-gray-600"
                  }`}
                />
                <span className="text-xs text-gray-400">
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Split Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Side - Controls Panel */}
        <div className="w-96 border-r border-gray-800 flex flex-col bg-gray-950/30">
          <div className="flex-1 overflow-y-auto p-6">
            {/* Controls */}
            <div className="mb-6">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Controls
              </h2>
              <div className="space-y-2">
                <button
                  onClick={() => vad.start()}
                  disabled={vad.listening || !isConnected}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-gray-100 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-black text-sm font-medium rounded-lg transition-colors border border-gray-200 disabled:border-gray-800"
                >
                  <svg
                    className="w-4 h-4"
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
                  Start Speaking (English)
                </button>
                <button
                  onClick={() => vad.pause()}
                  disabled={!vad.listening}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-900 disabled:text-gray-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors border border-gray-800"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Pause
                </button>
                <button
                  onClick={clearTranscripts}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors border border-gray-800"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Clear Translations
                </button>
              </div>
            </div>

            {/* Status */}
            {vad.listening && (
              <div className="mb-6 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    <div className="w-1 h-3 bg-emerald-500 rounded-full animate-pulse" />
                    <div className="w-1 h-4 bg-emerald-500 rounded-full animate-pulse delay-75" />
                    <div className="w-1 h-3 bg-emerald-500 rounded-full animate-pulse delay-150" />
                  </div>
                  <span className="text-xs text-emerald-400 font-medium">
                    Listening for English...
                  </span>
                </div>
              </div>
            )}

            {isPlaying && (
              <div className="mb-6 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    <div className="w-1 h-3 bg-purple-500 rounded-full animate-pulse" />
                    <div className="w-1 h-4 bg-purple-500 rounded-full animate-pulse delay-75" />
                    <div className="w-1 h-3 bg-purple-500 rounded-full animate-pulse delay-150" />
                  </div>
                  <span className="text-xs text-purple-400 font-medium">
                    Playing Vietnamese audio...
                  </span>
                </div>
              </div>
            )}

            {/* Live Translation */}
            <div className="mb-6">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Live Translation
              </h2>
              <div className="p-4 rounded-lg border border-gray-800 bg-gray-900/50 min-h-[100px]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vietnamese
                  </span>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {interimTranscript ||
                    "Speak in English to see Vietnamese translation..."}
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="mb-6">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Statistics
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-lg border border-gray-800 bg-gray-900/30">
                  <div className="text-2xl font-bold text-white">
                    {transcripts.length}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Translations</div>
                </div>
                <div className="p-3 rounded-lg border border-gray-800 bg-gray-900/30">
                  <div className="text-2xl font-bold text-white">
                    {audioChunks.length}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Audio Chunks</div>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="text-xs text-gray-600 space-y-2">
              <p className="leading-relaxed">
                Powered by Gemini Live API with real-time audio translation
              </p>
              <p className="leading-relaxed">🎤 English → 🇻🇳 Vietnamese</p>
            </div>
          </div>
        </div>

        {/* Right Side - Translation Display */}
        <div className="flex-1 flex flex-col bg-black">
          <div className="px-8 py-6 border-b border-gray-800 bg-gray-950/30 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Vietnamese Translations
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Real-time English to Vietnamese translation
                </p>
              </div>
              {transcripts.length > 0 && (
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">
                    {transcripts.length}
                  </div>
                  <div className="text-xs text-gray-500">
                    {transcripts.length === 1 ? "translation" : "translations"}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            {transcripts.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-gray-600"
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
                  <p className="text-gray-400 text-base mb-2">
                    No translations yet
                  </p>
                  <p className="text-gray-600 text-sm">
                    Click &quot;Start Speaking (English)&quot; to begin
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6 max-w-4xl">
                {transcripts.map((transcript, index) => {
                  return (
                    <VisibilityFade key={index}>
                      <div className="group">
                        <div className="flex gap-4">
                          <span className="text-sm text-gray-600 font-mono mt-1 select-none shrink-0">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <div className="flex-1 space-y-3">
                            {/* Vietnamese Translation - Prominent */}
                            <div className="p-4 rounded-xl border border-purple-800/50 bg-gradient-to-br from-purple-900/30 to-purple-900/10 hover:border-purple-700/50 transition-colors">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-medium text-purple-400 uppercase tracking-wider">
                                  🇻🇳 Vietnamese
                                </span>
                                <span className="text-xs text-gray-600">
                                  {new Date(
                                    transcript.timestamp
                                  ).toLocaleTimeString()}
                                </span>
                              </div>
                              <p className="text-white text-lg leading-relaxed">
                                {transcript.text}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </VisibilityFade>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
