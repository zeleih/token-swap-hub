"use client";

import { useTransition } from "react";
import { deleteTokenAction, toggleTokenAction } from "@/actions/token";

export default function TokenList({
  tokens,
  noTokensText,
  contributedText,
  revokeText,
  confirmRevokeText,
  pauseText,
  resumeText,
  usageLimitText,
  unlimitedText,
  directedBadge,
}: {
  tokens: any[];
  noTokensText: string;
  contributedText: string;
  revokeText: string;
  confirmRevokeText: string;
  pauseText: string;
  resumeText: string;
  usageLimitText: string;
  unlimitedText: string;
  directedBadge: string;
}) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    if (confirm(confirmRevokeText)) {
      startTransition(async () => {
        await deleteTokenAction(id);
      });
    }
  };

  const handleToggle = (id: string) => {
    startTransition(async () => {
      await toggleTokenAction(id);
    });
  };

  if (tokens.length === 0) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">{noTokensText}</p>;
  }

  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {tokens.map((token) => {
        const isActive = token.status === "ACTIVE";
        const isPaused = token.status === "PAUSED";
        const limit = token.usageLimit;
        const used = token.totalUsedTokens;

        return (
          <li key={token.id} className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
            isActive
              ? "bg-zinc-50 dark:bg-black/20 border-zinc-200 dark:border-white/10"
              : isPaused
                ? "bg-amber-50/50 dark:bg-amber-900/5 border-amber-200 dark:border-amber-500/20 opacity-70"
                : "bg-red-50/50 dark:bg-red-900/5 border-red-200 dark:border-red-500/20 opacity-60"
          }`}>
            <div className="flex justify-between items-start mb-3">
              <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  {token.provider}
                </span>
                {token.allowedUsers && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                    [{directedBadge}]
                  </span>
                )}
              </div>
                <p className="font-mono text-sm text-zinc-800 dark:text-zinc-200 mt-2 truncate w-32">
                  ...{token.key.slice(-4)}
                </p>
              </div>
              
              <span className={`text-xs px-2 py-1 rounded-full ${
                isActive ? 'bg-emerald-500/10 text-emerald-600'
                : isPaused ? 'bg-amber-500/10 text-amber-600'
                : 'bg-red-500/10 text-red-600'}`}>
                {token.status}
              </span>
            </div>

            {/* Usage stats */}
            <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1 mb-3">
              <div className="flex justify-between">
                <span>{contributedText}</span>
                <span className="font-medium text-zinc-700 dark:text-zinc-300">{used.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>{usageLimitText}</span>
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {limit !== null ? `${used.toLocaleString()} / ${limit.toLocaleString()}` : unlimitedText}
                </span>
              </div>
              {limit !== null && (
                <div className="w-full bg-zinc-200 dark:bg-white/10 rounded-full h-1.5 mt-1">
                  <div
                    className={`h-1.5 rounded-full transition-all ${used >= limit ? 'bg-red-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min(100, (used / limit) * 100)}%` }}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-zinc-200 dark:border-white/5 gap-2">
              {/* Pause/Resume toggle */}
              <button
                disabled={isPending || (!isActive && !isPaused)}
                onClick={() => handleToggle(token.id)}
                className={`text-xs font-medium px-2 py-1 rounded-lg transition-colors disabled:opacity-50 ${
                  isActive
                    ? "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                    : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                }`}
              >
                {isActive ? pauseText : resumeText}
              </button>
              <button
                disabled={isPending}
                onClick={() => handleDelete(token.id)}
                className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
              >
                {revokeText}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
