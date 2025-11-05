"use client";

import {
  useDeepgramMessages,
  useDeepgramWebSocket,
} from "@/contexts/DeepgramWebSocketContext";
import { floatTo16BitPCM } from "@/app/helpers";
import { useMicVAD } from "@ricky0123/vad-react";
import { useProcessTranscript, useProcessTranslate } from "@/hooks";
import { useState } from "react";

const baseAssetPath =
  "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.27/dist/";
const onnxWASMBasePath =
  "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/";

const displaySentences = ["Hello, how are you?", "I am fine, thank you."];

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
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-white">
                Voice Transcription
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">
                Real-time speech-to-text powered by Deepgram
              </p>
            </div>

            {/* Connection Status */}
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

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Controls */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => vad.start()}
              disabled={vad.listening}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-black text-sm font-medium rounded-lg transition-colors border border-gray-200 disabled:border-gray-800"
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
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-900 disabled:text-gray-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors border border-gray-800"
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
            {vad.listening && (
              <div className="flex items-center gap-2 text-xs text-gray-400 ml-2">
                <div className="flex gap-0.5">
                  <div className="w-1 h-3 bg-emerald-500 rounded-full animate-pulse" />
                  <div className="w-1 h-4 bg-emerald-500 rounded-full animate-pulse delay-75" />
                  <div className="w-1 h-3 bg-emerald-500 rounded-full animate-pulse delay-150" />
                </div>
                <span>Listening...</span>
              </div>
            )}
          </div>
        </div>

        {/* Live Transcription */}
        {
          <div className="mb-6 p-4 rounded-lg border border-gray-800 bg-gray-900/50">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                Live
              </span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed min-h-[24px]">
              {interimText || "Speak to see real-time transcription..."}
            </p>
          </div>
        }

        {/* Transcription Results */}
        <div className="rounded-lg border border-gray-800 bg-gray-950/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800 bg-gray-900/30">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">
                Transcription
              </h2>
              {sentences.length > 0 && (
                <span className="text-xs text-gray-500">
                  {sentences.length}{" "}
                  {sentences.length === 1 ? "sentence" : "sentences"}
                </span>
              )}
            </div>
          </div>

          <div className="p-6">
            {displaySentences.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-12 h-12 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-6 h-6 text-gray-600"
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
                <p className="text-gray-400 text-sm mb-1">
                  No transcription yet
                </p>
                <p className="text-gray-600 text-xs">
                  Click &quot;Start Listening&quot; to begin
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                {displaySentences.map((sentence, index) => {
                  const sentenceNumber =
                    sentences.length - displaySentences.length + index + 1;

                  return (
                    <div
                      key={index}
                      className="group p-4 rounded-lg border border-gray-800 bg-gray-900/30 hover:border-gray-700 hover:bg-gray-900/50 animate-fadeIn"
                    >
                      <div className="flex gap-3">
                        <span className="text-xs text-gray-600 font-mono mt-0.5 select-none">
                          {String(sentenceNumber).padStart(2, "0")}
                        </span>
                        <div className="flex flex-col gap-1">
                          <p className="text-gray-200 text-md leading-relaxed flex-1">
                            {translations[index] || (
                              <span className="text-gray-500">
                                Translating...
                              </span>
                            )}
                          </p>
                          <p className="text-gray-500 text-xs leading-relaxed flex-1">
                            {sentence}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-16">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <p className="text-xs text-gray-600 text-center">
            Powered by Deepgram API and @ricky0123/vad-react
          </p>
        </div>
      </footer>
    </div>
  );
}
