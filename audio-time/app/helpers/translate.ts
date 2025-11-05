import { GoogleGenAI } from "@google/genai";
const GENAI_API_KEY = process.env.NEXT_PUBLIC_GENAI_API_KEY;

const client = new GoogleGenAI({
  apiKey: GENAI_API_KEY,
});

const translate = async (text: string) => {
  const prompt = `Just translate the following text to Vietnamese: ${text}`;
  const response = await client.models.generateContent({
    contents: prompt,
    model: "gemini-2.5-flash",
  });

  const translation = response.candidates?.[0]?.content?.parts?.[0]?.text;
  return translation || "No translation available";
};

export { translate };
