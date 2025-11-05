import { translate } from "@/app/helpers/translate";
import { useCallback, useEffect, useState } from "react";

const useProcessTranslate = (source: string[]) => {
  const [translations, setTranslations] = useState<string[]>([]);

  const processTranslations = useCallback(
    async (sentences: string[]) => {
      if (translations.length === sentences.length) return;

      const untranslatedSentences = sentences.slice(translations.length);
      const newTranslations = await Promise.all(
        untranslatedSentences.map(translate)
      );
      setTranslations((prev) => [...prev, ...newTranslations]);
    },
    [translations]
  );

  useEffect(() => {
    const translatedText = async () => {
      await processTranslations(source);
    };

    if (source.length === 0) return;

    translatedText();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  return { translations };
};

export { useProcessTranslate };
