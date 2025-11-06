"use client";

import GeminiLiveWebSocketProvider from "@/contexts/GeminiLiveWebSocketContext";
import useGeminiApiKey from "@/hooks/useGeminiApiKey";

export function GeminiProviders({ children }: { children: React.ReactNode }) {
  const apiKey = useGeminiApiKey();

  if (!apiKey) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">⚠️ Missing API Key</div>
          <p className="text-gray-400 text-sm">
            Please set NEXT_PUBLIC_GENAI_API_KEY in your environment variables
          </p>
        </div>
      </div>
    );
  }

  return (
    <GeminiLiveWebSocketProvider apiKey={apiKey}>
      {children}
    </GeminiLiveWebSocketProvider>
  );
}
