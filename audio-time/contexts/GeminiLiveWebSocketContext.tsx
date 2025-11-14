"use client";

import React, { createContext, useContext } from "react";
import {
  useGeminiWebSocket,
  GeminiSocketValue,
} from "../hooks/useGeminiWebSocket";
import { useGeminiLiveEvent } from "../hooks/useGeminiLiveHandlers";
import { LiveServerMessage } from "@google/genai";

const GeminiLiveWebSocketContext = createContext<GeminiSocketValue | null>(
  null
);

export const GeminiLiveWebSocketProvider = ({
  children,
  apiKey,
}: {
  children: React.ReactNode;
  apiKey: string;
}) => {
  const value = useGeminiWebSocket(apiKey);
  return (
    <GeminiLiveWebSocketContext.Provider value={value}>
      {children}
    </GeminiLiveWebSocketContext.Provider>
  );
};

export const useGeminiLiveWebSocket = () => {
  const context = useContext(GeminiLiveWebSocketContext);
  if (!context)
    throw new Error(
      "useGeminiLiveWebSocket must be used within GeminiLiveWebSocketProvider"
    );
  return context;
};

export const useGeminiLiveMessages = (
  callback: (data: LiveServerMessage) => void
) => useGeminiLiveEvent<LiveServerMessage>("gemini-live-message", callback);

export const useGeminiLiveAudio = (
  callback: (data: { mimeType: string; data: string }) => void
) =>
  useGeminiLiveEvent<{ mimeType: string; data: string }>(
    "gemini-live-audio",
    callback
  );

export const useGeminiLiveGoAway = (
  callback: (data: { timeLeft: string }) => void
) => useGeminiLiveEvent<{ timeLeft: string }>("gemini-live-goaway", callback);

export default GeminiLiveWebSocketProvider;
