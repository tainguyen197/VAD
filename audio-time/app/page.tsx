"use client";

import {
  useDeepgramMessages,
  useDeepgramWebSocket,
} from "@/contexts/DeepgramWebSocketContext";
import { floatTo16BitPCM } from "@/app/helpers";
import { useMicVAD } from "@ricky0123/vad-react";
import { useProcessTranscript } from "@/hooks";
import { useState } from "react";

export default function Home() {
  const { sendAudio, isConnected } = useDeepgramWebSocket();
  const { processTranscript, sentences } = useProcessTranscript();
  const [interimText, setInterimText] = useState<string>("");

  useDeepgramMessages((data) => {
    if (data.type === "Results") {
      const newText = data.channel.alternatives[0].transcript;

      if (data.is_final) {
        // Final result - add to sentences
        processTranscript(newText);
        setInterimText(""); // Clear interim text
      } else {
        // Interim result - show in real-time
        setInterimText(newText);
      }
    }
  });

  const vad = useMicVAD({
    startOnLoad: false,
    baseAssetPath:
      "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.27/dist/",
    onnxWASMBasePath:
      "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/",
    onSpeechEnd: () => {
      console.log("User stopped talking");
    },
    onFrameProcessed: (probabilities, frame) => {
      if (probabilities.isSpeech < 0.8) return;
      sendAudio(floatTo16BitPCM(frame));
    },
  });

  const displaySentences = sentences.slice(-10);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Voice Transcription
          </h1>
          <p className="text-slate-300">Real-time speech to text</p>
        </div>

        {/* Main Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          {/* Status & Controls */}
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/10">
            {/* Connection Status */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isConnected ? "bg-green-400" : "bg-red-400"
                  }`}
                />
                {isConnected && (
                  <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-400 animate-ping" />
                )}
              </div>
              <span className="text-white font-medium">
                {isConnected ? "Connected to Deepgram" : "Not Connected"}
              </span>
            </div>

            {/* Control Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => vad.start()}
                disabled={vad.listening}
                className="px-6 py-2.5 bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                🎤 Start
              </button>
              <button
                onClick={() => vad.pause()}
                disabled={!vad.listening}
                className="px-6 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                ⏸ Pause
              </button>
            </div>
          </div>

          {/* Interim Results - Live Transcription */}
          {
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-400/30 animate-pulse">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                <span className="text-xs text-blue-300 font-semibold">
                  LIVE TRANSCRIPTION
                </span>
              </div>
              <div className="text-white/90 italic">
                {interimText || "Listening..."}
              </div>
            </div>
          }

          {/* Transcription Area - Final Sentences */}
          <div className="bg-slate-900/50 rounded-xl p-6 border border-white/5 min-h-[300px] max-h-[500px] overflow-y-auto">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span>📝</span>
              Transcription
              {sentences.length > 0 && (
                <span className="text-sm text-slate-400 font-normal">
                  ({sentences.length} sentences)
                </span>
              )}
            </h3>

            {sentences.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p className="text-lg">No transcription yet</p>
                <p className="text-sm mt-2">
                  Click &quot;Start&quot; and begin speaking
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {displaySentences.map((sentence, index) => {
                  const sentenceNumber =
                    sentences.length - displaySentences.length + index + 1;

                  return (
                    <div
                      key={index}
                      className="p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <span className="text-xs text-slate-500 mr-2">
                        {sentenceNumber}.
                      </span>
                      <span className="text-white">{sentence}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
