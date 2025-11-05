"use client";

import DeepgramWebSocketProvider from "@/contexts/DeepgramWebSocketContext";
import useDeepgramToken from "@/hooks/useDeepgramToken";

export function Providers({ children }: { children: React.ReactNode }) {
  const token = useDeepgramToken();

  if (!token) {
    return <>{children}</>;
  }

  return (
    <DeepgramWebSocketProvider token={token}>
      {children}
    </DeepgramWebSocketProvider>
  );
}
