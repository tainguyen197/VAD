"use client";

import { MediaResolution, Modality } from "@google/genai";
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
  sendText: (text: string) => void;
  sendSpeechStart: () => void;
  sendSpeechEnd: () => void;
  disconnect: () => void;
  error: string | null;
}

const GeminiLiveWebSocketContext = createContext<GeminiLiveContextType | null>(
  null
);

// Module-level singleton to prevent duplicate connections
let globalWebSocket: WebSocket | null = null;
let isConnecting = false;

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
  const [wsInstance, setWsInstance] = useState<WebSocket | null>(null);

  useEffect(() => {
    if (!apiKey) return;

    if (
      isConnecting ||
      (globalWebSocket &&
        (globalWebSocket as WebSocket).readyState !== WebSocket.CLOSED)
    ) {
      if (
        globalWebSocket &&
        (globalWebSocket as WebSocket).readyState === WebSocket.OPEN
      ) {
        wsRef.current = globalWebSocket;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setWsInstance(globalWebSocket as WebSocket);
        setIsConnected(true);
      }
      return;
    }

    console.log("Connecting to Gemini Live API");

    isConnecting = true;

    // Gemini Live API WebSocket endpoint
    const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;
    globalWebSocket = ws;

    ws.onopen = () => {
      console.log("🌟 Connected to Gemini Live API");
      setWsInstance(ws);
      setIsConnected(true);
      setError(null);
      isConnecting = false;

      // Send initial setup message
      // const setupMessage = {
      //   setup: {
      //     model: "models/gemini-2.0-flash-exp",
      //     generation_config: {
      //       response_modalities: ["TEXT"],
      //       // speech_config: {
      //       //   voice_config: {
      //       //     prebuilt_voice_config: {
      //       //       voice_name: "Puck",
      //       //     },
      //       //   },
      //       // },
      //     },
      //     system_instruction: {
      //       parts: [
      //         {
      //           text: "You are a real-time translator. Listen to English audio and respond ONLY with the Vietnamese translation. Be concise and natural. Do not add any explanations or extra commentary, just provide the direct Vietnamese translation of what you hear.",
      //         },
      //       ],
      //     },
      //   },
      // };

      // set up with gemini-2.5-flash-native-audio-dialog
      const setupMessage = {
        setup: {
          model: "models/gemini-2.5-flash-native-audio-preview-09-2025",
          generationConfig: {
            responseModalities: [Modality.AUDIO],
            mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: "Zephyr",
                },
              },
            },
          },
          realtimeInputConfig: {
            automaticActivityDetection: { disabled: true },
          },
          systemInstruction: {
            parts: [
              {
                text: `You are a translator. Translate everything I say from English into Vietnamese and speak the translation out loud.`,
              },
            ],
          },
        },
      };
      ws.send(JSON.stringify(setupMessage));
      console.log("📤 Sent setup configuration");
    };

    ws.onmessage = async (event) => {
      try {
        let data;

        // Check if the message is a Blob
        if (event.data instanceof Blob) {
          console.log("📨 Received Blob from Gemini:", event.data);

          // Read the blob as text
          const text = await event.data.text();

          try {
            // Try to parse as JSON
            data = JSON.parse(text);
            console.log("📨 Parsed JSON from Blob:", data);
          } catch {
            // If not JSON, treat as raw audio data
            console.log("📨 Received binary audio Blob");
            window.dispatchEvent(
              new CustomEvent("gemini-live-audio-blob", {
                detail: event.data,
              })
            );
            return;
          }
        } else {
          // It's a text message, parse directly
          data = JSON.parse(event.data);
          console.log("📨 Received text message from Gemini:", data);
        }

        // Dispatch custom event so components can listen
        window.dispatchEvent(
          new CustomEvent("gemini-live-message", {
            detail: data,
          })
        );
      } catch (err) {
        console.error("Error parsing message:", err, event.data);
      }
    };

    ws.onerror = (e) => {
      console.error("🌟 WebSocket Error:", e);
      setError("Connection error occurred");
      isConnecting = false;
    };

    ws.onclose = (e) => {
      console.warn("🌟 Connection closed:", e.code, e.reason);
      setIsConnected(false);
      setWsInstance(null);
      globalWebSocket = null;

      if (e.code !== 1000) {
        setError(`Connection closed: ${e.reason || "Unknown reason"}`);
      }
      isConnecting = false;
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      setWsInstance(null);
      globalWebSocket = null;
      isConnecting = false;
    };
  }, [apiKey]);

  const sendAudio = useCallback((audio: ArrayBuffer) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // Convert ArrayBuffer to base64 string
      const bytes = new Uint8Array(audio);
      const binaryString = Array.from(bytes)
        .map((byte) => String.fromCharCode(byte))
        .join("");
      const base64Audio = btoa(binaryString);

      const message = {
        realtimeInput: {
          audio: {
            mimeType: "audio/pcm;rate=16000",
            data: base64Audio,
          },
        },
      };

      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const sendText = useCallback((text: string) => {
    const message = {
      clientContent: {
        turns: [
          // <-- Use 'turns', which is an array of Content objects
          {
            role: "user", // Required for conversational history
            parts: [
              {
                text: text,
              },
            ],
          },
        ],
        turnComplete: true, // Explicitly signals the end of the text turn
      },
    };

    wsRef.current.send(JSON.stringify(message));
  }, []);

  const sendSpeechStart = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message = {
        realtimeInput: {
          activityStart: {},
        },
      };
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const sendSpeechEnd = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const message = {
        realtimeInput: {
          activityEnd: {},
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
        sendText,
        sendSpeechStart,
        sendSpeechEnd,
        disconnect,
        ws: wsInstance,
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
