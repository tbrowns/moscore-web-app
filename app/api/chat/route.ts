import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { findRelevantContent } from "@/lib/ai/embedding";

const openai = createOpenAI({
  compatibility: "compatible",
  baseURL: "https://glhf.chat/api/openai/v1",
  apiKey: process.env.GLHF_API_KEY,
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();
  const userQuery = messages[messages.length - 1].content;

  const contents = await findRelevantContent(userQuery);

  const result = await streamText({
    model: openai("hf:mistralai/Mistral-7B-Instruct-v0.3"),
    messages,
    system: `You are a RAG chabot that answers question based on the following context:\n\n${contents}\n\nQuestion: ${userQuery}`,
  });

  return result.toDataStreamResponse();
}
