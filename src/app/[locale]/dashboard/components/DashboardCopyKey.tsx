"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export default function DashboardCopyKey({ platformKey, copyText }: { platformKey: string; copyText: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(platformKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2 mt-4 bg-black/5 dark:bg-black/40 p-1.5 rounded-xl border border-zinc-200 dark:border-white/10">
      <code className="text-sm font-mono flex-1 px-3 text-zinc-800 dark:text-zinc-200 truncate">
        {platformKey}
      </code>
      <button
        onClick={handleCopy}
        className="flex items-center justify-center p-2 rounded-lg bg-white dark:bg-white/10 hover:bg-zinc-100 dark:hover:bg-white/20 transition-all text-zinc-700 dark:text-zinc-300 shadow-sm"
        title={copyText}
      >
        {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}
