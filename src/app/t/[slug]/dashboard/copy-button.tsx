"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      onClick={handleCopy}
      className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm hover:bg-muted transition-colors"
    >
      {copied ? (
        <><Check className="h-3.5 w-3.5 text-green-500" /> Copiado</>
      ) : (
        <><Copy className="h-3.5 w-3.5" /> Copiar</>
      )}
    </button>
  );
}
