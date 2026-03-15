"use client";

import { useTransition } from "react";
import { deleteTokenAction } from "@/actions/token";

export default function TokenList({
  tokens,
  noTokensText,
  contributedText,
  revokeText,
  confirmRevokeText,
}: {
  tokens: any[];
  noTokensText: string;
  contributedText: string;
  revokeText: string;
  confirmRevokeText: string;
}) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    if (confirm(confirmRevokeText)) {
      startTransition(async () => {
        await deleteTokenAction(id);
      });
    }
  };

  if (tokens.length === 0) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">{noTokensText}</p>;
  }

  return (
    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {tokens.map((token) => (
        <li key={token.id} className="p-4 rounded-xl bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                {token.provider}
              </span>
              <p className="font-mono text-sm text-zinc-800 dark:text-zinc-200 mt-2 truncate w-32">
                ...{token.key.slice(-4)}
              </p>
            </div>
            
            <span className={`text-xs px-2 py-1 rounded-full ${token.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
              {token.status}
            </span>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-200 dark:border-white/5">
            <div className="text-xs text-zinc-500">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">{token.totalUsedTokens}</span> {contributedText}
            </div>
            <button
              disabled={isPending}
              onClick={() => handleDelete(token.id)}
              className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
            >
              {revokeText}
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
