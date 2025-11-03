"use client";

import { useEffect, useState } from "react";

const URL_BASE = process.env.NEXT_PUBLIC_API_URL;

const useDeepgramToken = () => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchToken = async () => {
      const response = await fetch(`${URL_BASE}/api/get-deepgram-token`);
      const data = await response.json();
      setToken(data.access_token);
    };
    fetchToken();
  }, []);

  return token;
};

export default useDeepgramToken;
