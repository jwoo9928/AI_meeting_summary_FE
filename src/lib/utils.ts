import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to convert ReadableStream<Uint8Array> to AsyncIterable<string>
// This function now parses the specific JSON streaming format.
export async function* streamToAsyncIterable(stream: ReadableStream<Uint8Array>): AsyncIterable<string> {
  const reader = stream.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      console.log("Stream read value:", value, "done:", done);
      if (done) {
        // Process any remaining buffer content if the stream ends mid-line
        if (buffer.startsWith('data: ')) {
          try {
            const jsonString = buffer.substring(5); // Remove "data: " prefix
            const parsed = JSON.parse(jsonString);
            if (parsed.type === "content" && typeof parsed.content === 'string') {
              yield parsed.content;
            }
          } catch (e) {
            console.error("Error parsing remaining JSON from stream:", e, buffer);
          }
        }
        break;
      }

      buffer += value;
      let newlineIndex;
      while ((newlineIndex = buffer.indexOf('\n')) >= 0) {
        const line = buffer.substring(0, newlineIndex).trim();
        buffer = buffer.substring(newlineIndex + 1);

        if (line.startsWith('data: ')) {
          try {
            const jsonString = line.substring(5); // Remove "data: " prefix
            if (jsonString.length > 0) { // Ensure there's something to parse
              const parsed = JSON.parse(jsonString);
              if (parsed.type === "content" && typeof parsed.content === 'string') {
                yield parsed.content;
              } else if (parsed.type === "end") {
                // Optional: handle end message if needed, though loop termination on 'done' is primary
                console.log("Stream end message received:", parsed.data?.message);
                // Potentially break or return here if "end" means immediate stop regardless of 'done'
              }
            }
          } catch (e) {
            console.error("Error parsing JSON from stream:", e, line);
            // Decide how to handle parse errors, e.g., skip malformed line
          }
        }
      }
    }
  } catch (error) {
    console.error("Error reading from stream:", error);
  } finally {
    reader.releaseLock();
  }
}
