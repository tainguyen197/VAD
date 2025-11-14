"use client";

import { LiveServerMessage } from "@google/genai";
import { useEffect } from "react";

type MessageHooks = {
  setSessionHandle: (handle: string) => void;
  onAudio: (mimeType: string, data: string) => void;
  onMessage: (data: LiveServerMessage) => void;
  onGoAway: (timeLeft: string | undefined) => void;
};

export const handleGeminiMessage = async (
  event: MessageEvent,
  hooks: MessageHooks
) => {
  if (!(event.data instanceof Blob)) return;
  const text = await event.data.text();
  const dataObject: LiveServerMessage = JSON.parse(text);

  if (dataObject.sessionResumptionUpdate?.newHandle) {
    hooks.setSessionHandle(dataObject.sessionResumptionUpdate.newHandle);
  }

  if (dataObject.goAway) {
    hooks.onGoAway(dataObject.goAway.timeLeft);
  }

  const part = dataObject?.serverContent?.modelTurn?.parts?.[0]?.inlineData;
  if (part?.mimeType?.includes("audio/pcm") && part.data) {
    hooks.onAudio(part.mimeType, part.data);
  } else {
    hooks.onMessage(dataObject);
  }
};

export const useGeminiLiveEvent = <T>(
  eventName: string,
  callback: (data: T) => void
) => {
  useEffect(() => {
    const handler = (e: Event) => callback((e as CustomEvent<T>).detail);
    window.addEventListener(eventName, handler);
    return () => window.removeEventListener(eventName, handler);
  }, [eventName, callback]);
};

export const dispatchGeminiAudio = (mimeType: string, data: string) =>
  window.dispatchEvent(
    new CustomEvent("gemini-live-audio", { detail: { mimeType, data } })
  );

export const dispatchGeminiMessage = (message: LiveServerMessage) =>
  window.dispatchEvent(
    new CustomEvent("gemini-live-message", { detail: message })
  );

export const dispatchGeminiGoAway = (timeLeft?: string) =>
  window.dispatchEvent(
    new CustomEvent("gemini-live-goaway", {
      detail: { timeLeft: timeLeft ?? "unknown" },
    })
  );
