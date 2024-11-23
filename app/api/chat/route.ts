import { createOpenAI } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import { z } from "zod";
import { findRelevantContent } from "@/lib/ai/embedding";

const openai = createOpenAI({
  compatibility: "compatible",
  baseURL: "https://glhf.chat/api/openai/v1",
  apiKey: process.env.GLHF_API_KEY,
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, clusterId } = await req.json();
  const userQuery = messages[messages.length - 1].content;
  console.log(clusterId);

  const contents = await findRelevantContent(userQuery, clusterId);
  const systemMessage =
    contents.length == 0
      ? ` `
      : `Answer the question based on the following context:\n\n${contents}`;

  const result = await streamText({
    model: openai("hf:mistralai/Mistral-7B-Instruct-v0.3"),
    messages,
    system: `You are a helpful assistant. ${systemMessage}`,
  });

  return result.toDataStreamResponse();
}
