"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

interface DeepgramContextType {
  isConnected: boolean;
  ws: WebSocket | null;
  sendAudio: (audio: ArrayBuffer | Blob) => void;
  disconnect: () => void;
}

const DeepgramWebSocketContext = createContext<DeepgramContextType | null>(
  null
);

const params = new URLSearchParams({
  model: "nova-3",
  encoding: "linear16",
  sample_rate: "16000",
  channels: "1",
  smart_format: "true",
  interim_results: "true",
  punctuation: "true",
  diarize: "true",
});

const DeepgramWebSocketProvider = ({
  children,
  token,
}: {
  children: React.ReactNode;
  token: string;
}) => {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  React.useEffect(() => {
    if (!token) return;

    const url = `wss://api.deepgram.com/v1/listen?${params.toString()}`;
    const dg = new WebSocket(url, ["token", token]);
    wsRef.current = dg;

    dg.onopen = () => {
      console.log("🔗 Connected to Deepgram");
      setIsConnected(true);
    };

    dg.onmessage = (e) => {
      // Dispatch custom event so components can listen
      window.dispatchEvent(
        new CustomEvent("deepgram-message", {
          detail: JSON.parse(e.data),
        })
      );
    };

    dg.onerror = (e) => {
      console.error("🔗 Error:", e);
    };

    dg.onclose = (e) => {
      console.warn("🔗 Closed:", e.code, e.reason);
      setIsConnected(false);
    };

    return () => {
      if (dg.readyState === WebSocket.OPEN) {
        dg.close();
      }
    };
  }, [token]);

  const sendAudio = (audio: ArrayBuffer | Blob) => {
    if (wsRef.current) {
      wsRef.current.send(audio);
    }
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  return (
    <DeepgramWebSocketContext.Provider
      // eslint-disable-next-line react-hooks/refs
      value={{ isConnected, sendAudio, disconnect, ws: wsRef.current }}
    >
      {children}
    </DeepgramWebSocketContext.Provider>
  );
};

// Hook to use the shared WebSocket connection
export const useDeepgramWebSocket = () => {
  const context = useContext(DeepgramWebSocketContext);
  if (!context) {
    throw new Error(
      "useDeepgramWebSocket must be used within DeepgramWebSocketProvider"
    );
  }
  return context;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useDeepgramMessages = (callback: (data: any) => void) => {
  useEffect(() => {
    const handler = (e: Event) => {
      callback((e as CustomEvent).detail);
    };
    window.addEventListener("deepgram-message", handler);
    return () => window.removeEventListener("deepgram-message", handler);
  }, [callback]);
};

export default DeepgramWebSocketProvider;
