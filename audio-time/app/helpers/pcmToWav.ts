// app/helpers/pcmToWav.ts

export function pcmToWav(
  base64Pcm: string,
  sampleRate: number,
  numChannels: number = 1,
  bitDepth: number = 16
): Blob {
  // Decode base64 to bytes
  const binaryString = atob(base64Pcm);
  const pcmData = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    pcmData[i] = binaryString.charCodeAt(i);
  }

  const numSamples = pcmData.length / (bitDepth / 8);
  const byteRate = sampleRate * numChannels * (bitDepth / 8);
  const blockAlign = numChannels * (bitDepth / 8);

  // Create WAV header (44 bytes)
  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);

  // "RIFF" chunk descriptor
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + pcmData.length, true); // File size - 8
  writeString(view, 8, "WAVE");

  // "fmt " sub-chunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, byteRate, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, bitDepth, true); // BitsPerSample

  // "data" sub-chunk
  writeString(view, 36, "data");
  view.setUint32(40, pcmData.length, true); // Subchunk2Size

  // Combine header and PCM data
  const wavData = new Uint8Array(44 + pcmData.length);
  wavData.set(new Uint8Array(wavHeader), 0);
  wavData.set(pcmData, 44);

  return new Blob([wavData], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}