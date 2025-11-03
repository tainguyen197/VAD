"use client";

import useDeepgramToken from "@/hooks/useDeepgramToken";
import { useMicVAD } from "@ricky0123/vad-react";
import { useEffect } from "react";

export default function Home() {
  const deepgramToken = useDeepgramToken();

  useEffect(() => {
    if (!deepgramToken) return;

    const url =
      "wss://api.deepgram.com/v1/listen?model=nova-2-general&encoding=linear16&sample_rate=44100";

    const dg = new WebSocket(url, ["token", deepgramToken]);

    dg.onopen = () => console.log("🔗 Connected to Deepgram");
    dg.onmessage = (e) => console.log("🔗 Message:", e.data);
    dg.onerror = (e) => console.error("🔗 Error:", e);
    dg.onclose = (e) => console.warn("🔗 Closed:", e.code, e.reason); // watch for 4003, etc.

    return () => dg.close();
  }, [deepgramToken]);

  const vad = useMicVAD({
    startOnLoad: false,
    baseAssetPath:
      "https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.27/dist/",
    onnxWASMBasePath:
      "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/",
    onSpeechEnd: (audio) => {
      console.log("User stopped talking");
    },
    onFrameProcessed: (probabilities, frame) => {
      if (probabilities.isSpeech > 0.8) {
        console.log("User is speaking");
      } else {
        console.log("User is not speaking");
      }
    },
  });

  return (
    <>
      <button onClick={() => vad.start()}>Start</button>
      <button onClick={() => vad.pause()}>Pause</button>
      <div>{vad.userSpeaking && "User is speaking"}</div>
    </>
  );
}
