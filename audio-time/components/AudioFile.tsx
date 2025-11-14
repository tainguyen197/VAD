"use client";

import { audioFileToPCM } from "@/app/helpers/audioFileToPCM";
import { pcmToWav } from "@/app/helpers/pcmToWav";
import {
  useGeminiLiveAudio,
  useGeminiLiveMessages,
  useGeminiLiveWebSocket,
} from "@/contexts/GeminiLiveWebSocketContext";
import useAudio from "@/hooks/useAudio";
import { useRef, useState } from "react";

const AudioFile = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { addAudioChunk } = useAudio({
    autoPlay: true,
    sampleRate: 24000,
  });

  const { sendAudio, sendSpeechStart, sendSpeechEnd } =
    useGeminiLiveWebSocket();

  useGeminiLiveMessages((data) => {
    // console.log("🌟 Processing Gemini message:", data);
    // const newText = data.serverContent?.modelTurn?.parts?.[0]?.text;
    // if (newText) {
    //   console.log("🌟 New Gemini transcript:", newText);
    // }
  });

  useGeminiLiveAudio((audio: { mimeType: string; data: string }) => {
    // base64 to blob
    const blob = pcmToWav(audio.data, 24000, 1);
    addAudioChunk(blob);
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      setFileName(file.name);
      setIsProcessing(true);
      setProgress(0);

      const pcm = await audioFileToPCM(file);
      await streamAudio(pcm, 3200, 100);

      setIsProcessing(false);
      setProgress(100);
    }
  };

  const streamAudio = async (
    pcm: ArrayBuffer,
    chunkSize: number,
    delayMs: number
  ) => {
    const int16Array = new Int16Array(pcm);
    const totalSamples = int16Array.length;

    sendSpeechStart();

    for (let i = 0; i < totalSamples; i += chunkSize) {
      console.log(`🔊 Sending chunk ${i}`);
      const chunkEnd = Math.min(i + chunkSize, totalSamples);
      const chunk = int16Array.slice(i, chunkEnd);

      const chunkBuffer = chunk.buffer.slice(
        chunk.byteOffset,
        chunk.byteOffset + chunk.byteLength
      );

      sendAudio(chunkBuffer);

      // Update progress
      const currentProgress = Math.floor((i / (totalSamples / 4)) * 100);
      setProgress(currentProgress);

      if (i + chunkSize < totalSamples) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    sendSpeechEnd();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("audio/")) {
      setFileName(file.name);
      setIsProcessing(true);
      setProgress(0);

      const pcm = await audioFileToPCM(file);
      await streamAudio(pcm, 3200, 100);

      setIsProcessing(false);
      setProgress(100);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-8">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleUploadClick}
        className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-12 border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all duration-300 cursor-pointer group hover:shadow-2xl"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          {/* Icon */}
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-28 h-28 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          {/* Text */}
          <div className="text-center">
            <p className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {isProcessing ? "Processing Audio..." : "Upload Audio File"}
            </p>
            <p className="text-gray-500 dark:text-gray-400">
              Drag and drop your audio file here, or click to browse
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Supports MP3, WAV, OGG, and more
            </p>
          </div>

          {/* File Name Display */}
          {fileName && (
            <div className="flex items-center space-x-2 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-full">
              <svg
                className="w-5 h-5 text-indigo-600 dark:text-indigo-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                />
              </svg>
              <span className="text-sm font-medium text-indigo-900 dark:text-indigo-300">
                {fileName}
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {isProcessing && progress > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Streaming to AI
              </span>
              <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                {progress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Processing Status */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
          <div className="flex items-center space-x-4">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                isProcessing
                  ? "bg-yellow-100 dark:bg-yellow-900/30"
                  : "bg-green-100 dark:bg-green-900/30"
              }`}
            >
              {isProcessing ? (
                <svg
                  className="w-6 h-6 text-yellow-600 dark:text-yellow-400 animate-pulse"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Upload Status
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {isProcessing ? "Processing..." : "Ready"}
              </p>
            </div>
          </div>
        </div>

        {/* AI Response Status */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
          <div className="flex items-center space-x-4">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${"bg-purple-100 dark:bg-purple-900/30 animate-pulse"}`}
            >
              <svg
                className={`w-6 h-6 ${"text-purple-600 dark:text-purple-400"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                AI Response
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                Speaking...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioFile;
