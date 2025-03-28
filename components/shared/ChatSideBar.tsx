"use client";

import { useRef, useState, useEffect } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Check, Copy, Send, Bot } from "lucide-react";

import { UserButton } from "@clerk/nextjs";
import { useChat } from "ai/react";

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

export function ChatSideBar() {
  const params = useParams();
  const page = params.notebook as string;

  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [suggestions] = useState<string[]>([
    "Summarize the content of the document",
    "Set questions from the document",
    "10 motivational Quotes",
    "Write a simple python script",
  ]);

  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize the chat with the AI SDK
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setInput,
  } = useChat({
    api: "/api/chat", // Make sure this matches your API route
    body: {
      clusterId: selectedCluster, // Pass the selected cluster ID to the API
    },
    onError: (error) => {
      console.error("Chat error:", error);
      setError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    },
  });

  // Handle suggestion clicks
  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    // Small delay to ensure the input is updated before submitting
    setTimeout(() => {
      handleSubmit(new Event("submit") as any);
    }, 100);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <div className="w-10 h-10 border rounded-full flex items-center justify-center absolute bottom-8 right-8 cursor-pointer hover:bg-gray-100">
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
          {messages.length === 0 && (
            <>
              <h1 className="m-2 text-4xl mt-6 bg-clip-text text-transparent bg-gradient-to-r from-slate-500 to-slate-900">
                What would you like to know?
              </h1>
              <div className="grid grid-cols-2 gap-4 w-2/3">
                {suggestions.map((suggestion, index) => (
                  <p
                    key={index}
                    className="flex items-center justify-center p-2 border rounded-lg hover:bg-accent min-h-16 cursor-pointer"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </p>
                ))}
              </div>
            </>
          )}

          <div className="p-4 flex flex-col gap-4 items-center">
            <div className="w-full flex flex-col gap-2 overflow-y-auto max-h-[70vh]">
              {messages.map((message, index) => (
                <div key={index} className="w-full flex justify-start">
                  <div className="relative flex items-start space-x-2">
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === "user" ? "" : "bg-gray-200"
                      }`}
                    >
                      {message.role === "user" ? (
                        <UserButton />
                      ) : (
                        <Bot className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                    <div
                      className={`px-4 py-2 rounded-md whitespace-pre-wrap ${
                        message.role === "user"
                          ? "text-right bg-primary text-white"
                          : "text-left bg-secondary"
                      }`}
                    >
                      <Markdown
                        className={"prose lg:prose-xs"}
                        remarkPlugins={[remarkGfm]}
                      >
                        {message.content}
                      </Markdown>
                      {message.role === "assistant" && (
                        <div className="mt-2">
                          <CopyToClipboard text={message.content} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="w-full flex justify-start">
                  <div className="relative flex items-start space-x-2">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-200">
                      <Bot className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="px-4 py-2 rounded-md bg-secondary">
                      <span className="animate-pulse">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="absolute bottom-4 left-1/2 flex w-3/4 max-w-lg -translate-x-1/2 items-center space-x-2">
              <Input
                type="text"
                value={input}
                placeholder="Ask me anything..."
                ref={inputRef}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isLoading) {
                    handleSubmit(e as any);
                  }
                }}
              />
              <Button
                onClick={(e) => handleSubmit(e as any)}
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

import { supabase } from "@/lib/supabase";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

type Cluster = {
  id: string;
  title: string;
};

export function ClusterMenu({
  unitId,
  selectedCluster,
  setSelectedCluster,
}: {
  unitId: string;
  selectedCluster: string | null;
  setSelectedCluster: (clusterId: string) => void;
}) {
  const [clusterData, setClusterData] = useState<Cluster | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data: cluster, error: clusterError } = await supabase
          .from("clusters")
          .select("id, title")
          .eq("unit_id", unitId)
          .single();

        if (clusterError) {
          console.error("Error fetching cluster:", clusterError);
        } else {
          setClusterData(cluster);
          // Auto-select the cluster if there's only one
          if (cluster && !selectedCluster) {
            setSelectedCluster(cluster.id);
          }
        }
      } catch (error) {
        console.error("Error fetching cluster:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (unitId) {
      fetchData();
    }
  }, [unitId, selectedCluster, setSelectedCluster]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center cursor-pointer">
          {isLoading ? "Loading..." : clusterData?.title || "Select Cluster"}
          <ChevronDown size={16} className="ml-1" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Clusters</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={selectedCluster ?? undefined}
          onValueChange={setSelectedCluster}
        >
          {clusterData && (
            <DropdownMenuRadioItem value={clusterData.id}>
              {clusterData.title}
            </DropdownMenuRadioItem>
          )}
          {!clusterData && !isLoading && (
            <div className="px-2 py-1 text-sm text-gray-500">
              No clusters available
            </div>
          )}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
