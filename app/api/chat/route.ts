import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { findRelevantContent } from "@/lib/ai/embedding";

const openai = createOpenAI({
  compatibility: "compatible",
  baseURL: "https://glhf.chat/api/openai/v1",
  apiKey: "glhf_38c1f2ab18e63c00638e03d90e357b0b",
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, clusterId } = await req.json();
  const userQuery = messages[messages.length - 1].content;
  console.log("Processing query with clusterId:", clusterId);

  try {
    // Get relevant content using the embedding system
    let contextContent = "";
    if (clusterId) {
      contextContent = (await findRelevantContent(userQuery, clusterId)) || "";
      console.log("Found relevant content:", contextContent ? "Yes" : "No");
    }

    const systemMessage = contextContent
      ? `You are a helpful assistant. Answer the question based on the following context:\n\n${contextContent}`
      : `You are a helpful assistant. If you don't know the answer, just say that you don't know.`;

    const result = await streamText({
      model: openai("hf:mistralai/Mistral-7B-Instruct-v0.3"),
      messages,
      system: systemMessage,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error in chat API:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process chat request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
