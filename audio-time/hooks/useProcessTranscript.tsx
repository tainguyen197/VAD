import { useCallback, useState } from "react";

// Outside the component
const SENTENCE_END_REGEX = /([.?!])\s*/g;

// Extract sentence processing logic
const extractSentences = (text: string) => {
  let match;
  let lastEndIndex = 0;
  const foundSentences: string[] = [];

  while ((match = SENTENCE_END_REGEX.exec(text)) !== null) {
    const sentence = text.slice(lastEndIndex, match.index + 1).trim();
    if (sentence) {
      foundSentences.push(sentence);
    }
    lastEndIndex = match.index + 1;
  }

  const remainder = text.slice(lastEndIndex).trim();
  return { sentences: foundSentences, remainder };
};

const useProcessTranscript = () => {
  const [buffer, setBuffer] = useState<string>("");
  const [sentences, setSentences] = useState<string[]>([]);

  const processTranscript = useCallback(
    (text: string) => {
      console.log("🔊 Processing transcript:", text);

      // Calculate new buffer
      const newBuffer = buffer + (buffer ? " " : "") + text.trim();

      // Extract sentences
      const { sentences: foundSentences, remainder } =
        extractSentences(newBuffer);

      // Update state cleanly
      if (foundSentences.length > 0) {
        foundSentences.forEach((s) => console.log("🔊 Found sentence:", s));
        setSentences((prev) => [...prev, ...foundSentences]);
      }
      setBuffer(remainder);
    },
    [buffer]
  );

  return { processTranscript, sentences, buffer };
};

export { useProcessTranscript };
