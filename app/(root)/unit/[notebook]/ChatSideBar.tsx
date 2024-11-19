import { useRef, useState, useEffect } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Check, Copy, Send, Bot } from "lucide-react";

import { UserButton } from "@clerk/nextjs";
import { useChat } from "ai/react";

import ClusterMenu from "./DropDownMenu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
};

export function ChatSideBar() {
  const params = useParams();
  const page = params.notebook as string;

  const [input, setInput] = useState("");
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggest, setSuggest] = useState<string[]>([
    "Summarize the content of the document",
    "Set questions from the document",
    "10 motivational Quotes",
    "Write a simple python script",
  ]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleSend = async () => {
    //if (!selectedCluster) return;

    setIsLoading(true);
    setChatHistory((prev) => [...prev, { role: "user", content: input }]);

    // Add placeholder for assistant message
    setChatHistory((prev) => [
      ...prev,
      {
        role: "assistant",
        content: "",
        isStreaming: true,
      },
    ]);

    setInput("");

    try {
      const response = await fetch("/api/semantic-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userQuery: input,
          clusterUuid: "",
        }),
      });

      if (!response.ok) {
        throw new Error(response.statusText);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let content = "";

      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        content += text;

        // Update the last message in chat history
        setChatHistory((prev) => {
          const newHistory = [...prev];
          const lastMessage = newHistory[newHistory.length - 1];
          if (lastMessage.role === "assistant") {
            lastMessage.content = content;
          }
          return newHistory;
        });
      }

      // Remove streaming flag when done
      setChatHistory((prev) => {
        const newHistory = [...prev];
        const lastMessage = newHistory[newHistory.length - 1];
        if (lastMessage.role === "assistant") {
          lastMessage.isStreaming = false;
        }
        return newHistory;
      });
    } catch (error) {
      console.error("Error:", error);
      setChatHistory((prev) => {
        const newHistory = [...prev];
        newHistory.pop(); // Remove the streaming message
        return [
          ...newHistory,
          {
            role: "assistant",
            content: "Sorry, an error occurred while processing your request.",
          },
        ];
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <div className="w-10 h-10 border rounded-full flex items-center justify-center absolute bottom-8 right-8 ">
          <Bot />
        </div>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Chat</SheetTitle>
        </SheetHeader>
        <>
          <div className="w-fit h-6 rounded-md px-1 my-2 flex items-center justify-around bg-primary text-primary-foreground">
            <Link href="#" className="text-sm">
              Knowledge Base
            </Link>
            <div className="h-full w-px bg-slate-500 mx-1" />
            <ClusterMenu
              unitId={page}
              selectedCluster={selectedCluster}
              setSelectedCluster={setSelectedCluster}
            />
          </div>
          {/* Suggestion Chips */}
          {chatHistory.length === 0 && (
            <>
              <h1 className="m-2 text-4xl mt-6 bg-clip-text text-transparent bg-gradient-to-r from-slate-500 to-slate-900">
                What would you like to know?
              </h1>
              <div className="grid grid-cols-2 gap-4 w-2/3">
                {suggest.map((suggestion, index) => (
                  <p
                    key={index}
                    className="flex items-center justify-center p-2 border rounded-lg hover:bg-accent min-h-16 cursor-pointer"
                    onClick={() => setInput(suggestion)}
                  >
                    {suggestion}
                  </p>
                ))}
              </div>
            </>
          )}
          <div className="p-4 flex flex-col gap-4 items-center">
            <div className="w-full flex flex-col gap-2 overflow-y-auto max-h-[70vh]">
              {chatHistory.map((chat, index) => (
                <div key={index} className="w-full flex justify-start">
                  <div className="relative flex items-start space-x-2">
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
                      <Markdown
                        className={"prose lg:prose-xl"}
                        remarkPlugins={[remarkGfm]}
                      >
                        {chat.content}
                      </Markdown>
                      {isLoading && <span className="animate-pulse">▋</span>}
                      {chat.role === "assistant" && !isLoading && (
                        <div className="mt-2">
                          <CopyToClipboard text={chat.content} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div className="absolute bottom-4 left-1/2 flex w-3/4 max-w-lg -translate-x-1/2 items-center space-x-2">
              <Input
                type="text"
                value={input}
                placeholder="Ask me anything..."
                ref={inputRef}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isLoading && input.length >= 2) {
                    handleSend();
                  }
                }}
              />
              <Button
                onClick={handleSend}
                disabled={isLoading || input.length < 2}
                className="rounded-md"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </>
      </SheetContent>
    </Sheet>
  );
}

function CopyToClipboard({ text }: { text: string }) {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = () => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" onClick={copyToClipboard}>
            {isCopied ? (
              <Check className="w-5 h-5 text-green-500" />
            ) : (
              <Copy className="w-5 h-5 hover:scale-110" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Copy to clipboard</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
