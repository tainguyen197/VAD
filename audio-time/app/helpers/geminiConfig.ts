import {
  ActivityHandling,
  LiveClientSetup,
  MediaResolution,
  Modality,
} from "@google/genai";

const createGeminiConfig = (
  sessionHandle?: string
): { setup: LiveClientSetup } => {
  return {
    setup: {
      model: "models/gemini-2.5-flash-native-audio-preview-09-2025",
      generationConfig: {
        responseModalities: [Modality.AUDIO],
        mediaResolution: MediaResolution.MEDIA_RESOLUTION_MEDIUM,
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Zephyr",
            },
          },
        },
      },
      sessionResumption: {
        handle: sessionHandle,
      },
      realtimeInputConfig: {
        activityHandling: ActivityHandling.NO_INTERRUPTION,
        automaticActivityDetection: { disabled: true },
      },
      systemInstruction: {
        parts: [
          {
            text: `You are a translator. Translate everything I say from English into Vietnamese and speak the translation out loud.`,
          },
        ],
      },
    },
  };
};

export default createGeminiConfig;
