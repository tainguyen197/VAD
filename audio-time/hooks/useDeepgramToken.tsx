"use client";

import { useEffect, useState } from "react";

const TEMPORARY_TOKEN = process.env.WTF;
const URL_BASE = process.env.NEXT_PUBLIC_API_URL;

const useDeepgramToken = () => {
  const [token, setToken] = useState<string | null>(
    "4862b8ac20db652e6940f87153a3e1a907707482"
  );

  // useEffect(() => {
  //   const fetchToken = async () => {
  //     const response = await fetch(`${URL_BASE}/api/get-deepgram-token`);
  //     const data = await response.json();
  //     console.log("data: ", data);
  //     setToken(data.access_token);
  //   };
  //   fetchToken();
  // }, []);

  return token;
};

export default useDeepgramToken;
