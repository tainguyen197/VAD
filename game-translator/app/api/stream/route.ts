import { startGameTranslator, Translation } from "../translate/route";

let stopTranslator: (() => void) | null = null;

export async function GET() {
  const encoder = new TextEncoder();

  // Create a stream
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send initial connection message
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ status: "connected" })}\n\n`)
        );

        // Initialize translator
        stopTranslator = await startGameTranslator((translation: Translation) => {
          // Send translation to client
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(translation)}\n\n`)
          );
        });

        console.log("🎮 Stream started successfully");
      } catch (error) {
        console.error("❌ Error starting translator:", error);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: "Failed to start translator" })}\n\n`
          )
        );
        controller.close();
      }
    },
    cancel() {
      console.log("🔌 Client disconnected");
      if (stopTranslator) {
        stopTranslator();
        stopTranslator = null;
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}