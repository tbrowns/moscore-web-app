import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@radix-ui/react-tooltip";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";

export default function CopyToClipboard({ text }: { text: string }) {
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
