"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import createGeminiConfig from "../app/helpers/geminiConfig";
import {
  dispatchGeminiAudio,
  dispatchGeminiGoAway,
  dispatchGeminiMessage,
  handleGeminiMessage,
} from "./useGeminiLiveHandlers";
import { arrayBufferToBase64 } from "@/utils/audio";

let globalWebSocket: WebSocket | null = null;
let isConnecting = false;

export interface GeminiSocketValue {
  isConnected: boolean;
  ws: WebSocket | null;
  sendAudio: (audio: ArrayBuffer) => void;
  sendText: (text: string) => void;
  sendSpeechStart: () => void;
  sendSpeechEnd: () => void;
  disconnect: () => void;
  error: string | null;
}

export const useGeminiWebSocket = (
  apiKey: string | undefined
): GeminiSocketValue => {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wsInstance, setWsInstance] = useState<WebSocket | null>(null);
  const [sessionHandle, setSessionHandle] = useState<string>();

  useEffect(() => {
    if (!apiKey) return;

    if (
      isConnecting ||
      (globalWebSocket && globalWebSocket.readyState === WebSocket.OPEN)
    ) {
      wsRef.current = globalWebSocket;

      setWsInstance(globalWebSocket);
      setIsConnected(true);
      return;
    }

    isConnecting = true;
    const ws = new WebSocket(
      `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`
    );

    wsRef.current = ws;
    globalWebSocket = ws;

    ws.onopen = () => {
      setWsInstance(ws);
      setIsConnected(true);
      setError(null);
      isConnecting = false;
      ws.send(JSON.stringify(createGeminiConfig(sessionHandle)));
    };

    ws.onmessage = async (event) => {
      await handleGeminiMessage(event, {
        setSessionHandle,
        onAudio: dispatchGeminiAudio,
        onMessage: dispatchGeminiMessage,
        onGoAway: dispatchGeminiGoAway,
      });
    };

    ws.onerror = () => {
      setError("Connection error occurred");
      isConnecting = false;
    };

    ws.onclose = (e) => {
      setIsConnected(false);
      setWsInstance(null);
      globalWebSocket = null;
      if (e.code !== 1000) {
        setError(`Connection closed: ${e.reason || "Unknown reason"}`);
      }
      isConnecting = false;
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) ws.close();
      setWsInstance(null);
      globalWebSocket = null;
      isConnecting = false;
    };
  }, [apiKey]);

  const sendAudio = (audio: ArrayBuffer) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(
      JSON.stringify({
        realtimeInput: {
          audio: {
            mimeType: "audio/pcm;rate=16000",
            data: arrayBufferToBase64(audio),
          },
        },
      })
    );
  };

  const sendText = (text: string) => {
    wsRef.current?.send(
      JSON.stringify({
        clientContent: {
          turns: [
            {
              role: "user",
              parts: [{ text }],
            },
          ],
          turnComplete: true,
        },
      })
    );
  };

  const sendSpeechStart = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    wsRef.current?.readyState === WebSocket.OPEN &&
      wsRef.current.send(
        JSON.stringify({ realtimeInput: { activityStart: {} } })
      );
  };

  const sendSpeechEnd = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    wsRef.current?.readyState === WebSocket.OPEN &&
      wsRef.current.send(
        JSON.stringify({ realtimeInput: { activityEnd: {} } })
      );
  };

  const disconnect = () => {
    wsRef.current?.close();
  };

  return {
    isConnected,
    ws: wsInstance,
    sendAudio,
    sendText,
    sendSpeechStart,
    sendSpeechEnd,
    disconnect,
    error,
  };
};
