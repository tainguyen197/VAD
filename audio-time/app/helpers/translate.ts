import { GoogleGenAI } from "@google/genai";
const GENAI_API_KEY = process.env.NEXT_PUBLIC_GENAI_API_KEY;

const client = new GoogleGenAI({
  apiKey: GENAI_API_KEY,
});

const modelMap = {
  simple: "gemini-2.5-flash-lite",
  medium: "gemini-2.5-flash",
  advanced: "gemini-2.5-pro",
};

const getModalByComplexity = (text: string) => {
  const length = text.length;
  if (length < 30) return modelMap.simple;
  if (length < 100) return modelMap.medium;

  return modelMap.advanced;
};

const translate = async (text: string) => {
  const prompt = `Just translate the following text to Vietnamese: ${text}`;
  const model = getModalByComplexity(text);

  const response = await client.models.generateContent({
    contents: prompt,
    model,
  });

  const translation = response.candidates?.[0]?.content?.parts?.[0]?.text;
  return translation || "No translation available";
};

export { translate };
