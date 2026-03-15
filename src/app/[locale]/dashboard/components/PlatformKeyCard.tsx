"use client";

import { useState } from "react";
import { Check, Copy, RefreshCw } from "lucide-react";
import { resetPlatformKeyAction } from "@/actions/user";

export default function PlatformKeyCard({
  platformKey,
  copyText,
  resetText,
  confirmResetText,
  label,
}: {
  platformKey: string;
  copyText: string;
  resetText: string;
  confirmResetText: string;
  label: string;
}) {
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [currentKey, setCurrentKey] = useState(platformKey);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = async () => {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 5000); // auto-cancel after 5s
      return;
    }
    setResetting(true);
    const result = await resetPlatformKeyAction();
    if (result.success && result.newKey) {
      setCurrentKey(result.newKey);
    }
    setResetting(false);
    setConfirming(false);
  };

  return (
    <div className="relative overflow-hidden p-6 rounded-2xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">{label}</h3>
        <button
          onClick={handleReset}
          disabled={resetting}
          className={`text-xs px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${
            confirming
              ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 font-medium"
              : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10"
          }`}
        >
          <RefreshCw className={`w-3 h-3 ${resetting ? "animate-spin" : ""}`} />
          {confirming ? confirmResetText : resetText}
        </button>
      </div>
      <div className="flex items-center gap-2 mt-4 bg-black/5 dark:bg-black/40 p-1.5 rounded-xl border border-zinc-200 dark:border-white/10">
        <code className="text-sm font-mono flex-1 px-3 text-zinc-800 dark:text-zinc-200 truncate">
          {currentKey}
        </code>
        <button
          onClick={handleCopy}
          className="flex items-center justify-center p-2 rounded-lg bg-white dark:bg-white/10 hover:bg-zinc-100 dark:hover:bg-white/20 transition-all text-zinc-700 dark:text-zinc-300 shadow-sm"
          title={copyText}
        >
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
