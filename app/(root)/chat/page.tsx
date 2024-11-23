"use client";
import React, { useRef, useState, useEffect } from "react";
import { Bot, CircleStop, Send, AlertTriangle } from "lucide-react";

import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

import CopyToClipboard from "@/components/shared/CopyToClipboard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import "@/app/globals.css";
import { UserButton } from "@clerk/nextjs";
import { useChat } from "ai/react";
import { SelectCluster } from "./SelectCluster";

export default function ChatPage() {
  const [clusterId, setClusterId] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [suggest, setSuggest] = useState<string[]>([
    "Analyze this document",
    "Generate python code snippet",
    "Create project plan",
    "Solve a technical problem",
    "Explain a complex concept",
    "Brainstorm project ideas",
  ]);

  const { messages, input, handleInputChange, handleSubmit, isLoading, stop } =
    useChat({
      onError: (error) => {
        console.error("Chat error:", error);
        setError(
          error instanceof Error
            ? error.message
            : "An unexpected error occurred"
        );
      },
      body: {
        // Default additional data that can be sent with every request
        clusterId: clusterId,
      },
    });

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = localStorage.getItem("selectedClusterId");
    setClusterId(id || "none");
    console.log(clusterId);
  }, [clusterId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const modifyInput = (inputValue: string) => {
    if (inputRef.current) {
      inputRef.current.value = inputValue;
      handleInputChange({
        target: { value: inputValue },
      } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const submitWithAdditionalData = (event?: React.FormEvent) => {
    setError(null);
    if (event) {
      event.preventDefault();
    }

    if (input.trim()) {
      handleSubmit(event, {
        // Optional: send additional data with this specific request
        body: {
          extra: {
            timestamp: new Date().toISOString(),
            userContext: {
              clusterId,
              messageCount: messages.length,
            },
          },
        },
        // Optional: add custom headers
        headers: {
          "X-Custom-Header": "ChatPage-Request",
        },
      });
    }
  };

  return (
    <div className="p-4 flex flex-col gap-4 items-center relative h-full">
      <h1 className="text-2xl font-bold">Chat with Assistant</h1>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="w-full max-w-2xl">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Suggestion Chips */}
      {messages.length === 0 && (
        <>
          <h1 className="m-2 text-4xl mt-6 bg-clip-text text-transparent bg-gradient-to-r from-slate-500 to-slate-900">
            What would you like to explore?
          </h1>
          <div className="grid grid-cols-2 gap-4 w-2/3">
            {suggest.map((suggestion, index) => (
              <p
                key={index}
                className="flex items-center justify-center p-2 border rounded-lg hover:bg-accent min-h-16 cursor-pointer text-center"
                onClick={() => modifyInput(suggestion)}
              >
                {suggestion}
              </p>
            ))}
          </div>
        </>
      )}

      {/* Chat History */}
      <div className="flex flex-col items-center px-20 gap-2 w-full">
        {messages.map((chat, index) => (
          <div
            key={index}
            className={`w-full flex ${
              chat.role === "user" ? "justify-end" : "justify-start"
            } `}
          >
            <div
              className={`relative w-fit flex items-start space-x-2 max-w-[80%] ${
                chat.role === "user" ? "flex-row-reverse space-x-reverse" : ""
              }`}
            >
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  chat.role === "user" ? "" : "bg-gray-200"
                }`}
              >
                {chat.role === "user" ? (
                  <UserButton />
                ) : (
                  <Bot className="w-5 h-5 text-gray-600" />
                )}
              </div>
              <div
                className={`px-4 py-2 rounded-md whitespace-pre-wrap ${
                  chat.role === "user"
                    ? "text-right bg-primary text-white"
                    : "text-left bg-secondary"
                }`}
              >
                {chat.role === "assistant" ? (
                  <Markdown
                    className={"prose prose-xs"}
                    remarkPlugins={[remarkGfm]}
                  >
                    {chat.content}
                  </Markdown>
                ) : (
                  chat.content
                )}

                {chat.role === "assistant" &&
                  (isLoading ? (
                    <span className="animate-pulse">▋</span>
                  ) : (
                    <div className="mt-2">
                      <CopyToClipboard text={chat.content} />
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ))}
        {false && (
          <div className="spinner">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white fixed bottom-4 left-1/2 flex w-full max-w-lg -translate-x-1/2 items-center space-x-2">
        <Input
          type="text"
          value={input}
          ref={inputRef}
          placeholder="Ask me anything"
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isLoading) {
              handleSubmit();
            }
          }}
        />

        {isLoading ? (
          <button
            onClick={stop}
            className="w-16 h-9 flex justify-center items-center rounded-md bg-muted text-black"
          >
            <CircleStop className="animate-pulse" size={24} />
          </button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !input.trim()}
            className="rounded-md"
          >
            <Send className="w-5 h-5" />
          </Button>
        )}

        <Button>
          <SelectCluster />
        </Button>
      </div>
    </div>
  );
}
