import { Ratelimit } from "@upstash/ratelimit";
import { kv } from "@vercel/kv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { StreamingTextResponse } from "ai";

export const runtime = "edge";

const CACHE_DURATION = 60 * 60; // 1 hour in seconds

export async function POST(req: Request): Promise<Response> {
  // This API route is responsible for generating text based on a user's input
  // It takes a JSON object with a "prompt" property containing the user's text
  // and an "option" property indicating which AI operation to perform on the text
  // (e.g. continue the story, improve the text, shorten the text, etc.)
  // The API also supports a "command" property which is used in conjunction with the "zap" option
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",

      generationConfig: {
        candidateCount: 1,
        stopSequences: ["x"],
        maxOutputTokens: 200,
        temperature: 1.0,
      },
    });

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Missing GEMINI_API_KEY");
    }

    // Rate limiting with proper error handling
    // This is to prevent abuse of the API
    // If the KV_REST_API_URL and KV_REST_API_TOKEN environment variables are set
    // then use the KV API to rate limit the requests
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      const ip = req.headers.get("x-forwarded-for");
      const ratelimit = new Ratelimit({
        redis: kv,
        limiter: Ratelimit.slidingWindow(50, "1 d"),
      });

      const { success, limit, reset, remaining } = await ratelimit.limit(
        `novel_ratelimit_${ip}`
      );

      if (!success) {
        // If the rate limit has been exceeded, return a 429 response
        // with the rate limit headers
        return new Response("Rate limit exceeded", {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
            "Cache-Control": "no-store",
          },
        });
      }
    }

    // Get the request body as a JSON object
    const { prompt, option, command } = await req.json();
    console.log("Request body:", { prompt, option, command });

    // Validate input
    // If the "prompt" property is not present, throw an error
    if (!prompt) {
      throw new Error("Missing prompt");
    }

    // System prompts are the default text that the AI will generate if the user doesn't provide any text
    // The "continue" option is the default AI operation
    const systemPrompts = {
      continue:
        "You are an AI writing assistant that continues existing text based on context from prior text. Give more weight/priority to the later characters than the beginning ones. Limit your response to no more than 200 characters, but make sure to construct complete sentences. Use Markdown formatting when appropriate.",
      improve:
        "You are an AI writing assistant that improves existing text. Limit your response to no more than 200 characters, but make sure to construct complete sentences. Use Markdown formatting when appropriate.",
      shorter:
        "You are an AI writing assistant that shortens existing text. Use Markdown formatting when appropriate.",
      longer:
        "You are an AI writing assistant that lengthens existing text. Use Markdown formatting when appropriate.",
      fix: "You are an AI writing assistant that fixes grammar and spelling errors in existing text. Limit your response to no more than 200 characters, but make sure to construct complete sentences. Use Markdown formatting when appropriate.",
      zap: "You are an AI writing assistant that generates text based on a prompt. You take an input from the user and a command for manipulating the text. Use Markdown formatting when appropriate.",
    };

    // The user prompt is the text that the user provides
    // If the user provides a command, the prompt will be the command with the user's text appended to it
    // If the user does not provide a command, the prompt will just be the user's text
    const userPrompt =
      option === "zap"
        ? `For this text: ${prompt}. You have to respect the command: ${command}`
        : option === "improve" ||
          option === "shorter" ||
          option === "longer" ||
          option === "fix"
        ? `The existing text is: ${prompt}`
        : prompt;

    // The full prompt is the combination of the system prompt and the user prompt
    const fullPrompt = `${
      systemPrompts[option as keyof typeof systemPrompts] || ""
    }\n\nUser: ${userPrompt}`;

    // Generate content stream with error handling
    const result = await model.generateContentStream(fullPrompt);

    // Create a ReadableStream with proper error handling
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(new TextEncoder().encode(text));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    // Return streaming response with appropriate headers
    return new StreamingTextResponse(stream, {
      headers: {
        "Cache-Control": `public, s-maxage=${CACHE_DURATION}`,
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    // If there's an error, log it and return a 500 response
    console.error("Error in generate route:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate content" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
