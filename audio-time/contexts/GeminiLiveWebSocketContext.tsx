"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";

interface GeminiLiveContextType {
  isConnected: boolean;
  ws: WebSocket | null;
  sendAudio: (audio: ArrayBuffer) => void;
  disconnect: () => void;
  error: string | null;
}

const GeminiLiveWebSocketContext = createContext<GeminiLiveContextType | null>(
  null
);

interface SetupMessage {
  setup: {
    model: string;
    generation_config?: {
      response_modalities?: string[];
      speech_config?: {
        voice_config?: {
          prebuilt_voice_config?: {
            voice_name?: string;
          };
        };
      };
    };
    system_instruction?: {
      parts: Array<{ text: string }>;
    };
  };
}

const GeminiLiveWebSocketProvider = ({
  children,
  apiKey,
}: {
  children: React.ReactNode;
  apiKey: string;
}) => {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiKey) return;

    // Gemini Live API WebSocket endpoint
    const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log("🌟 Connected to Gemini Live API");
      setIsConnected(true);
      setError(null);

      // Send initial setup message
      const setupMessage = {
        setup: {
          model: "models/gemini-2.0-flash-exp",
          generation_config: {
            response_modalities: ["AUDIO"],
            speech_config: {
              voice_config: {
                prebuilt_voice_config: {
                  voice_name: "Puck",
                },
              },
            },
          },
          system_instruction: {
            parts: [
              {
                text: "You are a real-time translator. Listen to English audio and respond ONLY with the Vietnamese translation. Be concise and natural. Do not add any explanations or extra commentary, just provide the direct Vietnamese translation of what you hear.",
              },
            ],
          },
        },
      };
      ws.send(JSON.stringify(setupMessage));
      console.log("📤 Sent setup configuration");
    };

    ws.onmessage = (event) => {
      try {
        // Check if the message is a Blob (binary audio data)
        if (event.data instanceof Blob) {
          console.log("📨 Received audio Blob from Gemini:", event.data);

          // Dispatch custom event for audio blob
          window.dispatchEvent(
            new CustomEvent("gemini-live-audio-blob", {
              detail: event.data,
            })
          );
          return;
        }

        // Otherwise, parse as JSON
        const data = JSON.parse(event.data);
        console.log("📨 Received from Gemini:", data);

        // Dispatch custom event so components can listen
        window.dispatchEvent(
          new CustomEvent("gemini-live-message", {
            detail: data,
          })
        );
      } catch (err) {
        console.error("Error parsing message:", err);
      }
    };

    ws.onerror = (e) => {
      console.error("🌟 WebSocket Error:", e);
      setError("Connection error occurred");
    };

    ws.onclose = (e) => {
      console.warn("🌟 Connection closed:", e.code, e.reason);
      setIsConnected(false);

      if (e.code !== 1000) {
        setError(`Connection closed: ${e.reason || "Unknown reason"}`);
      }
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [apiKey]);

  const sendAudio = useCallback((audio: ArrayBuffer) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // Convert ArrayBuffer to base64
      const bytes = new Uint8Array(audio);
      const binaryString = Array.from(bytes)
        .map((byte) => String.fromCharCode(byte))
        .join("");
      const base64Audio = btoa(binaryString);

      const message = {
        realtime_input: {
          media_chunks: [
            {
              mime_type: "audio/pcm",
              data: base64Audio,
            },
          ],
        },
      };

      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }
  }, []);

  return (
    <GeminiLiveWebSocketContext.Provider
      value={{
        isConnected,
        sendAudio,
        disconnect,
        ws: wsRef.current,
        error,
      }}
    >
      {children}
    </GeminiLiveWebSocketContext.Provider>
  );
};

// Hook to use the shared WebSocket connection
export const useGeminiLiveWebSocket = () => {
  const context = useContext(GeminiLiveWebSocketContext);
  if (!context) {
    throw new Error(
      "useGeminiLiveWebSocket must be used within GeminiLiveWebSocketProvider"
    );
  }
  return context;
};

// Hook to listen to Gemini Live messages
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useGeminiLiveMessages = (callback: (data: any) => void) => {
  useEffect(() => {
    const handler = (e: Event) => {
      callback((e as CustomEvent).detail);
    };
    window.addEventListener("gemini-live-message", handler);
    return () => window.removeEventListener("gemini-live-message", handler);
  }, [callback]);
};

export default GeminiLiveWebSocketProvider;
