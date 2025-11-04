"use client";

import { useState, useEffect, useRef } from "react";
import { useMicVAD } from "@ricky0123/vad-react";

interface Translation {
  english: string;
  vietnamese: string;
  timestamp: string;
}

export default function Home() {
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const vad = useMicVAD({
    startOnLoad: false,
    positiveSpeechThreshold: 0.8,
    
    onSpeechStart: () => {
      console.log("🎤 Speech started");
    },
    
    onFrameProcessed: (probs, frame) => {
      // Send audio frames to WebSocket while speaking
      if (wsRef.current?.readyState === WebSocket.OPEN && probs.isSpeech && frame) {
        // Convert Float32Array to Int16Array (PCM 16-bit)
        const pcm16 = new Int16Array(frame.length);
        for (let i = 0; i < frame.length; i++) {
          const s = Math.max(-1, Math.min(1, frame[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        
        // Send to WebSocket server
        wsRef.current.send(pcm16.buffer);
      }
    },
    
    onSpeechEnd: () => {
      console.log("🔇 Speech ended");
    },

    onVADMisfire: () => {
      console.log("⚠️ False positive - not speech");
    },
  });

  const startTranslator = async () => {
    try {
      // Connect to WebSocket server
      const ws = new WebSocket("ws://localhost:8080");
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("✅ WebSocket connected");
        setIsConnected(true);
        
        // Start VAD after WebSocket is connected
        vad.start();
        console.log("🎙️ VAD started - speak into microphone");
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.status === "connected") {
          console.log("🔗 Ready to translate");
        } else if (data.english && data.vietnamese) {
          setTranslations((prev) => [data, ...prev].slice(0, 50));
        } else if (data.error) {
          console.error("Server error:", data.error);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsConnected(false);
        vad.pause();
      };

      ws.onclose = () => {
        console.log("🔌 WebSocket closed");
        setIsConnected(false);
        vad.pause();
      };
      
    } catch (error) {
      console.error("Error starting translator:", error);
      setIsConnected(false);
    }
  };

  const stopTranslator = () => {
    console.log("🛑 Stopping translator...");
    
    // Stop VAD
    vad.pause();
    
    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
  };

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      vad.pause();
    };
  }, []);

  return (
    <main className="min-h-screen p-8 bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">
          🎮 Game Translator (WebSocket + VAD)
        </h1>

        <div className="mb-8 text-center">
          {!isConnected ? (
            <button
              onClick={startTranslator}
              className="bg-green-600 hover:bg-green-700 px-8 py-3 rounded-lg text-lg font-semibold transition"
            >
              🎤 Start Translation
            </button>
          ) : (
            <button
              onClick={stopTranslator}
              className="bg-red-600 hover:bg-red-700 px-8 py-3 rounded-lg text-lg font-semibold transition"
            >
              🛑 Stop Translation
            </button>
          )}

          {isConnected && (
            <div className="mt-4">
              {vad.userSpeaking ? (
                <div className="text-green-400 font-semibold text-lg animate-pulse">
                  🎤 User is speaking - Sending to server...
                </div>
              ) : (
                <div className="text-blue-400 text-lg">
                  👂 Listening... (speak now)
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {translations.map((t, idx) => (
            <div
              key={idx}
              className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition"
            >
              <div className="flex items-start gap-4">
                <div className="text-2xl">🎮</div>
                <div className="flex-1">
                  <div className="text-gray-400 text-sm mb-1">English</div>
                  <div className="text-lg mb-3">{t.english}</div>

                  <div className="text-gray-400 text-sm mb-1">🇻🇳 Vietnamese</div>
                  <div className="text-xl font-semibold text-blue-400">
                    {t.vietnamese}
                  </div>
                </div>
              </div>

              <div className="text-xs text-gray-500 mt-3">
                {new Date(t.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}

          {translations.length === 0 && isConnected && (
            <div className="text-center text-gray-500 py-12">
              Waiting for speech... Speak into your microphone
            </div>
          )}
        </div>
      </div>
    </main>
  );
}