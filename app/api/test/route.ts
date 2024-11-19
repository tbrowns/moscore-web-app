import { OpenAIStream, StreamingTextResponse } from "ai";
import OpenAI from "openai";

export const runtime = "edge";

export async function POST(req: Request): Promise<Response> {
  if (!process.env.GLHF_API_KEY) {
    throw new Error("Missing GLHF_API_KEY environment variable");
  }

  let { prompt } = await req.json();

  const openai = new OpenAI({
    apiKey: process.env.GLHF_API_KEY,
    baseURL: "https://glhf.chat/api/openai/v1",
  });

  const response = await openai.chat.completions.create({
    model: "hf:mistralai/Mistral-7B-Instruct-v0.3",
    messages: [
      {
        role: "system",
        content:
          "You are an AI writing assistant that continues existing text based on context from prior text. " +
          "Give more weight/priority to the later characters than the beginning ones. " +
          "Limit your response to no more than 200 characters, but make sure to construct complete sentences.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.7,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    stream: true,
    n: 1,
  });

  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response);

  console.log(stream);

  // Respond with the stream
  return new StreamingTextResponse(stream);
}
