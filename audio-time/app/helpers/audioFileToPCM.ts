// app/helpers/audioFileToPCM.ts

export async function audioFileToPCM(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;

        // Create AudioContext to decode the audio file
        const audioContext = new AudioContext({ sampleRate: 16000 });
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Convert to 16-bit PCM
        const pcmData = new Int16Array(audioBuffer.length);
        for (let i = 0; i < audioBuffer.length; i++) {
          // Clamp and convert float32 (-1 to 1) to int16
          const s = Math.max(-1, Math.min(1, audioBuffer.getChannelData(0)[i]));
          pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        resolve(pcmData.buffer);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
