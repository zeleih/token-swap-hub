"use client";

import { useActionState, useEffect, useState } from "react";
import { Check, Copy, RefreshCw } from "lucide-react";
import { resetPlatformKeyAction } from "@/actions/user";

export default function PlatformKeyCard({
  platformKey,
  copyText,
  resetText,
  resetDoneText,
  confirmResetText,
  label,
}: {
  platformKey: string;
  copyText: string;
  resetText: string;
  resetDoneText: string;
  confirmResetText: string;
  label: string;
}) {
  const [copied, setCopied] = useState(false);
  const [currentKey, setCurrentKey] = useState(platformKey);
  const [state, action, isPending] = useActionState(resetPlatformKeyAction, undefined);

  useEffect(() => {
    if (state?.success && state.newKey) {
      setCurrentKey(state.newKey);
    }
  }, [state]);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative overflow-hidden p-6 rounded-2xl bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">{label}</h3>
        <form action={action}>
          <button
            type="submit"
            onClick={(event) => {
              if (!window.confirm(confirmResetText)) {
                event.preventDefault();
              }
            }}
            disabled={isPending}
            className="text-xs px-2 py-1 rounded-lg transition-all flex items-center gap-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/10 disabled:opacity-60"
          >
            <RefreshCw className={`w-3 h-3 ${isPending ? "animate-spin" : ""}`} />
            {resetText}
          </button>
        </form>
      </div>
      {state?.error && (
        <p className="mt-2 text-xs text-red-500">{state.error}</p>
      )}
      {state?.success && (
        <p className="mt-2 text-xs text-emerald-500">{resetDoneText}</p>
      )}
      <div className="flex items-center gap-2 mt-4 bg-black/5 dark:bg-black/40 p-1.5 rounded-xl border border-zinc-200 dark:border-white/10">
        <code className="text-sm font-mono flex-1 px-3 text-zinc-800 dark:text-zinc-200 truncate">
          {currentKey}
        </code>
        <button
          type="button"
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
