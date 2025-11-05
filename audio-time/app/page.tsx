"use client";

import {
  useDeepgramMessages,
  useDeepgramWebSocket,
} from "@/contexts/DeepgramWebSocketContext";
import { floatTo16BitPCM } from "@/app/helpers";
import { useMicVAD } from "@ricky0123/vad-react";
import { useProcessTranscript, useProcessTranslate } from "@/hooks";
import { useState } from "react";
import { VisibilityFade } from "@/components";

const baseAssetPath =
  "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.27/dist/";
const onnxWASMBasePath =
  "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/";

const displaySentences = [
  "Hello, how are you?",
  "I am fine, thank you.",
  "This is a test sentence.",
  "This is another test sentence.",
  "This is a third test sentence.",
  "This is a fourth test sentence.",
  "This is a fifth test sentence.",
  "This is a sixth test sentence.",
  "This is a seventh test sentence.",
  "This is a eighth test sentence.",
  "This is a ninth test sentence.",
  "This is a tenth test sentence.",
];

export default function Home() {
  const { sendAudio, isConnected } = useDeepgramWebSocket();
  const { processTranscript, sentences } = useProcessTranscript();
  const { translations } = useProcessTranslate(displaySentences);

  const [interimText, setInterimText] = useState<string>("");

  useDeepgramMessages((data) => {
    if (data.type !== "Results") return;
    const newText = data.channel.alternatives[0].transcript;

    if (data.is_final) {
      processTranscript(newText);
      setInterimText("");
    } else {
      setInterimText(newText);
    }
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
      <header className="border-b border-gray-800 flex-shrink-0">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-white">
                Voice Transcription
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">
                Real-time speech-to-text powered by Deepgram
              </p>
            </div>

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
      </header>

      {/* Main Content - Split Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Side - Information Panel */}
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
                  disabled={vad.listening}
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
                  Start Listening
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
                    Listening...
                  </span>
                </div>
              </div>
            )}

            {/* Live Transcription */}
            <div className="mb-6">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Live Feed
              </h2>
              <div className="p-4 rounded-lg border border-gray-800 bg-gray-900/50 min-h-[100px]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Live
                  </span>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {interimText || "Speak to see real-time transcription..."}
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
                    {sentences.length}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Sentences</div>
                </div>
                <div className="p-3 rounded-lg border border-gray-800 bg-gray-900/30">
                  <div className="text-2xl font-bold text-white">
                    {displaySentences.length}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Displayed</div>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="text-xs text-gray-600 space-y-2">
              <p className="leading-relaxed">
                Powered by Deepgram API and @ricky0123/vad-react
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Translation Display */}
        <div className="flex-1 flex flex-col bg-black">
          <div className="px-8 py-6 border-b border-gray-800 bg-gray-950/30 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Translation
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Vietnamese to English translation
                </p>
              </div>
              {sentences.length > 0 && (
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">
                    {sentences.length}
                  </div>
                  <div className="text-xs text-gray-500">
                    {sentences.length === 1 ? "sentence" : "sentences"}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8">
            {displaySentences.length === 0 ? (
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
                    No translation yet
                  </p>
                  <p className="text-gray-600 text-sm">
                    Click &quot;Start Listening&quot; to begin transcribing
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6 max-w-4xl">
                {displaySentences.map((sentence, index) => {
                  const sentenceNumber =
                    sentences.length - displaySentences.length + index + 1;

                  return (
                    <VisibilityFade key={index}>
                      <div className="group">
                        <div className="flex gap-4">
                          <span className="text-sm text-gray-600 font-mono mt-1 select-none flex-shrink-0">
                            {String(sentenceNumber).padStart(2, "0")}
                          </span>
                          <div className="flex-1 space-y-3">
                            {/* Translation - Prominent */}
                            <div className="p-3 rounded-xl border border-gray-800 bg-gradient-to-br from-gray-900/50 to-gray-900/30 hover:border-gray-700 transition-colors">
                              <p className="text-white text-md leading-relaxed">
                                {translations[index] || (
                                  <span className="text-gray-500 text-base">
                                    Translating...
                                  </span>
                                )}
                              </p>
                            </div>
                            {/* Original - Subtle */}
                            <div className="pl-5 border-l-2 border-gray-800">
                              <p className="text-gray-500 text-sm leading-relaxed">
                                {sentence}
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
