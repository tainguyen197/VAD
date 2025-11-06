import { GeminiProviders } from "../gemini-providers";

export default function GeminiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GeminiProviders>{children}</GeminiProviders>;
}
