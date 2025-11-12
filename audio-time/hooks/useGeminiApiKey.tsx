"use client";

import { useEffect, useState } from "react";

const API_KEY = process.env.NEXT_PUBLIC_GENAI_API_KEY;

const useGeminiApiKey = () => {
  const [apiKey, setApiKey] = useState<string>("");

  useEffect(() => {
    if (API_KEY) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setApiKey(API_KEY);
    } else {
      console.warn(
        "⚠️ NEXT_PUBLIC_GENAI_API_KEY not found in environment variables"
      );
    }
  }, []);

  return API_KEY;
};

export default useGeminiApiKey;
